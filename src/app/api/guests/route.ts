import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGuestSubmissions } from "@/lib/frontliners-access-server";
import type { GuestSubmissionStatus } from "@/lib/frontliners-types";
import {
  addGuestSubmission,
  listGuestSubmissions,
  updateGuestSubmission,
} from "@/lib/guest-submission-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

function parseStatus(value: unknown): GuestSubmissionStatus | null {
  if (value === "new" || value === "contacted" || value === "archived") return value;
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageGuestSubmissions(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const guests = await listGuestSubmissions();
  return NextResponse.json({ guests });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(`guest:submit:${ip}`, {
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const body = await request.json();

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const phone = String(body.phone ?? "").trim();
  if (!phone) {
    return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }

  const guest = await addGuestSubmission({
    name,
    email,
    phone,
    visitDate: body.visitDate ? String(body.visitDate).trim() : undefined,
    serviceTime: body.serviceTime ? String(body.serviceTime).trim() : undefined,
    isFirstVisit: body.isFirstVisit !== false,
    notes: body.notes ? String(body.notes).trim() : undefined,
  });

  return NextResponse.json({ guest, message: "Thanks for connecting with us!" });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageGuestSubmissions(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const status = parseStatus(body.status);

  if (!id || !status) {
    return NextResponse.json({ error: "Guest id and status are required." }, { status: 400 });
  }

  const guest = await updateGuestSubmission(id, {
    status,
    reviewedBy: user.id,
    reviewedByName: user.name,
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest submission not found." }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
