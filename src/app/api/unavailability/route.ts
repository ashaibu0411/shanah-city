import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canReviewUnavailabilityForGroup,
  canViewUnavailabilityForGroup,
  type UnavailabilityCalendarGroup,
} from "@/lib/group-permissions-server";
import {
  addUnavailabilityRequest,
  getUnavailabilityRequests,
  updateUnavailabilityRequest,
} from "@/lib/member-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

function parseCalendarGroup(value: unknown): UnavailabilityCalendarGroup | null {
  if (value === "choir" || value === "pastors") {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view calendar requests." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const group = parseCalendarGroup(searchParams.get("group"));

  if (!group) {
    return NextResponse.json(
      { error: "A choir or pastors group filter is required." },
      { status: 400 },
    );
  }

  if (!(await canViewUnavailabilityForGroup(user, group))) {
    return NextResponse.json(
      { error: "Group membership required to view this calendar." },
      { status: 403 },
    );
  }

  const requests = (await getUnavailabilityRequests()).filter((item) => item.group === group);
  const canReview = await canReviewUnavailabilityForGroup(user, group);

  return NextResponse.json({ requests, canReview });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to submit requests." }, { status: 401 });
  }

  const body = await request.json();
  const ip = getClientIp(request);

  if (body.action === "review") {
    const rateLimited = await enforceRateLimit(`unavailability:review:${user.id}:${ip}`, {
      limit: 30,
      windowSeconds: 15 * 60,
    });
    if (!rateLimited.allowed) {
      return rateLimitResponse(rateLimited.retryAfterSeconds);
    }

    const requests = await getUnavailabilityRequests();
    const target = requests.find((item) => item.id === String(body.id ?? ""));
    if (!target) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (!(await canReviewUnavailabilityForGroup(user, target.group))) {
      return NextResponse.json(
        { error: "Only group admins can approve these requests." },
        { status: 403 },
      );
    }

    const status = body.status === "rejected" ? "rejected" : "approved";
    const updated = await updateUnavailabilityRequest(target.id, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.name,
    });

    if (!updated) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    return NextResponse.json({ request: updated });
  }

  const rateLimited = await enforceRateLimit(`unavailability:submit:${user.id}:${ip}`, {
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!rateLimited.allowed) {
    return rateLimitResponse(rateLimited.retryAfterSeconds);
  }

  const group = parseCalendarGroup(body.group);
  const personName = String(body.personName ?? user.name).trim();
  const startDate = String(body.startDate ?? "");
  const endDate = String(body.endDate ?? "");
  const reason = String(body.reason ?? "").trim();

  if (!personName || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!group) {
    return NextResponse.json({ error: "Invalid group." }, { status: 400 });
  }

  if (!(await canViewUnavailabilityForGroup(user, group))) {
    return NextResponse.json(
      { error: "Join this ministry group before submitting requests." },
      { status: 403 },
    );
  }

  const item = await addUnavailabilityRequest({
    id: String(Date.now()),
    personName,
    group,
    startDate,
    endDate,
    reason,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ request: item }, { status: 201 });
}
