import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";

/** Admin Group membership required for all story-music admin APIs. */
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
      "Story music admin writes are disabled. Set STORY_MUSIC_ADMIN_WRITE_ENABLED=1 for local pilot only.",
    );
  }
}
