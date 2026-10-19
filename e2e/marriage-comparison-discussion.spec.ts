import { expect, test } from "@playwright/test";
import { E2E_USERS, prepareE2eIsolatedData } from "./helpers/e2e-isolated-data";
import { saveAndSubmitModule, setupPremaritalJourney } from "./helpers/marriage-assessment";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";

const MOD1 = "s2-temperament-discovery";
const PRIVATE_Q = "m01-reflect-hopes";

/** Test 9L — unique synthetic note bodies (isolated E2E only). */
const NOTE_A = "9L-e2e-partner-a-shared-note-7711";
const NOTE_B = "9L-e2e-partner-b-shared-note-8822";

type ComparisonDiscussion = {
  discussed: boolean;
  sharedNotes: Array<{ authorUserId: string; body: string; markedAt: string }>;
};

type ComparisonItem = {
  questionId: string;
  discussion?: ComparisonDiscussion;
};

function comparisonItem(items: ComparisonItem[], questionId: string) {
  const item = items.find((i) => i.questionId === questionId);
  expect(item, `comparison item ${questionId}`).toBeTruthy();
  return item!;
}

function expectExactSharedNotes(
  discussion: ComparisonDiscussion | undefined,
  expected: Array<{ authorUserId: string; body: string }>,
) {
  expect(discussion?.sharedNotes).toHaveLength(expected.length);
  for (const exp of expected) {
    const note = discussion!.sharedNotes.find((n) => n.authorUserId === exp.authorUserId);
    expect(note, `shared note for ${exp.authorUserId}`).toBeTruthy();
    expect(note!.body).toBe(exp.body);
  }
}

async function fetchComparisonItem(
  client: { get: (url: string) => Promise<{ json: () => Promise<{ items: ComparisonItem[] }> }> },
  moduleId: string,
  questionId: string,
) {
  const res = await client.get(`/api/marriage/comparison/${moduleId}`);
  const json = await res.json();
  return comparisonItem(json.items ?? [], questionId);
}

test.beforeEach(async () => {
  await prepareE2eIsolatedData();
});

test.describe("Marriage comparison discussion marks", () => {
  test("shared mark, reopen, auth, notes, and mobile layout", async ({ page, playwright, baseURL }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const stranger = await newAuthedRequest(playwright, baseURL!, "stranger");

    await setupPremaritalJourney(partnerA, partnerB);

    await saveAndSubmitModule(partnerA, MOD1);

    const earlyCompare = await partnerA.get(`/api/marriage/comparison/${MOD1}`);
    const earlyItem = (await earlyCompare.json()).items?.[0];
    const earlyQ = earlyItem?.questionId ?? "m01-soc-1";
    const earlyMark = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: earlyQ, action: "mark" },
    });
    expect(earlyMark.ok()).toBeFalsy();

    await saveAndSubmitModule(partnerB, MOD1);

    const answersSnap = await partnerA.get(`/api/marriage/assessment/${MOD1}`);
    const answersSnapJson = await answersSnap.json();
    const answersBefore = JSON.stringify(answersSnapJson.myResponse?.answers);
    const answersBSnap = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    const answersBBefore = JSON.stringify((await answersBSnap.json()).myResponse?.answers);

    const compareBefore = await partnerA.get(`/api/marriage/comparison/${MOD1}`);
    const compareJson = await compareBefore.json();
    const target =
      compareJson.items.find((i: { category: string }) => i.category === "needs_conversation") ??
      compareJson.items[0];
    expect(target).toBeTruthy();
    const QUESTION = target.questionId as string;
    expect(target.discussion?.discussed).not.toBe(true);

    const markRes = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "mark" },
    });
    expect(markRes.ok()).toBeTruthy();

    const answersAfter = await partnerA.get(`/api/marriage/assessment/${MOD1}`);
    expect(JSON.stringify((await answersAfter.json()).myResponse?.answers)).toBe(answersBefore);

    const aCompare = await partnerA.get(`/api/marriage/comparison/${MOD1}`);
    const aItems = (await aCompare.json()).items;
    const aItem = aItems.find((i: { questionId: string }) => i.questionId === QUESTION);
    expect(aItem.discussion?.discussed).toBe(true);
    expect(aItem.category).toBe(target.category);

    const bCompare = await partnerB.get(`/api/marriage/comparison/${MOD1}`);
    const bItem = (await bCompare.json()).items.find((i: { questionId: string }) => i.questionId === QUESTION);
    expect(bItem.discussion?.discussed).toBe(true);

    const forgedPrivate = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: PRIVATE_Q, action: "mark" },
    });
    expect(forgedPrivate.ok()).toBeFalsy();

    const strangerMark = await stranger.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "mark" },
    });
    expect(strangerMark.status()).toBeGreaterThanOrEqual(400);

    const expectedNotes = [
      { authorUserId: E2E_USERS.partnerA.id, body: NOTE_A },
      { authorUserId: E2E_USERS.partnerB.id, body: NOTE_B },
    ];

    const noteA = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "note", sharedNote: NOTE_A },
    });
    expect(noteA.ok()).toBeTruthy();

    const noteB = await partnerB.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "note", sharedNote: NOTE_B },
    });
    expect(noteB.ok()).toBeTruthy();

    const notedByA = await fetchComparisonItem(partnerA, MOD1, QUESTION);
    const notedByB = await fetchComparisonItem(partnerB, MOD1, QUESTION);
    expectExactSharedNotes(notedByA.discussion, expectedNotes);
    expectExactSharedNotes(notedByB.discussion, expectedNotes);

    const reopen = await partnerB.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "reopen" },
    });
    expect(reopen.ok()).toBeTruthy();

    const afterReopenA = await fetchComparisonItem(partnerA, MOD1, QUESTION);
    const afterReopenB = await fetchComparisonItem(partnerB, MOD1, QUESTION);
    expect(afterReopenA.discussion?.discussed).toBe(false);
    expect(afterReopenB.discussion?.discussed).toBe(false);
    expectExactSharedNotes(afterReopenA.discussion, expectedNotes);
    expectExactSharedNotes(afterReopenB.discussion, expectedNotes);

    const afterRefreshA = await fetchComparisonItem(partnerA, MOD1, QUESTION);
    const afterRefreshB = await fetchComparisonItem(partnerB, MOD1, QUESTION);
    expectExactSharedNotes(afterRefreshA.discussion, expectedNotes);
    expectExactSharedNotes(afterRefreshB.discussion, expectedNotes);

    const answersAfter9L = await partnerA.get(`/api/marriage/assessment/${MOD1}`);
    expect(JSON.stringify((await answersAfter9L.json()).myResponse?.answers)).toBe(answersBefore);
    const answersBAfter9L = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    expect(JSON.stringify((await answersBAfter9L.json()).myResponse?.answers)).toBe(answersBBefore);

    await signInPage(page, "partnerA");
    await page.goto(`/marriage/module/${MOD1}/compare`);
    await expect(page.getByTestId("marriage-comparison-view")).toBeVisible({ timeout: 20_000 });

    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await expect(page.getByTestId(`mark-discussed-${QUESTION}`)).toBeVisible();
    }

    await page.getByTestId(`mark-discussed-${QUESTION}`).click();
    await expect(page.getByTestId(`discussed-badge-${QUESTION}`)).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByTestId(`discussed-badge-${QUESTION}`)).toBeVisible({ timeout: 15_000 });

    const badNote = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "note", sharedNote: "   " },
    });
    expect(badNote.ok()).toBeFalsy();
  });
});
