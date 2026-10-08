import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import {
  COUPLE_LOVE_NOTE_TYPES,
  type CoupleLoveNoteRecord,
  type CoupleLoveNoteType,
  type CoupleLoveNoteView,
} from "@/lib/couple-love-note-types";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";
import { useDatabase } from "@/lib/use-database";
import * as coupleLoveNoteDb from "@/lib/stores/couple-love-note-db";
import * as coupleLoveNoteJson from "@/lib/stores/couple-love-note-json";

const store = () => (useDatabase() ? coupleLoveNoteDb : coupleLoveNoteJson);

function parseNoteType(value: unknown): CoupleLoveNoteType {
  const raw = String(value ?? "appreciation");
  const allowed = new Set(COUPLE_LOVE_NOTE_TYPES.map((entry) => entry.id));
  return allowed.has(raw as CoupleLoveNoteType) ? (raw as CoupleLoveNoteType) : "appreciation";
}

async function toView(note: CoupleLoveNoteRecord, viewer: PublicMember): Promise<CoupleLoveNoteView> {
  const author = await getUserById(note.fromUserId);
  const isFromMe = note.fromUserId === viewer.id;
  const isUnread = !isFromMe && !note.readAt;

  return {
    ...note,
    fromUserName: author?.name ?? "Spouse",
    isFromMe,
    isUnread,
  };
}

function filterNotes(
  notes: CoupleLoveNoteView[],
  options: { q?: string; filter?: string },
) {
  let list = notes;
  const filter = options.filter?.trim();
  if (filter === "received") {
    list = list.filter((note) => !note.isFromMe);
  } else if (filter === "sent") {
    list = list.filter((note) => note.isFromMe);
  }

  const q = options.q?.trim().toLowerCase();
  if (!q) return list;

  return list.filter((note) => {
    const haystack = `${note.body} ${note.scriptureRef ?? ""} ${note.noteType}`.toLowerCase();
    return haystack.includes(q);
  });
}

export async function getCoupleLoveNotesForUser(
  user: PublicMember,
  options: { q?: string; filter?: string } = {},
) {
  const link = await assertActiveCoupleWorkspace(user);
  const records = await store().listCoupleLoveNotes(link.id);
  const views = await Promise.all(records.map((record) => toView(record, user)));
  const notes = filterNotes(views, options);
  const unreadCount = views.filter((note) => note.isUnread).length;

  return { coupleLinkId: link.id, notes, unreadCount };
}

async function assertNoteAccess(user: PublicMember, noteId: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const note = await store().getCoupleLoveNoteById(noteId);
  if (!note || note.coupleLinkId !== link.id) {
    throw new Error("Note not found.");
  }
  return { link, note };
}

export async function sendCoupleLoveNoteForUser(user: PublicMember, body: Record<string, unknown>) {
  const link = await assertActiveCoupleWorkspace(user);
  const message = String(body.body ?? "").trim();
  if (!message) throw new Error("Write something for your spouse.");
  if (message.length > 4000) throw new Error("Keep your note under 4,000 characters.");

  const noteType = parseNoteType(body.noteType);
  const scriptureRef = String(body.scriptureRef ?? "").trim();

  if (noteType === "scripture" && !scriptureRef) {
    throw new Error("Add a scripture reference for scripture notes.");
  }

  const record = await store().createCoupleLoveNote({
    coupleLinkId: link.id,
    fromUserId: user.id,
    noteType,
    body: message,
    scriptureRef: scriptureRef || undefined,
  });

  const partnerId = partnerIdFromLink(link, user.id);
  if (partnerId) {
    void sendPushToUsersWithPushEnabled([partnerId], {
      title: "Love note",
      body: "Your spouse sent you a private note in Couples Hub.",
      url: "/couples/marriage/love-notes",
    }).catch(() => undefined);
  }

  const view = await toView(record, user);
  const feed = await getCoupleLoveNotesForUser(user);
  return { note: view, ...feed };
}

export async function markCoupleLoveNoteReadForUser(user: PublicMember, noteId: string) {
  const { note } = await assertNoteAccess(user, noteId);
  if (note.fromUserId === user.id) {
    throw new Error("You cannot mark your own note as read.");
  }
  if (note.readAt) {
    return getCoupleLoveNotesForUser(user);
  }

  await store().markCoupleLoveNoteRead(noteId, new Date());
  return getCoupleLoveNotesForUser(user);
}

export async function deleteCoupleLoveNoteForUser(user: PublicMember, noteId: string) {
  await assertNoteAccess(user, noteId);
  await store().deleteCoupleLoveNote(noteId);
  return getCoupleLoveNotesForUser(user);
}
