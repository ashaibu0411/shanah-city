import { useDatabase } from "@/lib/use-database";
import * as avatarDb from "@/lib/stores/avatar-db";
import * as avatarJson from "@/lib/stores/avatar-json";

const store = () => (useDatabase() ? avatarDb : avatarJson);

export function isAvatarRef(value?: string | null) {
  return Boolean(value?.startsWith("avatar:") || value?.startsWith("blob:"));
}

export function getMemberAvatarApiUrl(userId: string, avatarUrl?: string | null) {
  if (!isAvatarRef(avatarUrl)) return null;
  return `/api/profile/avatar?userId=${encodeURIComponent(userId)}`;
}

export const getAvatarFilePath = (userId: string) => store().getAvatarFilePath(userId);
export const saveUserAvatar = (userId: string, file: File) => store().saveUserAvatar(userId, file);
export const deleteUserAvatar = (userId: string) => store().deleteUserAvatar(userId);
export const readAvatarFile = (userId: string) => store().readAvatarFile(userId);

export async function registerDirectUploadAvatar(userId: string) {
  if (!useDatabase()) {
    throw new Error(
      "Profile photos need cloud storage. Add BLOB_READ_WRITE_TOKEN in Vercel (Production), then redeploy.",
    );
  }
  return avatarDb.registerDirectUploadAvatar(userId);
}
