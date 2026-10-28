import { prisma } from "@/lib/db";
import type { StoryMusicAdminAuditAction } from "@/lib/story-music/story-music-admin-audit";

export async function appendStoryMusicDbAudit(input: {
  actorUserId: string;
  actorRole: "admin" | "curator";
  action: StoryMusicAdminAuditAction | string;
  targetType: string;
  targetId?: string;
  summary: string;
  metaJson?: string;
  rightsRecordId?: string;
}) {
  return prisma.storyMusicAdminAuditEvent.create({
    data: {
      id: `sma-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      metaJson: input.metaJson ?? null,
      rightsRecordId: input.rightsRecordId ?? null,
    },
  });
}

export async function listRecentStoryMusicDbAudit(limit = 40) {
  return prisma.storyMusicAdminAuditEvent.findMany({
    orderBy: { at: "desc" },
    take: limit,
  });
}
