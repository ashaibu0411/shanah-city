import {
  addFamilyMember,
  removeFamilyMember,
  updateFamilyMember,
  updateUserProfile,
} from "@/lib/auth-server";
import type { AuthorizedPickupContact, FamilyMember, MemberProfile } from "@/lib/auth-types";
import { getAdminPeopleDirectory } from "@/lib/admin-people-server";

const roles: NonNullable<MemberProfile["role"]>[] = ["member", "leader", "team", "media"];

function parseAuthorizedPickup(value: unknown): AuthorizedPickupContact[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((contact) => ({
      name: String((contact as { name?: string }).name ?? "").trim(),
      phone: (contact as { phone?: string }).phone
        ? String((contact as { phone?: string }).phone).trim()
        : undefined,
      relationship: (contact as { relationship?: string }).relationship
        ? String((contact as { relationship?: string }).relationship).trim()
        : undefined,
    }))
    .filter((contact) => contact.name);
}

function childSafetyFields(body: Record<string, unknown>) {
  return {
    allergies: body.allergies !== undefined ? String(body.allergies).trim() : undefined,
    medicalNotes: body.medicalNotes !== undefined ? String(body.medicalNotes).trim() : undefined,
    authorizedPickup: parseAuthorizedPickup(body.authorizedPickup),
  };
}

export async function getAdminPerson(adminId: string, userId: string) {
  const people = await getAdminPeopleDirectory(adminId);
  return people.find((person) => person.id === userId) ?? null;
}

export async function updateAdminPerson(
  adminId: string,
  userId: string,
  body: Record<string, unknown>,
) {
  const person = await getAdminPerson(adminId, userId);
  if (!person) {
    throw new Error("Member not found.");
  }

  const action = String(body.action ?? "");

  if (action === "add_family") {
    const name = String(body.name ?? "").trim();
    if (!name) {
      throw new Error("Family member name is required.");
    }

    const user = await addFamilyMember(userId, {
      id: `fam-${Date.now()}`,
      name,
      relationship: (body.relationship as FamilyMember["relationship"]) ?? "other",
      birthYear: body.birthYear ? String(body.birthYear) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      ...childSafetyFields(body),
    });

    if (!user) {
      throw new Error("Could not add family member.");
    }

    return getAdminPerson(adminId, userId);
  }

  if (action === "update_family") {
    const memberId = String(body.memberId ?? "");
    if (!memberId) {
      throw new Error("Family member id is required.");
    }

    const user = await updateFamilyMember(userId, memberId, {
      name: body.name ? String(body.name).trim() : undefined,
      relationship: body.relationship as FamilyMember["relationship"] | undefined,
      birthYear: body.birthYear ? String(body.birthYear) : undefined,
      notes: body.notes !== undefined ? String(body.notes).trim() : undefined,
      ...childSafetyFields(body),
    });

    if (!user) {
      throw new Error("Could not update family member.");
    }

    return getAdminPerson(adminId, userId);
  }

  if (action === "remove_family") {
    const memberId = String(body.memberId ?? "");
    if (!memberId) {
      throw new Error("Family member id is required.");
    }

    const user = await removeFamilyMember(userId, memberId);
    if (!user) {
      throw new Error("Could not remove family member.");
    }

    return getAdminPerson(adminId, userId);
  }

  const roleRaw = body.role ? String(body.role) : undefined;
  const role =
    roleRaw && roles.includes(roleRaw as NonNullable<MemberProfile["role"]>)
      ? (roleRaw as NonNullable<MemberProfile["role"]>)
      : undefined;

  const updated = await updateUserProfile(userId, {
    name: body.name ? String(body.name).trim() : undefined,
    phone: body.phone === null ? "" : body.phone ? String(body.phone).trim() : undefined,
    campusId: body.campusId ? String(body.campusId) : undefined,
    role,
  });

  if (!updated) {
    throw new Error("Could not update member.");
  }

  return getAdminPerson(adminId, userId);
}
