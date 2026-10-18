import assert from "node:assert/strict";
import { attachDiscussionToComparisonItems, deriveSharedDiscussion } from "../src/lib/marriage-discussion-utils";
import type { MarriageComparisonItem } from "../src/lib/marriage-counseling-types";

const baseItem: MarriageComparisonItem = {
  questionId: "m01-soc-1",
  prompt: "Test",
  myAnswer: "4",
  partnerAnswer: "2",
  category: "needs_conversation",
};

function run() {
  const empty = deriveSharedDiscussion([], "m01-soc-1");
  assert.equal(empty.discussed, false);

  const marks = [
    {
      id: "1",
      journeyId: "j1",
      moduleId: "mod1",
      questionId: "m01-soc-1",
      markedByUserId: "user-a",
      markedAt: "2026-01-01T12:00:00.000Z",
    },
  ];
  const shared = deriveSharedDiscussion(marks, "m01-soc-1");
  assert.equal(shared.discussed, true);
  assert.equal(shared.markedByUserId, "user-a");

  const items = attachDiscussionToComparisonItems([baseItem], marks);
  assert.equal(items[0].discussion?.discussed, true);
  assert.equal(items[0].category, "needs_conversation");

  const noteMarks = [
    {
      id: "2",
      journeyId: "j1",
      moduleId: "mod1",
      questionId: "m01-soc-1",
      markedByUserId: "user-a",
      sharedNote: "Kept note",
      markedAt: "2026-01-01T12:00:00.000Z",
      discussedAt: null,
    },
  ];
  const reopened = deriveSharedDiscussion(noteMarks, "m01-soc-1");
  assert.equal(reopened.discussed, false);
  assert.equal(reopened.sharedNotes.length, 1);
  assert.equal(reopened.sharedNotes[0].body, "Kept note");

  console.log("marriage-discussion-utils.test.ts: OK");
}

run();
