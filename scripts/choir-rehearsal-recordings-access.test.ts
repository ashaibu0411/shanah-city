/**
 * Choir rehearsal recording library access (JSON stores).
 * Run: npx.cmd tsx scripts/choir-rehearsal-recordings-access.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PublicMember } from "../src/lib/auth-types";
import { SHANAH_WORSHIP_GROUP_ID } from "../src/lib/choir-group-constants";

function member(id: string, name: string): PublicMember {
  return {
    id,
    name,
    email: `${id}@test.local`,
    campusId: "campus-1",
    role: "member",
    family: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "choir-rec-access-"));
  const dataDir = join(root, "data");
  mkdirSync(dataDir, { recursive: true });
  const prevAuth = process.env.AUTH_DATA_DIR;
  const prevGroups = process.env.GROUPS_DATA_DIR;
  const prevDb = process.env.DATABASE_URL;
  const prevCwd = process.cwd();
  process.env.AUTH_DATA_DIR = dataDir;
  process.env.GROUPS_DATA_DIR = dataDir;
  delete process.env.DATABASE_URL;
  process.chdir(root);

  const ts = "2026-01-01T00:00:00.000Z";
  writeFileSync(
    join(dataDir, "groups.json"),
    JSON.stringify([
      {
        id: SHANAH_WORSHIP_GROUP_ID,
        name: "Shanah Worship",
        description: "Worship ministry test group",
        category: "choir",
        createdBy: "leader-1",
        creatorName: "Leader",
        createdAt: ts,
        updatedAt: ts,
        visibility: "private",
        memberIds: ["choir-member"],
        adminIds: ["leader-1"],
      },
    ]),
  );

  writeFileSync(
    join(dataDir, "users.json"),
    JSON.stringify([
      {
        id: "choir-member",
        name: "Choir Member",
        email: "choir@test.local",
        campusId: "campus-1",
        role: "member",
        passwordHash: "stub",
        family: [],
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: "outsider",
        name: "Outsider",
        email: "out@test.local",
        campusId: "campus-1",
        role: "member",
        passwordHash: "stub",
        family: [],
        createdAt: ts,
        updatedAt: ts,
      },
    ]),
  );

  writeFileSync(
    join(dataDir, "choir-rehearsal-recordings.json"),
    JSON.stringify([
      {
        id: "rec-1",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        title: "Team rehearsal",
        category: "full_rehearsal",
        visibility: "team",
        mediaType: "audio",
        uploadStatus: "ready",
        recordedBy: "leader-1",
        recordedByName: "Leader",
        audioUrl: "/uploads/test.webm",
        fileName: "test.webm",
        createdAt: ts,
        durationSeconds: 60,
      },
    ]),
  );

  try {
    const { getUserFromSession } = await import("../src/lib/auth-server");
    const { assertChoirRecordingMember, listVisibleChoirRecordings } = await import(
      "../src/lib/choir-rehearsal-recording-server"
    );

    assert.equal(await getUserFromSession(undefined), null);
    assert.equal(await getUserFromSession(""), null);

    const outsider = member("outsider", "Outsider");
    const denied = await assertChoirRecordingMember(outsider, SHANAH_WORSHIP_GROUP_ID);
    assert.equal(denied.ok, false);
    if (denied.ok) throw new Error("expected denial");
    assert.equal(denied.status, 403);

    const choirMember = member("choir-member", "Choir Member");
    const allowed = await assertChoirRecordingMember(choirMember, SHANAH_WORSHIP_GROUP_ID);
    assert.equal(allowed.ok, true);

    const list = await listVisibleChoirRecordings(choirMember, {
      groupId: SHANAH_WORSHIP_GROUP_ID,
    });
    assert.equal(list.ok, true);
    if (!list.ok) throw new Error("expected list");
    assert.ok(list.recordings.some((entry) => entry.id === "rec-1"));

    console.log("choir-rehearsal-recordings-access.test.ts: all passed");
  } finally {
    process.chdir(prevCwd);
    if (prevAuth !== undefined) process.env.AUTH_DATA_DIR = prevAuth;
    else delete process.env.AUTH_DATA_DIR;
    if (prevGroups !== undefined) process.env.GROUPS_DATA_DIR = prevGroups;
    else delete process.env.GROUPS_DATA_DIR;
    if (prevDb !== undefined) process.env.DATABASE_URL = prevDb;
    rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
