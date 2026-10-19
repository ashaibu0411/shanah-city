/**
 * Discussion reopen preserves shared notes (Test 9L regression).
 * Run: npx tsx scripts/marriage-discussion-reopen.test.ts
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deriveSharedDiscussion } from "../src/lib/marriage-discussion-utils";
import type { MarriageDiscussionMarkRecord } from "../src/lib/marriage-counseling-types";

async function run() {
  const dir = mkdtempSync(join(tmpdir(), "marriage-disc-reopen-"));
  process.env.MARRIAGE_COUNSELING_DATA_FILE = join(dir, "marriage-counseling.json");
  process.env.MARRIAGE_CURRICULUM_DATA_FILE = join(dir, "marriage-curriculum.json");
  process.env.MARRIAGE_HUB_STAGE2_ENABLED = "1";
  delete process.env.DATABASE_URL;

  const store = await import("../src/lib/stores/marriage-counseling-json");
  const curriculum = await import("../src/lib/stores/marriage-curriculum-json");
  const { freezeStage2ModulesIntoSnapshot } = await import("../src/lib/marriage-curriculum-stage2-merge");
  const { MARRIAGE_CONSENT_VERSION } = await import("../src/lib/marriage-counseling-curriculum");
  const {
    markDiscussion,
    saveDiscussionNote,
    reopenDiscussion,
    getComparisonForViewer,
  } = await import("../src/lib/marriage-counseling-server");

  const draft = await curriculum.saveCurriculumDraft({
    version: "disc-reopen-test",
    modules: freezeStage2ModulesIntoSnapshot([]),
    createdBy: "admin",
    createdByName: "Admin",
  });
  const published = await curriculum.publishCurriculumVersion(draft.id, "admin", "Admin");

  const journey = await store.createJourney({
    coupleLinkId: "",
    programType: "premarital",
    status: "active",
    currentModuleId: "s2-temperament-discovery",
    counselorUserId: null,
    createdBy: "u-a",
    pairingMode: "journey_invite",
    participantAId: "u-a",
    participantBId: "u-b",
    curriculumVersion: published.version,
  });

  for (const uid of ["u-a", "u-b"]) {
    await store.upsertConsent({
      journeyId: journey.id,
      userId: uid,
      consentVersion: MARRIAGE_CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
    });
  }

  const MOD = "s2-temperament-discovery";
  const Q = "m01-soc-1";
  const now = new Date().toISOString();
  const userA = { id: "u-a", name: "Partner A" } as import("../src/lib/auth-types").PublicMember;
  const userB = { id: "u-b", name: "Partner B" } as import("../src/lib/auth-types").PublicMember;
  const stranger = { id: "u-x", name: "Stranger" } as import("../src/lib/auth-types").PublicMember;

  const answersA = { [Q]: "4", "m01-reflect-hopes": "private-a" };
  const answersB = { [Q]: "2", "m01-reflect-hopes": "private-b" };

  await store.saveResponse({
    id: "r-a",
    journeyId: journey.id,
    moduleId: MOD,
    contentVersion: published.version,
    userId: "u-a",
    status: "submitted",
    answers: answersA,
    lastSavedAt: now,
    submittedAt: now,
  });
  await store.saveResponse({
    id: "r-b",
    journeyId: journey.id,
    moduleId: MOD,
    contentVersion: published.version,
    userId: "u-b",
    status: "draft",
    answers: answersB,
    lastSavedAt: now,
  });

  await assert.rejects(
    () => markDiscussion(userA, MOD, Q),
    /Both partners must submit|Comparison is not available yet/,
    "M: pre-unlock discussion blocked",
  );

  await store.saveResponse({
    id: "r-b",
    journeyId: journey.id,
    moduleId: MOD,
    contentVersion: published.version,
    userId: "u-b",
    status: "submitted",
    answers: answersB,
    lastSavedAt: now,
    submittedAt: now,
  });
  await store.createUnlock({
    journeyId: journey.id,
    moduleId: MOD,
    contentVersion: published.version,
    unlockedAt: now,
  });

  await assert.rejects(
    () => markDiscussion(stranger, MOD, Q),
    /No active journey|not part|Comparison/,
    "L: outsider cannot reopen/mark",
  );

  const answersBefore = JSON.stringify((await store.getResponse(journey.id, MOD, "u-a"))!.answers);

  await markDiscussion(userA, MOD, Q);
  await saveDiscussionNote(userA, MOD, Q, "Note from A");
  await markDiscussion(userB, MOD, Q);
  await saveDiscussionNote(userB, MOD, Q, "Note from B");

  type NoteSnap = { author: string; body: string; at: string };
  function snapNotes(item: {
    discussion?: { sharedNotes: Array<{ authorUserId: string; body: string; markedAt: string }> };
  }): NoteSnap[] {
    return (item.discussion?.sharedNotes ?? [])
      .map((n) => ({ author: n.authorUserId, body: n.body, at: n.markedAt }))
      .sort((a, b) => a.author.localeCompare(b.author));
  }

  let cmp = await getComparisonForViewer(userA, MOD);
  let item = cmp.items.find((i) => i.questionId === Q)!;
  assert.equal(item.discussion?.discussed, true);
  const notesAfterCreate = snapNotes(item);
  assert.equal(notesAfterCreate.length, 2);
  assert.equal(notesAfterCreate.find((n) => n.author === "u-a")?.body, "Note from A");
  assert.equal(notesAfterCreate.find((n) => n.author === "u-b")?.body, "Note from B");

  await reopenDiscussion(userA, MOD, Q);
  cmp = await getComparisonForViewer(userA, MOD);
  item = cmp.items.find((i) => i.questionId === Q)!;
  assert.equal(item.discussion?.discussed, false, "E");
  assert.deepEqual(snapNotes(item), notesAfterCreate, "F");

  await markDiscussion(userA, MOD, Q);
  cmp = await getComparisonForViewer(userA, MOD);
  item = cmp.items.find((i) => i.questionId === Q)!;
  assert.equal(item.discussion?.discussed, true);
  assert.deepEqual(snapNotes(item), notesAfterCreate, "mark discussed must not erase notes after reopen");

  await markDiscussion(userB, MOD, Q);
  cmp = await getComparisonForViewer(userB, MOD);
  item = cmp.items.find((i) => i.questionId === Q)!;
  assert.equal(item.discussion?.discussed, true, "G");
  assert.deepEqual(snapNotes(item), notesAfterCreate, "H");

  await reopenDiscussion(userB, MOD, Q);
  cmp = await getComparisonForViewer(userA, MOD);
  item = cmp.items.find((i) => i.questionId === Q)!;
  assert.equal(item.discussion?.discussed, false);
  assert.deepEqual(snapNotes(item), notesAfterCreate, "J");

  await reopenDiscussion(userA, MOD, Q);
  await reopenDiscussion(userB, MOD, Q);
  cmp = await getComparisonForViewer(userA, MOD);
  item = cmp.items.find((i) => i.questionId === Q)!;
  assert.deepEqual(snapNotes(item), notesAfterCreate, "K");

  await saveDiscussionNote(userA, MOD, Q, "Note from A revised");
  const bMark = (await store.getDiscussionMarks(journey.id, MOD)).find((m) => m.markedByUserId === "u-b")!;
  assert.equal(bMark.sharedNote, "Note from B", "N");

  assert.equal(JSON.stringify((await store.getResponse(journey.id, MOD, "u-a"))!.answers), answersBefore, "O");

  const markOnlyQ = "m01-soc-2";
  await markDiscussion(userA, MOD, markOnlyQ);
  let markOnlyItem = (await getComparisonForViewer(userA, MOD)).items.find((i) => i.questionId === markOnlyQ)!;
  assert.equal(markOnlyItem.discussion?.discussed, true);
  assert.equal(markOnlyItem.discussion?.sharedNotes.length, 0);
  await reopenDiscussion(userB, MOD, markOnlyQ);
  markOnlyItem = (await getComparisonForViewer(userA, MOD)).items.find((i) => i.questionId === markOnlyQ)!;
  assert.equal(markOnlyItem.discussion?.discussed, false);
  assert.equal(markOnlyItem.discussion?.sharedNotes.length, 0);
  const markOnlyRows = (await store.getDiscussionMarks(journey.id, MOD)).filter(
    (m) => m.questionId === markOnlyQ,
  );
  assert.equal(markOnlyRows.length, 1, "mark-only row survives non-destructive reopen");
  assert.equal(markOnlyRows[0].discussedAt, null);

  const guardQ = "m01-soc-3";
  async function seedPartnerMark(
    id: string,
    sharedNote: string | undefined,
  ) {
    const row: MarriageDiscussionMarkRecord = {
      id,
      journeyId: journey.id,
      moduleId: MOD,
      questionId: guardQ,
      markedByUserId: "u-a",
      markedAt: now,
      discussedAt: now,
    };
    if (sharedNote !== undefined) {
      row.sharedNote = sharedNote;
    }
    await store.upsertDiscussionMark(row);
  }

  await seedPartnerMark("md-guard-ws", "   ");
  await markDiscussion(userA, MOD, guardQ);
  let guardRow = (await store.getDiscussionMarks(journey.id, MOD)).find(
    (m) => m.questionId === guardQ && m.markedByUserId === "u-a",
  )!;
  assert.equal(guardRow.sharedNote, "   ", "whitespace-only note preserved on status-only mark");

  await seedPartnerMark("md-guard-ws", "");
  await markDiscussion(userA, MOD, guardQ);
  guardRow = (await store.getDiscussionMarks(journey.id, MOD)).find(
    (m) => m.questionId === guardQ && m.markedByUserId === "u-a",
  )!;
  assert.equal(guardRow.sharedNote, "", "empty note not overwritten on status-only mark");

  await seedPartnerMark("md-guard-ws", "Exact partner note  ");
  await markDiscussion(userA, MOD, guardQ);
  guardRow = (await store.getDiscussionMarks(journey.id, MOD)).find(
    (m) => m.questionId === guardQ && m.markedByUserId === "u-a",
  )!;
  assert.equal(guardRow.sharedNote, "Exact partner note  ", "nonempty note preserved exactly");

  await store.upsertDiscussionMark({
    id: "md-guard-none",
    journeyId: journey.id,
    moduleId: MOD,
    questionId: guardQ,
    markedByUserId: "u-b",
    markedAt: now,
    discussedAt: now,
  });
  await markDiscussion(userB, MOD, guardQ);
  const noNoteRow = (await store.getDiscussionMarks(journey.id, MOD)).find(
    (m) => m.id === "md-guard-none",
  )!;
  assert.equal(noNoteRow.sharedNote, undefined, "mark-only row stays note-free");

  const legacyMarks: MarriageDiscussionMarkRecord[] = [
    {
      id: "legacy-1",
      journeyId: "j",
      moduleId: "m",
      questionId: "q",
      markedByUserId: "u-a",
      markedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
  assert.equal(deriveSharedDiscussion(legacyMarks, "q").discussed, true, "legacy mark without discussedAt");

  rmSync(dir, { recursive: true, force: true });
  delete process.env.MARRIAGE_HUB_STAGE2_ENABLED;
  console.log("marriage-discussion-reopen.test.ts: OK");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
