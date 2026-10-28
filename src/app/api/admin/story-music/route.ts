import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  assertStoryMusicAdmin,
  storyMusicAdminWriteEnabled,
} from "@/lib/story-music/story-music-admin-access";
import { readRecentStoryMusicAdminAudit } from "@/lib/story-music/story-music-admin-audit";
import {
  createStoryMusicIntake,
  publishStoryMusicIntake,
  revokeStoryMusicIntake,
  verifyStoryMusicIntake,
} from "@/lib/story-music/story-music-admin-server";
import {
  listStoryMusicRightsRecords,
  loadAuthorizedProductionTracks,
  loadLegacyMigrationMappings,
} from "@/lib/story-music/story-music-authorized-store";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    await assertStoryMusicAdmin(user);
  } catch {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const [records, catalog, mappings, audit] = await Promise.all([
    listStoryMusicRightsRecords(),
    loadAuthorizedProductionTracks(),
    loadLegacyMigrationMappings(),
    readRecentStoryMusicAdminAudit(40),
  ]);

  return NextResponse.json({
    writeEnabled: storyMusicAdminWriteEnabled(),
    records,
    catalog,
    migrationMappings: mappings,
    audit,
  });
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const action = String(body.action ?? "create");

  try {
    if (action === "create") {
      const record = await createStoryMusicIntake(user, body);
      return NextResponse.json({ record });
    }
    if (action === "verify") {
      const record = await verifyStoryMusicIntake(user, String(body.recordId ?? ""));
      return NextResponse.json({ record });
    }
    if (action === "publish") {
      const record = await publishStoryMusicIntake(user, String(body.recordId ?? ""));
      return NextResponse.json({ record });
    }
    if (action === "revoke") {
      const record = await revokeStoryMusicIntake(user, String(body.recordId ?? ""), body.reason);
      return NextResponse.json({ record });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
