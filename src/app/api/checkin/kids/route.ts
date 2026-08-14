import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  addKidCheckIn,
  checkoutKid,
  getKidCheckIns,
} from "@/lib/member-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

function createSecurityCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view kids check-ins." }, { status: 401 });
  }

  const checkins = await getKidCheckIns();
  return NextResponse.json({ checkins });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to check in children." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(`checkin:kids:${user.id}:${ip}`, {
    limit: 20,
    windowSeconds: 15 * 60,
  });
  if (!rateLimited.allowed) {
    return rateLimitResponse(rateLimited.retryAfterSeconds);
  }

  const body = await request.json();

  if (body.action === "checkout") {
    const entry = await checkoutKid(body.id);
    if (!entry) {
      return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
    }
    return NextResponse.json({ checkin: entry });
  }

  const parentName = String(body.parentName ?? user.name).trim();
  const childName = String(body.childName ?? "").trim();
  const ageGroup = String(body.ageGroup ?? "").trim();
  const service = String(body.service ?? "").trim();

  if (!parentName || !childName || !ageGroup || !service) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const entry = await addKidCheckIn({
    id: `kid-${Date.now()}`,
    parentName,
    childName,
    ageGroup,
    service,
    notes: body.notes ? String(body.notes).trim() : undefined,
    securityCode: createSecurityCode(),
    checkedInAt: new Date().toISOString(),
  });

  return NextResponse.json({ checkin: entry }, { status: 201 });
}
