import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { PublicMember } from "@/lib/auth-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  CHOIR_RECORDING_CATEGORIES,
  CHOIR_RECORDING_VISIBILITY,
  type ChoirRecordingCategory,
  type ChoirRecordingVisibility,
  type ChoirRehearsalLibraryRecording,
} from "@/lib/choir-rehearsal-recording-types";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { useDatabase } from "@/lib/use-database";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import * as recordingDb from "@/lib/stores/choir-rehearsal-recording-db";
import * as recordingJson from "@/lib/stores/choir-rehearsal-recording-json";

const store = () => (useDatabase() ? recordingDb : recordingJson);

export async function assertChoirRecordingMember(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return { ok: false as const, status: 403, error: "Invalid group." };
  }
  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return { ok: false as const, status: 403, error: "Choir access required." };
  }
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return { ok: false as const, status: 403, error: "Complete ministry training to use rehearsal recordings." };
  }
  const canManage = await canManageWorshipPlan(user);
  return { ok: true as const, canManage, isSiteAdmin };
}

export function canViewRecording(
  user: PublicMember,
  recording: ChoirRehearsalLibraryRecording,
  opts: { canManage: boolean; isSiteAdmin: boolean },
) {
  if (recording.deletedAt && !opts.canManage && !opts.isSiteAdmin) return false;
  if (opts.canManage || opts.isSiteAdmin) return true;
  if (recording.recordedBy === user.id) return true;
  if (recording.visibility === "private") return false;
  return true;
}

export function canEditRecordingMetadata(
  user: PublicMember,
  recording: ChoirRehearsalLibraryRecording,
  opts: { canManage: boolean; isSiteAdmin: boolean },
) {
  if (opts.canManage || opts.isSiteAdmin) return true;
  return recording.recordedBy === user.id;
}

export function canDeleteRecording(
  user: PublicMember,
  recording: ChoirRehearsalLibraryRecording,
  opts: { canManage: boolean; isSiteAdmin: boolean },
) {
  if (opts.canManage || opts.isSiteAdmin) return true;
  if (recording.recordedBy !== user.id) return false;
  return recording.visibility !== "official";
}

export async function listVisibleChoirRecordings(
  user: PublicMember,
  options: {
    groupId: string;
    mine?: boolean;
    category?: string;
    mediaType?: "audio" | "video";
    q?: string;
    limit?: number;
    cursorCreatedAt?: string;
  },
) {
  const access = await assertChoirRecordingMember(user, options.groupId);
  if (!access.ok) return access;

  const raw = await store().listChoirRehearsalLibraryRecordings({
    groupId: options.groupId,
    recordedBy: options.mine ? user.id : undefined,
    category: options.category,
    mediaType: options.mediaType,
    limit: options.limit,
    cursorCreatedAt: options.cursorCreatedAt,
  });

  const opts = { canManage: access.canManage, isSiteAdmin: access.isSiteAdmin };
  let items = options.mine
    ? raw.filter((entry) => entry.recordedBy === user.id && !entry.deletedAt)
    : raw.filter(
        (entry) => entry.uploadStatus === "ready" && canViewRecording(user, entry, opts),
      );

  const q = options.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.recordedByName.toLowerCase().includes(q) ||
        (entry.description?.toLowerCase().includes(q) ?? false),
    );
  }

  return { ok: true as const, recordings: items, canManage: access.canManage };
}

export function parseRecordingCategory(value: unknown): ChoirRecordingCategory | null {
  const normalized = String(value ?? "").trim();
  return CHOIR_RECORDING_CATEGORIES.includes(normalized as ChoirRecordingCategory)
    ? (normalized as ChoirRecordingCategory)
    : null;
}

export function parseRecordingVisibility(value: unknown): ChoirRecordingVisibility | null {
  const normalized = String(value ?? "").trim();
  return CHOIR_RECORDING_VISIBILITY.includes(normalized as ChoirRecordingVisibility)
    ? (normalized as ChoirRecordingVisibility)
    : null;
}

