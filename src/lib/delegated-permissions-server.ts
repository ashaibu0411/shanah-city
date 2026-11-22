import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { PublicMember } from "@/lib/auth-types";

export const DELEGATED_PERMISSIONS = [
  "announcements.manage",
  "events.manage",
  "devotions.manage",
  "media.manage",
  "members.view",
] as const;
export type DelegatedPermissionKey = (typeof DELEGATED_PERMISSIONS)[number];
export function isDelegatedPermission(value: string): value is DelegatedPermissionKey {
  return (DELEGATED_PERMISSIONS as readonly string[]).includes(value);
}
export async function canUseDelegatedPermission(user: PublicMember | null, permission: DelegatedPermissionKey) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  if (!useDatabase()) return false;
  return Boolean(await prisma.delegatedPermission.findUnique({
    where: {userId_permission:{userId:user.id,permission}},select:{id:true},
  }));
}
export async function listDelegatedPermissions(userId:string) {
  if (!useDatabase()) return [];
  return prisma.delegatedPermission.findMany({where:{userId},orderBy:{createdAt:"desc"}});
}
export async function setDelegatedPermission(userId:string,permission:DelegatedPermissionKey,grantedBy:string,enabled:boolean) {
  if (enabled) return prisma.delegatedPermission.upsert({
    where:{userId_permission:{userId,permission}},create:{userId,permission,grantedBy},update:{grantedBy},
  });
  return prisma.delegatedPermission.deleteMany({where:{userId,permission}});
}
