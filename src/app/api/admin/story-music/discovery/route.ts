import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { assertStoryMusicCurator, storyMusicAdminWriteEnabled } from "@/lib/story-music/story-music-admin-access";
import {
  getStoryMusicDiscoveryAdminPayload,
  promoteDiscoveryToIntakeDraft,
  updateStoryMusicDiscoveryStatus,
} from "@/lib/story-music/story-music-discovery-server";
import type { StoryMusicDiscoveryReviewStatus } from "@/lib/story-music/story-music-discovery-types";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    await assertStoryMusicCurator(user);
  } catch {
    return NextResponse.json({ error: "Story music curator or admin access required." }, { status: 403 });
  }

  const payload = await getStoryMusicDiscoveryAdminPayload();
  return NextResponse.json({
    writeEnabled: storyMusicAdminWriteEnabled(),
    ...payload,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    await assertStoryMusicCurator(user);
  } catch {
    return NextResponse.json({ error: "Story music curator or admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "set_status") {
      const candidate = await updateStoryMusicDiscoveryStatus(
        user,
        String(body.candidateId ?? ""),
        String(body.status ?? "") as StoryMusicDiscoveryReviewStatus,
        body.notes ? String(body.notes) : undefined,
      );
      return NextResponse.json({ candidate });
    }
    if (action === "promote_intake") {
      const result = await promoteDiscoveryToIntakeDraft(user, String(body.candidateId ?? ""));
      return NextResponse.json(result);
    }
    if (action === "patch_notes") {
      if (!storyMusicAdminWriteEnabled()) {
        return NextResponse.json({ error: "Admin write disabled." }, { status: 403 });
      }
      const { loadStoryMusicDiscoveryCandidates, saveStoryMusicDiscoveryCandidates } = await import(
        "@/lib/story-music/story-music-discovery-store"
      );
      const candidates = await loadStoryMusicDiscoveryCandidates();
      const row = candidates.find((c) => c.id === String(body.candidateId ?? ""));
      if (!row) throw new Error("Discovery candidate not found.");
      if (body.compositionRightsNote != null) {
        row.compositionRightsNote = String(body.compositionRightsNote).slice(0, 4000);
      }
      if (body.recordingRightsNote != null) {
        row.recordingRightsNote = String(body.recordingRightsNote).slice(0, 4000);
      }
      if (body.rightsEvidenceRef != null) {
        row.rightsEvidenceRef = String(body.rightsEvidenceRef).slice(0, 2000);
      }
      row.updatedAt = new Date().toISOString();
      await saveStoryMusicDiscoveryCandidates(candidates);
      return NextResponse.json({ candidate: row });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
