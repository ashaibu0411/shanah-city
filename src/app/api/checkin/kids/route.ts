import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessKidsMinistry } from "@/lib/kids-access-server";
import { enrichCheckInFromProfile } from "@/lib/kids-server";
import {
  addKidCheckIn,
  getKidCheckIns,
  verifyCheckoutKid,
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
  const isTeacher = await canAccessKidsMinistry(user);
  const visible = isTeacher
    ? checkins
    : checkins.filter((entry) => entry.parentUserId === user.id || entry.parentName === user.name);

  return NextResponse.json({ checkins: visible });
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
    const id = String(body.id ?? "").trim();
    const securityCode = String(body.securityCode ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Check-in id is required." }, { status: 400 });
    }
    if (!securityCode) {
      return NextResponse.json(
        { error: "Enter the pickup security code from your label." },
        { status: 400 },
      );
    }

    const checkins = await getKidCheckIns();
    const existing = checkins.find((entry) => entry.id === id);
    if (!existing || existing.checkedOutAt) {
      return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
    }

    const isTeacher = await canAccessKidsMinistry(user);
    const isParent =
      existing.parentUserId === user.id || existing.parentName === user.name;
    if (!isTeacher && !isParent) {
      return NextResponse.json({ error: "You cannot check out this child." }, { status: 403 });
    }

    const result = await verifyCheckoutKid(id, {
      securityCode,
      checkedOutBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: "Security code does not match." }, { status: 403 });
    }

    return NextResponse.json({ checkin: result.checkin });
  }

  const parentName = String(body.parentName ?? user.name).trim();
  const childName = String(body.childName ?? "").trim();
  const ageGroup = String(body.ageGroup ?? "").trim();
  const service = String(body.service ?? "").trim();
  const familyMemberId = body.familyMemberId ? String(body.familyMemberId) : undefined;

  if (!parentName || !childName || !ageGroup || !service) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const profileExtras = enrichCheckInFromProfile(user, childName);
  const familyChild = familyMemberId
    ? user.family.find((member) => member.id === familyMemberId)
    : undefined;

  const entry = await addKidCheckIn({
    id: `kid-${Date.now()}`,
    parentName,
    childName,
    ageGroup,
    service,
    notes: body.notes ? String(body.notes).trim() : undefined,
    securityCode: createSecurityCode(),
    checkedInAt: new Date().toISOString(),
    parentUserId: user.id,
    familyMemberId: familyChild?.id ?? profileExtras.familyMemberId,
    allergies: familyChild?.allergies ?? profileExtras.allergies,
    medicalNotes: familyChild?.medicalNotes ?? profileExtras.medicalNotes,
    authorizedPickup: familyChild?.authorizedPickup ?? profileExtras.authorizedPickup,
  });

  return NextResponse.json({ checkin: entry }, { status: 201 });
}
