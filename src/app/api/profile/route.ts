import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  addFamilyMember,
  canManageDevotions,
  getUserByEmail,
  getUserFromSession,
  promoteUserRole,
  removeFamilyMember,
  SESSION_COOKIE,
  toPublicMember,
  updateUserProfile,
} from "@/lib/auth-server";
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
