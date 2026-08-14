import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/account-deletion-server";
import {
  addFamilyMember,
  canManageDevotions,
  deleteSession,
  getUserByEmail,
  getUserFromSession,
  promoteUserRole,
  removeFamilyMember,
  SESSION_COOKIE,
  toPublicMember,
  updateUserProfile,
  verifyCredentials,
} from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { verifyLeaderPin } from "@/lib/member-server";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "become_leader") {
    const pin = String(body.pin ?? "");
    if (!verifyLeaderPin(pin)) {
      return NextResponse.json({ error: "Invalid leader PIN." }, { status: 403 });
    }

    const updated = await promoteUserRole(user.id, "leader");
    return NextResponse.json({
      user: updated ? toPublicMember(updated) : null,
    });
  }

  if (body.action === "promote_member") {
    const pin = String(body.pin ?? "");
    if (!canManageDevotions(user, pin)) {
      return NextResponse.json({ error: "Leader access required." }, { status: 403 });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const role =
      body.role === "media"
        ? "media"
        : body.role === "team"
          ? "team"
          : "leader";
    const target = await getUserByEmail(email);

    if (!target) {
      return NextResponse.json({ error: "No member found with that email." }, { status: 404 });
    }

    const updated = await promoteUserRole(target.id, role);
    return NextResponse.json({
      promotedName: updated?.name ?? target.name,
      role,
    });
  }

  if (body.action === "add_family") {
    const member = await addFamilyMember(user.id, {
      id: `fam-${Date.now()}`,
      name: String(body.name ?? "").trim(),
      relationship: body.relationship ?? "other",
      birthYear: body.birthYear ? String(body.birthYear) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
    });
    return NextResponse.json({ user: member ? toPublicMember(member) : null });
  }

  if (body.action === "remove_family") {
    const member = await removeFamilyMember(user.id, body.memberId);
    return NextResponse.json({ user: member ? toPublicMember(member) : null });
  }

  const updated = await updateUserProfile(user.id, {
    name: body.name ? String(body.name).trim() : undefined,
    phone: body.phone ? String(body.phone).trim() : undefined,
    campusId: body.campusId,
  });

  return NextResponse.json({
    user: updated ? toPublicMember(updated) : null,
  });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(`profile:delete:${user.id}:${ip}`, {
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!rateLimited.allowed) {
    return rateLimitResponse(rateLimited.retryAfterSeconds);
  }

  const body = await request.json();
  const password = String(body.password ?? "");
  const confirmText = String(body.confirmText ?? "").trim();

  if (confirmText !== "DELETE") {
    return NextResponse.json(
      { error: 'Type "DELETE" to confirm account deletion.' },
      { status: 400 },
    );
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const valid = await verifyCredentials(user.email, password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
  }

  try {
    await deleteUserAccount(user.id);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete your account.",
      },
      { status: 500 },
    );
  }

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
