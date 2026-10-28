import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";

export function storyMusicCuratorUserIds(): Set<string> {
  return new Set(
    (process.env.STORY_MUSIC_CURATOR_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function isStoryMusicCurator(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return storyMusicCuratorUserIds().has(user.id);
}

export async function assertStoryMusicCurator(user: PublicMember | null) {
  if (!(await isStoryMusicCurator(user))) {
    throw new Error("Story music curator or admin access required.");
  }
}

export async function assertStoryMusicAdmin(user: PublicMember | null) {
  if (!user || !(await canManageAsAdmin(user))) {
    throw new Error("Admin Group access required.");
  }
}

export function storyMusicAdminWriteEnabled() {
  return process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED?.trim() === "1";
}

export function assertStoryMusicAdminWriteEnabled() {
  if (!storyMusicAdminWriteEnabled()) {
    throw new Error(
      "Story music admin writes are disabled. Set STORY_MUSIC_ADMIN_WRITE_ENABLED=1 for local/staging pilot.",
    );
  }
}

export async function storyMusicActorRole(user: PublicMember): Promise<"admin" | "curator"> {
  if (await canManageAsAdmin(user)) return "admin";
  return "curator";
}
