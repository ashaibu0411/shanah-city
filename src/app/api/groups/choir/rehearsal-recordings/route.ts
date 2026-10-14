import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { defaultChoirRecordingTitle } from "@/lib/choir-rehearsal-recording-types";
import {
  deleteChoirLibraryRecording,
  listVisibleChoirRecordings,
  parseRecordingCategory,
  patchChoirLibraryRecording,
  saveChoirLibraryRecording,
} from "@/lib/choir-rehearsal-recording-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const mine = searchParams.get("mine") === "1";
  const category = searchParams.get("category")?.trim() || undefined;
  const mediaType = searchParams.get("mediaType") === "video" ? "video" : searchParams.get("mediaType") === "audio" ? "audio" : undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const cursorCreatedAt = searchParams.get("cursor")?.trim() || undefined;

  const result = await listVisibleChoirRecordings(user, {
    groupId,
    mine,
    category,
    mediaType,
    q,
    cursorCreatedAt,
    limit: 60,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    recordings: result.recordings,
    canManage: result.canManage,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();
  const id = String(body.id ?? "").trim();
  const audioUrl = String(body.audioUrl ?? "").trim();
  if (!id || !audioUrl) {
    return NextResponse.json({ error: "Recording id and audio URL are required." }, { status: 400 });
  }

  const category = parseRecordingCategory(body.category) ?? "full_rehearsal";
  const title =
    String(body.title ?? "").trim() || defaultChoirRecordingTitle(category);

  const result = await saveChoirLibraryRecording(user, {
    id,
    groupId,
    title,
    description: body.description != null ? String(body.description) : null,
    category,
    mediaType: body.mediaType === "video" ? "video" : "audio",
    audioUrl,
    fileName: String(body.fileName ?? "recording.webm"),
    fileSizeBytes: typeof body.fileSizeBytes === "number" ? body.fileSizeBytes : null,
    durationSeconds: typeof body.durationSeconds === "number" ? body.durationSeconds : null,
    visibility: String(body.visibility ?? "private") as "private" | "choir_shared" | "official",
    uploadStatus: "ready",
    recordedBy: user.id,
    recordedByName: user.name?.trim() || "Member",
    serviceDate: body.serviceDate != null ? String(body.serviceDate) : null,
    serviceTime: body.serviceTime != null ? String(body.serviceTime) : null,
    songId: body.songId != null ? String(body.songId) : null,
    vocalPart: body.vocalPart != null ? String(body.vocalPart) : null,
    instrumentRole: body.instrumentRole != null ? String(body.instrumentRole) : null,
    deletedAt: null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ recording: result.recording });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Recording id required." }, { status: 400 });
  }

  const categoryPatch =
    body.category != null ? parseRecordingCategory(body.category) ?? undefined : undefined;

  const result = await patchChoirLibraryRecording(user, id, {
    title: body.title != null ? String(body.title) : undefined,
    description: body.description !== undefined ? (body.description == null ? null : String(body.description)) : undefined,
    category: categoryPatch,
    visibility:
      body.visibility != null
        ? (String(body.visibility) as "private" | "choir_shared" | "official")
        : undefined,
    serviceDate: body.serviceDate !== undefined ? (body.serviceDate == null ? null : String(body.serviceDate)) : undefined,
    serviceTime: body.serviceTime !== undefined ? (body.serviceTime == null ? null : String(body.serviceTime)) : undefined,
    songId: body.songId !== undefined ? (body.songId == null ? null : String(body.songId)) : undefined,
    vocalPart: body.vocalPart !== undefined ? (body.vocalPart == null ? null : String(body.vocalPart)) : undefined,
    instrumentRole:
      body.instrumentRole !== undefined
        ? body.instrumentRole == null
          ? null
          : String(body.instrumentRole)
        : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ recording: result.recording });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Recording id required." }, { status: 400 });
  }

  const result = await deleteChoirLibraryRecording(user, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ recording: result.recording });
}
