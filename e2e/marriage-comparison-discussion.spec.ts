import { expect, test } from "@playwright/test";
import { prepareE2eIsolatedData } from "./helpers/e2e-isolated-data";
import { saveAndSubmitModule, setupPremaritalJourney } from "./helpers/marriage-assessment";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";

const MOD1 = "s2-temperament-discovery";
const PRIVATE_Q = "m01-reflect-hopes";

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

    const noteOnly = await partnerA.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "note", sharedNote: "We talked about recharge time." },
    });
    expect(noteOnly.ok()).toBeTruthy();

    const withNote = await partnerA.get(`/api/marriage/comparison/${MOD1}`);
    const noted = (await withNote.json()).items.find((i: { questionId: string }) => i.questionId === QUESTION);
    expect(noted.discussion?.sharedNotes?.length).toBeGreaterThan(0);

    const reopen = await partnerB.post("/api/marriage/discussion", {
      data: { moduleId: MOD1, questionId: QUESTION, action: "reopen" },
    });
    expect(reopen.ok()).toBeTruthy();

    const reopenedA = (await partnerA.get(`/api/marriage/comparison/${MOD1}`)).json();
    const reopenedB = (await partnerB.get(`/api/marriage/comparison/${MOD1}`)).json();
    const [aAfter, bAfter] = await Promise.all([reopenedA, reopenedB]);
    expect(aAfter.items.find((i: { questionId: string }) => i.questionId === QUESTION).discussion?.discussed).toBe(
      false,
    );
    expect(bAfter.items.find((i: { questionId: string }) => i.questionId === QUESTION).discussion?.discussed).toBe(
      false,
    );

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
