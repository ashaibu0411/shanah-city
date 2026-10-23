import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import type { MarriageCounselorAssignmentRequestType } from "@/lib/marriage-counseling-types";
import {
  acknowledgeCounselorAssignmentRestoration,
  approveCounselorAssignmentRequest,
  getCounselorAssignmentRequestStatus,
  rejectCounselorAssignmentRequest,
  submitCounselorAssignmentRequest,
} from "@/lib/marriage-counselor-assignment-request-server";
import { parseAssignmentListQuery } from "@/lib/marriage-counselor-assignment-list-pagination";
import {
  getCounselorAssignmentUiCapabilities,
  listCounselorAssignmentAdminJourneyRowsPaginated,
  listEligibleAssignmentAdmins,
  listSeniorPastorAdministrativeCoordinatorRosterPaginated,
  listSeniorPastorCounselorApprovalHistoryPaginated,
  listSeniorPastorCounselorApprovalQueuePaginated,
} from "@/lib/marriage-counselor-assignment-ui-server";
import {
  assignAdministrativeCoordinator,
  removeAdministrativeCoordinator,
} from "@/lib/marriage-journey-administrative-coordinator-server";
import { listEligibleClinicalCounselors } from "@/lib/marriage-counselor-directory-server";
import {
  canSubmitCounselorAssignmentRequest,
  isSeniorPastor,
} from "@/lib/marriage-counselor-assignment-authority";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim();
  const view = url.searchParams.get("view")?.trim();

  try {
    if (view === "eligible_counselors") {
      const allowed =
        (await canSubmitCounselorAssignmentRequest(user)) || (await isSeniorPastor(user));
      if (!allowed) throw new Error("Not authorized.");
      const counselors = await listEligibleClinicalCounselors();
      return NextResponse.json({ counselors });
    }
    if (view === "capabilities") {
      return NextResponse.json(await getCounselorAssignmentUiCapabilities(user));
    }
    if (view === "admin_journeys") {
      const listQuery = parseAssignmentListQuery(url.searchParams);
      const page = await listCounselorAssignmentAdminJourneyRowsPaginated(user, listQuery);
      return NextResponse.json(page);
    }
    if (view === "senior_pastor_pending") {
      const listQuery = parseAssignmentListQuery(url.searchParams);
      const page = await listSeniorPastorCounselorApprovalQueuePaginated(user, listQuery);
      return NextResponse.json(page);
    }
    if (view === "senior_pastor_history") {
      const listQuery = parseAssignmentListQuery(url.searchParams);
      const page = await listSeniorPastorCounselorApprovalHistoryPaginated(user, listQuery);
      return NextResponse.json(page);
    }
    if (view === "eligible_assignment_admins") {
      const admins = await listEligibleAssignmentAdmins(user);
      return NextResponse.json({ admins });
    }
    if (view === "administrative_coordinators") {
      const listQuery = parseAssignmentListQuery(url.searchParams);
      const page = await listSeniorPastorAdministrativeCoordinatorRosterPaginated(user, listQuery);
      return NextResponse.json(page);
    }
    if (!journeyId) {
      return NextResponse.json({ error: "journeyId required." }, { status: 400 });
    }
    const status = await getCounselorAssignmentRequestStatus(user, journeyId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unavailable." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "submit") {
      const result = await submitCounselorAssignmentRequest(user, {
        journeyId: String(body.journeyId ?? ""),
        counselorUserId: body.counselorUserId != null ? String(body.counselorUserId) : null,
        requestType: body.requestType
          ? (String(body.requestType) as MarriageCounselorAssignmentRequestType)
          : undefined,
      });
      return NextResponse.json(result);
    }
    if (action === "approve") {
      const result = await approveCounselorAssignmentRequest(user, {
        requestId: String(body.requestId ?? ""),
        decisionNote: body.decisionNote ? String(body.decisionNote) : undefined,
        acknowledgeApproval: Boolean(body.acknowledgeApproval),
      });
      return NextResponse.json(result);
    }
    if (action === "reject") {
      const result = await rejectCounselorAssignmentRequest(user, {
        requestId: String(body.requestId ?? ""),
        decisionNote: body.decisionNote ? String(body.decisionNote) : undefined,
      });
      return NextResponse.json(result);
    }
    if (action === "acknowledge_restoration") {
      const result = await acknowledgeCounselorAssignmentRestoration(user, {
        requestId: String(body.requestId ?? ""),
      });
      return NextResponse.json(result);
    }
    if (action === "assign_administrative_coordinator") {
      const result = await assignAdministrativeCoordinator(user, {
        journeyId: String(body.journeyId ?? ""),
        coordinatorUserId: String(body.coordinatorUserId ?? ""),
      });
      return NextResponse.json(result);
    }
    if (action === "remove_administrative_coordinator") {
      const result = await removeAdministrativeCoordinator(user, String(body.journeyId ?? ""));
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