export async function saveChoirLibraryRecording(
  user: PublicMember,
  input: Omit<ChoirRehearsalLibraryRecording, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
) {
  const access = await assertChoirRecordingMember(user, input.groupId);
  if (!access.ok) return access;

  const category = parseRecordingCategory(input.category);
  if (!category) {
    return { ok: false as const, status: 400, error: "Invalid recording category." };
  }

  const visibility = parseRecordingVisibility(input.visibility) ?? "private";
  if (visibility === "official" && !access.canManage && !access.isSiteAdmin) {
    return { ok: false as const, status: 403, error: "Only worship leaders can publish official recordings." };
  }

  const now = new Date().toISOString();
  const recording: ChoirRehearsalLibraryRecording = {
    ...input,
    category,
    visibility,
    recordedBy: input.recordedBy || user.id,
    recordedByName: input.recordedByName || user.name?.trim() || "Member",
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    uploadStatus: input.uploadStatus ?? "ready",
  };

  if (recording.recordedBy !== user.id && !access.canManage && !access.isSiteAdmin) {
    return { ok: false as const, status: 403, error: "Cannot save on behalf of another member." };
  }

  const saved = await store().upsertChoirRehearsalLibraryRecording(recording);
  return { ok: true as const, recording: saved };
}

export async function patchChoirLibraryRecording(
  user: PublicMember,
  id: string,
  patch: Partial<
    Pick<
      ChoirRehearsalLibraryRecording,
      | "title"
      | "description"
      | "category"
      | "visibility"
      | "serviceDate"
      | "serviceTime"
      | "songId"
      | "vocalPart"
      | "instrumentRole"
      | "uploadStatus"
    >
  >,
) {
  const existing = await store().getChoirRehearsalLibraryRecording(id);
  if (!existing || existing.deletedAt) {
    return { ok: false as const, status: 404, error: "Recording not found." };
  }

  const access = await assertChoirRecordingMember(user, existing.groupId);
  if (!access.ok) return access;

  const opts = { canManage: access.canManage, isSiteAdmin: access.isSiteAdmin };
  if (!canEditRecordingMetadata(user, existing, opts)) {
    return { ok: false as const, status: 403, error: "Not allowed to edit this recording." };
  }

  if (patch.visibility === "official" && !access.canManage && !access.isSiteAdmin) {
    return { ok: false as const, status: 403, error: "Only worship leaders can mark recordings as official." };
  }

  const category = patch.category != null ? parseRecordingCategory(patch.category) : existing.category;
  if (!category) {
    return { ok: false as const, status: 400, error: "Invalid category." };
  }

  const visibility =
    patch.visibility != null ? parseRecordingVisibility(patch.visibility) ?? existing.visibility : existing.visibility;

  const updated: ChoirRehearsalLibraryRecording = {
    ...existing,
    title: patch.title?.trim() || existing.title,
    description: patch.description !== undefined ? patch.description : existing.description,
    category,
    visibility,
    serviceDate: patch.serviceDate !== undefined ? patch.serviceDate : existing.serviceDate,
    serviceTime: patch.serviceTime !== undefined ? patch.serviceTime : existing.serviceTime,
    songId: patch.songId !== undefined ? patch.songId : existing.songId,
    vocalPart: patch.vocalPart !== undefined ? patch.vocalPart : existing.vocalPart,
    instrumentRole: patch.instrumentRole !== undefined ? patch.instrumentRole : existing.instrumentRole,
    uploadStatus: patch.uploadStatus ?? existing.uploadStatus,
    updatedAt: new Date().toISOString(),
  };

  const saved = await store().upsertChoirRehearsalLibraryRecording(updated);
  return { ok: true as const, recording: saved };
}

export async function deleteChoirLibraryRecording(user: PublicMember, id: string) {
  const existing = await store().getChoirRehearsalLibraryRecording(id);
  if (!existing || existing.deletedAt) {
    return { ok: false as const, status: 404, error: "Recording not found." };
  }

  const access = await assertChoirRecordingMember(user, existing.groupId);
  if (!access.ok) return access;

  const opts = { canManage: access.canManage, isSiteAdmin: access.isSiteAdmin };
  if (!canDeleteRecording(user, existing, opts)) {
    return { ok: false as const, status: 403, error: "Not allowed to delete this recording." };
  }

  const deleted = await store().softDeleteChoirRehearsalLibraryRecording(id);
  return { ok: true as const, recording: deleted };
}
