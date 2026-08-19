import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { addVolunteerCheckIn, getVolunteerCheckIns, isAtChurch } from "@/lib/member-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { site } from "@/lib/site";
import {
  findTodaysVolunteerArrival,
  volunteerArrivalId,
} from "@/lib/volunteer-checkin";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view volunteer check-ins." }, { status: 401 });
  }

  const checkins = await getVolunteerCheckIns();
  return NextResponse.json({ checkins });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to report your arrival." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(`checkin:volunteer:${user.id}:${ip}`, {
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!rateLimited.allowed) {
    return rateLimitResponse(rateLimited.retryAfterSeconds);
  }

  const body = await request.json();
  const name = String(body.name ?? user.name).trim();
  const ministry = String(body.ministry ?? "").trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!name || !ministry) {
    return NextResponse.json({ error: "Name and ministry are required." }, { status: 400 });
  }

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Location is required to report your arrival." }, { status: 400 });
  }

  const location = isAtChurch(
    lat,
    lng,
    site.coordinates.lat,
    site.coordinates.lng,
  );

  if (!location.atChurch) {
    return NextResponse.json(
      {
        error: `You must be at the church to report your arrival. You are about ${location.distanceMeters}m away.`,
        distanceMeters: location.distanceMeters,
      },
      { status: 403 },
    );
  }

  const existing = findTodaysVolunteerArrival(await getVolunteerCheckIns(), user);
  if (existing) {
    return NextResponse.json({ checkin: existing, alreadyReported: true });
  }

  const entry = await addVolunteerCheckIn({
    id: volunteerArrivalId(user.id),
    name,
    ministry,
    checkedInAt: new Date().toISOString(),
    atChurch: true,
    distanceMeters: location.distanceMeters,
  });

  return NextResponse.json({ checkin: entry, alreadyReported: false }, { status: 201 });
}
