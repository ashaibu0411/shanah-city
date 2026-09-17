import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  addFamilyMember,
  deleteSession,
  getUserFromSession,
  removeFamilyMember,
  updateFamilyMember,
  SESSION_COOKIE,
  toPublicMember,
  updateUserProfile,
  verifyCredentials,
} from "@/lib/auth-server";
import { deleteUserAccount } from "@/lib/account-deletion-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { createFamilyMemberId } from "@/lib/family-member-id";
import { parseMemberParticipationType } from "@/lib/member-participation";
import type { FamilyMember } from "@/lib/auth-types";

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "add_family") {
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Family member name is required." }, { status: 400 });
    }

    const relationship = (body.relationship as FamilyMember["relationship"]) ?? "other";
    const payload: FamilyMember = {
      id: createFamilyMemberId(),
      name,
      relationship,
      birthYear: body.birthYear ? String(body.birthYear) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      allergies: body.allergies ? String(body.allergies).trim() : undefined,
      medicalNotes: body.medicalNotes ? String(body.medicalNotes).trim() : undefined,
      authorizedPickup: Array.isArray(body.authorizedPickup)
        ? body.authorizedPickup
            .map((contact: { name?: string; phone?: string; relationship?: string }) => ({
              name: String(contact.name ?? "").trim(),
              phone: contact.phone ? String(contact.phone).trim() : undefined,
              relationship: contact.relationship ? String(contact.relationship).trim() : undefined,
            }))
            .filter((contact: { name: string }) => contact.name)
        : undefined,
    };

    try {
      const member = await addFamilyMember(user.id, payload);
      if (!member) {
        return NextResponse.json({ error: "Could not add family member." }, { status: 500 });
      }
      return NextResponse.json({ user: toPublicMember(member) });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Could not add family member.",
        },
        { status: 500 },
      );
    }
  }

  if (body.action === "update_family") {
    const member = await updateFamilyMember(user.id, String(body.memberId ?? ""), {
      name: body.name ? String(body.name).trim() : undefined,
      relationship: body.relationship,
      birthYear: body.birthYear ? String(body.birthYear) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      allergies: body.allergies !== undefined ? String(body.allergies).trim() : undefined,
      medicalNotes: body.medicalNotes !== undefined ? String(body.medicalNotes).trim() : undefined,
      authorizedPickup: Array.isArray(body.authorizedPickup)
        ? body.authorizedPickup.map((contact: { name?: string; phone?: string; relationship?: string }) => ({
            name: String(contact.name ?? "").trim(),
            phone: contact.phone ? String(contact.phone).trim() : undefined,
            relationship: contact.relationship ? String(contact.relationship).trim() : undefined,
          })).filter((contact: { name: string }) => contact.name)
        : undefined,
    });
    return NextResponse.json({ user: member ? toPublicMember(member) : null });
  }

  if (body.action === "remove_family") {
    const member = await removeFamilyMember(user.id, body.memberId);
    return NextResponse.json({ user: member ? toPublicMember(member) : null });
  }

  const updated = await updateUserProfile(user.id, {
    name: body.name ? String(body.name).trim() : undefined,
    displayName:
      body.displayName !== undefined ? String(body.displayName) : undefined,
    phone: body.phone ? String(body.phone).trim() : undefined,
    campusId: body.campusId,
    participationType:
      body.participationType !== undefined
        ? parseMemberParticipationType(body.participationType)
        : undefined,
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
