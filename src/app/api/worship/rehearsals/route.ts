import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
} from "@/lib/worship-access-server";
import { saveWorshipAudioFile } from "@/lib/worship-audio-server";
import {
  createRehearsalRecordingId,
  findRehearsalRecording,
  getRehearsalRecordings,
  removeRehearsalRecording,
  saveRehearsalRecording,
} from "@/lib/worship-rehearsal-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return NextResponse.json({ error: "Worship team access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const serviceDate = searchParams.get("serviceDate")?.trim();
  const serviceTime = searchParams.get("serviceTime")?.trim();

  if (!serviceDate || !serviceTime) {
    return NextResponse.json({ error: "serviceDate and serviceTime are required." }, { status: 400 });
  }

  const recordings = await getRehearsalRecordings(serviceDate, serviceTime);
  return NextResponse.json({ recordings });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return NextResponse.json({ error: "Worship team access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const serviceDate = String(formData.get("serviceDate") ?? "").trim();
  const serviceTime = String(formData.get("serviceTime") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const durationRaw = String(formData.get("durationSeconds") ?? "").trim();
  const durationSeconds = durationRaw ? Number(durationRaw) : undefined;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an audio recording to upload." }, { status: 400 });
  }

  if (!serviceDate || !serviceTime) {
    return NextResponse.json({ error: "serviceDate and serviceTime are required." }, { status: 400 });
  }

  try {
    const uploaded = await saveWorshipAudioFile(file);
    const recording = await saveRehearsalRecording({
      id: createRehearsalRecordingId(),
      serviceDate,
      serviceTime,
      title: title || uploaded.fileName.replace(/\.[^.]+$/, ""),
      audioUrl: uploaded.url,
      fileName: uploaded.fileName,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
      recordedBy: user.id,
      recordedByName: user.name,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ recording });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload recording." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return NextResponse.json({ error: "Worship team access required." }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string };
  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Recording id is required." }, { status: 400 });
  }

  const existing = await findRehearsalRecording(id);
  if (!existing) {
    return NextResponse.json({ error: "Recording not found." }, { status: 404 });
  }

  const canManage = await canManageWorshipPlan(user);
  if (!canManage && existing.recordedBy !== user.id) {
    return NextResponse.json({ error: "You can only delete your own recordings." }, { status: 403 });
  }

  await removeRehearsalRecording(id);
  return NextResponse.json({ ok: true });
}
