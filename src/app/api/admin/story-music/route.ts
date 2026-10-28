import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  assertStoryMusicAdmin,
  assertStoryMusicCurator,
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
import { storyMusicDbCatalogEnabled } from "@/lib/story-music/story-music-config";
import { prisma } from "@/lib/db";
import { listDbRightsRecords } from "@/lib/story-music/story-music-db-catalog";
import { listRecentStoryMusicDbAudit } from "@/lib/story-music/story-music-db-audit";
import { mapDbRightsRecordToApi } from "@/lib/story-music/story-music-db-map";
import {
  attachStoryMusicEvidenceDb,
  createStoryMusicIntakeDb,
  proposeStoryMusicIntakeDb,
  publishStoryMusicIntakeDb,
  revokeStoryMusicIntakeDb,
  upsertLegacyMigrationMapDb,
  verifyStoryMusicIntakeDb,
} from "@/lib/story-music/story-music-admin-db-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    await assertStoryMusicCurator(user);
  } catch {
    return NextResponse.json({ error: "Story music curator or admin access required." }, { status: 403 });
  }

  if (storyMusicDbCatalogEnabled()) {
    const [recordsRaw, catalog, mappings, auditRaw] = await Promise.all([
      listDbRightsRecords(),
      prisma.storyMusicCatalogTrack.findMany({ orderBy: { publishedAt: "desc" }, take: 200 }),
      prisma.storyMusicLegacyMigrationMap.findMany({ orderBy: { updatedAt: "desc" } }),
      listRecentStoryMusicDbAudit(40),
    ]);

    return NextResponse.json({
      dbCatalog: true,
      writeEnabled: storyMusicAdminWriteEnabled(),
      records: recordsRaw.map(mapDbRightsRecordToApi),
      catalog,
      migrationMappings: mappings,
      audit: auditRaw.map((entry) => ({
        at: entry.at.toISOString(),
        action: entry.action,
        summary: entry.summary,
        actorUserId: entry.actorUserId,
      })),
    });
  }

  const [records, catalog, mappings, audit] = await Promise.all([
    listStoryMusicRightsRecords(),
    loadAuthorizedProductionTracks(),
    loadLegacyMigrationMappings(),
    readRecentStoryMusicAdminAudit(40),
  ]);

  return NextResponse.json({
    dbCatalog: false,
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

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "create");
  const db = storyMusicDbCatalogEnabled();
  const curatorActions = new Set(["create", "propose", "evidence_register"]);
  const adminOnlyActions = new Set(["verify", "publish", "revoke", "legacy_map"]);

  try {
    if (curatorActions.has(action)) {
      await assertStoryMusicCurator(user);
    } else if (adminOnlyActions.has(action) || !curatorActions.has(action)) {
      await assertStoryMusicAdmin(user);
    }
  } catch {
    return NextResponse.json({ error: "Insufficient story music permissions." }, { status: 403 });
  }

  try {
    if (action === "create") {
      const record = db
        ? mapDbRightsRecordToApi(await createStoryMusicIntakeDb(user, body))
        : await createStoryMusicIntake(user, body);
      return NextResponse.json({ record });
    }
    if (action === "propose") {
      if (!db) return NextResponse.json({ error: "Propose requires DB catalog." }, { status: 400 });
      const record = mapDbRightsRecordToApi(await proposeStoryMusicIntakeDb(user, String(body.recordId ?? "")));
      return NextResponse.json({ record });
    }
    if (action === "verify") {
      const record = db
        ? mapDbRightsRecordToApi(await verifyStoryMusicIntakeDb(user, String(body.recordId ?? "")))
        : await verifyStoryMusicIntake(user, String(body.recordId ?? ""));
      return NextResponse.json({ record });
    }
    if (action === "publish") {
      if (db) {
        const updated = await publishStoryMusicIntakeDb(user, String(body.recordId ?? ""));
        if (!updated) throw new Error("Publish failed.");
        return NextResponse.json({ record: mapDbRightsRecordToApi(updated) });
      }
      const record = await publishStoryMusicIntake(user, String(body.recordId ?? ""));
      return NextResponse.json({ record });
    }
    if (action === "revoke") {
      if (db) {
        const updated = await revokeStoryMusicIntakeDb(user, String(body.recordId ?? ""), body.reason);
        if (!updated) throw new Error("Revoke failed.");
        return NextResponse.json({ record: mapDbRightsRecordToApi(updated) });
      }
      const record = await revokeStoryMusicIntake(user, String(body.recordId ?? ""), body.reason);
      return NextResponse.json({ record });
    }
    if (action === "legacy_map") {
      if (!db) return NextResponse.json({ error: "Legacy map requires DB catalog." }, { status: 400 });
      const row = await upsertLegacyMigrationMapDb(user, {
        legacyTrackId: String(body.legacyTrackId ?? ""),
        audioStorageRef: body.audioStorageRef ? String(body.audioStorageRef) : undefined,
        status: String(body.status ?? "planned"),
        rightsRecordId: body.rightsRecordId ? String(body.rightsRecordId) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
      });
      return NextResponse.json({ mapping: row });
    }
    if (action === "evidence_register") {
      if (!db) return NextResponse.json({ error: "Evidence requires DB catalog." }, { status: 400 });
      const evidence = await attachStoryMusicEvidenceDb(user, {
        rightsRecordId: String(body.rightsRecordId ?? ""),
        label: String(body.label ?? "Rights evidence"),
        storageRef: String(body.storageRef ?? ""),
        contentType: String(body.contentType ?? "application/octet-stream"),
        byteLength: Number(body.byteLength ?? 0),
      });
      return NextResponse.json({ evidence });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
