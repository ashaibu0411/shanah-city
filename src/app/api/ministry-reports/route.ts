import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  assertCanSubmitForGroup,
  canReviewMinistryReports,
  canSubmitMinistryReports,
  getLeaderMinistryGroups,
} from "@/lib/ministry-report-access-server";
import {
  getMinistryReport,
  listMinistryReports,
  reviewMinistryReport,
  saveMinistryReport,
  summarizeMinistryReports,
} from "@/lib/ministry-report-server";
import {
  currentReportMonth,
  getReportTemplateForGroup,
  type MinistryReportResponses,
} from "@/lib/ministry-report-types";

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  return { user };
}

function parseResponses(body: Record<string, unknown>): MinistryReportResponses {
  if (!body.responses || typeof body.responses !== "object" || Array.isArray(body.responses)) {
    return {};
  }
  const responses: MinistryReportResponses = {};
  for (const [key, value] of Object.entries(body.responses)) {
    if (typeof value === "number" || typeof value === "string") {
      responses[key] = value;
    }
  }
  return responses;
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const reportMonth = searchParams.get("reportMonth") ?? undefined;
  const groupId = searchParams.get("groupId") ?? undefined;
  const summaryMonth = searchParams.get("summaryMonth") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;

  const [canSubmit, canReview, leaderGroups] = await Promise.all([
    canSubmitMinistryReports(auth.user!),
    canReviewMinistryReports(auth.user!),
    getLeaderMinistryGroups(auth.user!.id),
  ]);

  if (!canSubmit && !canReview) {
    return NextResponse.json(
      { error: "Ministry leader or pastoral access required." },
      { status: 403 },
    );
  }

  if (summaryMonth) {
    if (!canReview) {
      return NextResponse.json({ error: "Pastoral review access required." }, { status: 403 });
    }
    const summary = await summarizeMinistryReports(summaryMonth);
    return NextResponse.json({ summary, canSubmit, canReview, leaderGroups });
  }

  if (reportMonth && groupId) {
    const report = await getMinistryReport(reportMonth, groupId);
    if (report) {
      const isLeader = leaderGroups.some((group) => group.id === groupId);
      if (!canReview && !isLeader) {
        return NextResponse.json({ error: "You cannot view this report." }, { status: 403 });
      }
    }
    const group = leaderGroups.find((entry) => entry.id === groupId);
    const template = group?.template ?? (report ? getReportTemplateForGroup({ id: groupId, name: report.groupName }) : null);
    return NextResponse.json({ report, template, canSubmit, canReview, leaderGroups });
  }

  const reports = await listMinistryReports({
    reportMonth,
    groupId,
    since,
    until,
  });

  const visibleReports = canReview
    ? reports
    : reports.filter((report) => leaderGroups.some((group) => group.id === report.groupId));

  return NextResponse.json({
    reports: visibleReports,
    canSubmit,
    canReview,
    leaderGroups,
    defaultMonth: currentReportMonth(),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");
  const reportMonth = String(body.reportMonth ?? currentReportMonth()).trim();
  const groupId = String(body.groupId ?? "").trim();
  const leaderNotes = body.leaderNotes ? String(body.leaderNotes) : undefined;
  const responses = parseResponses(body);

  if (!/^\d{4}-\d{2}$/.test(reportMonth)) {
    return NextResponse.json({ error: "Report month must be YYYY-MM." }, { status: 400 });
  }

  if (!groupId) {
    return NextResponse.json({ error: "Ministry group is required." }, { status: 400 });
  }

  try {
    if (action === "review" || action === "return") {
      if (!(await canReviewMinistryReports(auth.user!))) {
        return NextResponse.json({ error: "Pastoral review access required." }, { status: 403 });
      }

      const report = await reviewMinistryReport({
        reportMonth,
        groupId,
        action: action === "return" ? "return" : "review",
        reviewerNotes: body.reviewerNotes ? String(body.reviewerNotes) : undefined,
        actionSteps: body.actionSteps ? String(body.actionSteps) : undefined,
        actor: { id: auth.user!.id, name: auth.user!.name },
      });

      if (!report) {
        return NextResponse.json({ error: "Report not found." }, { status: 404 });
      }

      return NextResponse.json({ report });
    }

    const leaderGroup = await assertCanSubmitForGroup(auth.user!.id, groupId);
    const status = action === "submit" ? "submitted" : "draft";

    const report = await saveMinistryReport({
      reportMonth,
      groupId,
      groupName: leaderGroup.name,
      responses,
      leaderNotes,
      status,
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save report." },
      { status: 400 },
    );
  }
}
