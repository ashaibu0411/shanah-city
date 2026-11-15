import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import type { PublicMember } from "@/lib/auth-types";
import { prisma } from "@/lib/db";

/** Senior Pastor alone may assign and approve vision. Delegations can be added later. */
export async function getVisionActor(): Promise<{ user: PublicMember | null; isOwner: boolean }> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return { user: null, isOwner: false };
  const roles = await getPastoralRoleAssignments();
  return { user, isOwner: roles.seniorPastorUserId === user.id };
}

export async function canReadVision(planId: string, userId: string, isOwner: boolean) {
  if (isOwner) return true;
  return Boolean(await prisma.visionAssignment.findUnique({
    where: { planId_userId: { planId, userId } },
    select: { id: true },
  }));
}

export const VISION_MINISTRIES = [
  { key: "churchwide", title: "2027 Master Vision" },
  { key: "worship", title: "2027 Shanah Worship Ministry Vision & Leadership Plan" },
  { key: "young-adults", title: "2027 Young Adults Ministry Vision & Leadership Plan" },
  { key: "kids", title: "2027 Shanah Kids Ministry Vision & Leadership Plan" },
  { key: "men", title: "2027 Men of Legacy Ministry Vision & Leadership Plan" },
  { key: "women", title: "2027 Transformed Women Ministry Vision & Leadership Plan" },
  { key: "shift", title: "SHIFT Conference" },
  { key: "hail-the-king", title: "Hail the King" },
  { key: "cares", title: "Shanah Cares" },
  { key: "operations", title: "Operations & Creative" },
] as const;

export function safeVisionString(value: unknown, max = 12000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
