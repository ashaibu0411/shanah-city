import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { assertStoryMusicAdmin, assertStoryMusicCurator } from "@/lib/story-music/story-music-admin-access";
import { storyMusicDbCatalogEnabled } from "@/lib/story-music/story-music-config";
import { prisma } from "@/lib/db";
import { decodeBlobPathname } from "@/lib/story-music/story-music-storage-ref";
import { fetchStoryMusicEvidenceBlob, uploadStoryMusicEvidenceBlob } from "@/lib/story-music/story-music-evidence-server";
import { attachStoryMusicEvidenceDb } from "@/lib/story-music/story-music-admin-db-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!storyMusicDbCatalogEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    await assertStoryMusicAdmin(user);
  } catch {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const evidenceId = new URL(request.url).searchParams.get("evidenceId")?.trim();
  if (!evidenceId) {
    return NextResponse.json({ error: "Missing evidenceId." }, { status: 400 });
  }

  const evidence = await prisma.storyMusicRightsEvidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }

  const pathname = decodeBlobPathname(evidence.storageRef);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid evidence reference." }, { status: 403 });
  }

  try {
    return await fetchStoryMusicEvidenceBlob(pathname);
  } catch {
    return NextResponse.json({ error: "Could not retrieve evidence." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!storyMusicDbCatalogEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    await assertStoryMusicAdmin(user);
  } catch {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const form = await request.formData();
  const rightsRecordId = String(form.get("rightsRecordId") ?? "").trim();
  const label = String(form.get("label") ?? "Rights evidence").trim();
  const file = form.get("file");

  if (!rightsRecordId || !(file instanceof File)) {
    return NextResponse.json({ error: "rightsRecordId and file are required." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be between 1 byte and 12MB." }, { status: 400 });
  }

  try {
    const uploaded = await uploadStoryMusicEvidenceBlob({
      rightsRecordId,
      filename: file.name || "evidence.bin",
      bytes,
      contentType: file.type || "application/octet-stream",
    });

    const evidence = await attachStoryMusicEvidenceDb(user, {
      rightsRecordId,
      label,
      storageRef: uploaded.storageRef,
      contentType: uploaded.contentType,
      byteLength: uploaded.byteLength,
    });

    return NextResponse.json({
      evidence: {
        id: evidence.id,
        label: evidence.label,
        byteLength: evidence.byteLength,
        contentType: evidence.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
