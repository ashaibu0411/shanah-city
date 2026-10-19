/**
 * Prisma-store reopen + upsert guards (mock client, no DATABASE_URL).
 * Run: npx tsx scripts/marriage-discussion-reopen-db.test.ts
 */
import assert from "node:assert/strict";
import { reopenDiscussionForQuestionWithClient } from "../src/lib/stores/marriage-counseling-db";

async function testReopenUsesUpdateManyOnly() {
  const updateManyCalls: unknown[] = [];
  let deleteCalls = 0;
  let deleteManyCalls = 0;

  const client = {
    marriageDiscussionMark: {
      updateMany: async (args: unknown) => {
        updateManyCalls.push(args);
        return { count: 2 };
      },
      delete: async () => {
        deleteCalls += 1;
        throw new Error("delete must not run on reopen");
      },
      deleteMany: async () => {
        deleteManyCalls += 1;
        throw new Error("deleteMany must not run on reopen");
      },
    },
  };

  const count = await reopenDiscussionForQuestionWithClient(
    client as Parameters<typeof reopenDiscussionForQuestionWithClient>[0],
    "journey-1",
    "s2-temperament-discovery",
    "m01-soc-1",
  );

  assert.equal(count, 2);
  assert.equal(updateManyCalls.length, 1);
  assert.deepEqual(updateManyCalls[0], {
    where: {
      journeyId: "journey-1",
      moduleId: "s2-temperament-discovery",
      questionId: "m01-soc-1",
    },
    data: { discussedAt: null },
  });
  assert.equal(deleteCalls, 0);
  assert.equal(deleteManyCalls, 0);
}

async function testJsonStoreBehavior() {
  const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const dir = mkdtempSync(join(tmpdir(), "marriage-json-store-"));
  const dataFile = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_COUNSELING_DATA_FILE = dataFile;
  delete process.env.DATABASE_URL;
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    dataFile,
    JSON.stringify({
      journeys: [],
      responses: [],
      unlocks: [],
      discussionMarks: [],
      journal: [],
      consents: [],
      invites: [],
      sessions: [],
      actionPlans: [],
      sharedGoals: [],
      sharingConsents: [],
      activitySyncSessions: [],
      revisionRequests: [],
      counselorNotes: [],
      counselorAssignments: [],
      auditLogs: [],
    }),
    "utf8",
  );

  const jsonStore = await import("../src/lib/stores/marriage-counseling-json");

  const base = {
    id: "md-test-1",
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "m01-soc-1",
    markedByUserId: "u-a",
    markedAt: "2026-01-01T12:00:00.000Z",
    sharedNote: "Partner note must survive",
    discussedAt: "2026-01-02T12:00:00.000Z",
  };

  await jsonStore.upsertDiscussionMark(base);
  await jsonStore.upsertDiscussionMark({
    id: base.id,
    journeyId: base.journeyId,
    moduleId: base.moduleId,
    questionId: base.questionId,
    markedByUserId: base.markedByUserId,
    discussedAt: "2026-01-03T12:00:00.000Z",
    markedAt: "2026-01-03T12:00:00.000Z",
  });

  let marks = await jsonStore.getDiscussionMarks("j1", "mod1");
  assert.equal(marks.length, 1);
  assert.equal(marks[0].sharedNote, "Partner note must survive");
  assert.equal(marks[0].discussedAt, "2026-01-03T12:00:00.000Z");

  await jsonStore.upsertDiscussionMark({
    id: "md-ws-only",
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "ws-q",
    markedByUserId: "u-a",
    markedAt: "2026-01-01T12:00:00.000Z",
    sharedNote: "   ",
    discussedAt: "2026-01-01T12:00:00.000Z",
  });
  await jsonStore.upsertDiscussionMark({
    id: "md-ws-only",
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "ws-q",
    markedByUserId: "u-a",
    markedAt: "2026-01-04T12:00:00.000Z",
    discussedAt: "2026-01-04T12:00:00.000Z",
  });
  const wsRow = (await jsonStore.getDiscussionMarks("j1", "mod1")).find((m) => m.id === "md-ws-only")!;
  assert.equal(wsRow.sharedNote, "   ", "status-only upsert keeps whitespace-only note");

  await jsonStore.upsertDiscussionMark({
    id: "md-a",
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "q1",
    markedByUserId: "u-a",
    markedAt: "2026-01-01T12:00:00.000Z",
    discussedAt: "2026-01-01T12:00:00.000Z",
  });
  await jsonStore.upsertDiscussionMark({
    id: "md-b",
    journeyId: "j1",
    moduleId: "mod1",
    questionId: "q1",
    markedByUserId: "u-b",
    markedAt: "2026-01-01T13:00:00.000Z",
    sharedNote: "Note B",
    discussedAt: "2026-01-01T13:00:00.000Z",
  });

  const touched = await jsonStore.reopenDiscussionForQuestion("j1", "mod1", "q1");
  assert.equal(touched, 2);

  marks = (await jsonStore.getDiscussionMarks("j1", "mod1")).filter((m) => m.questionId === "q1");
  assert.equal(marks.length, 2);
  assert.equal(marks.find((m) => m.markedByUserId === "u-a")?.discussedAt, null);
  assert.equal(marks.find((m) => m.markedByUserId === "u-b")?.sharedNote, "Note B");
  assert.equal(marks.find((m) => m.markedByUserId === "u-b")?.discussedAt, null);

  rmSync(dir, { recursive: true, force: true });
}

async function run() {
  await testReopenUsesUpdateManyOnly();
  await testJsonStoreBehavior();
  console.log("marriage-discussion-reopen-db.test.ts: OK");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
