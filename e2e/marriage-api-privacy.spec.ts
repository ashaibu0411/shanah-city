import { expect, test } from "@playwright/test";
import { prepareE2eIsolatedData } from "./helpers/e2e-isolated-data";
import { saveAndSubmitModule, setupPremaritalJourney } from "./helpers/marriage-assessment";
import { newAuthedRequest } from "./helpers/marriage-auth";

const MOD1 = "s2-temperament-discovery";
const MOD2 = "s2-mod-02-family-background";
const PRIVATE_IDS = ["m01-reflect-hopes", "m01-learn-framework", "m01-private-childhood", "m01-review-private"];
const SHARED_LIKERT = "m01-soc-1";
const PRIVATE_Q = "m01-reflect-hopes";
const CONSENT_Q = "m02-share-optional";

test.beforeEach(async () => {
  await prepareE2eIsolatedData();
});

function assertNoPartnerAnswerLeak(payload: unknown, partnerSecret: string) {
  const text = JSON.stringify(payload);
  expect(text).not.toContain(partnerSecret);
  const obj = payload as {
    myResponse?: { answers?: Record<string, unknown> };
    partnerResponse?: unknown;
    partnerAnswers?: unknown;
  };
  expect(obj.partnerResponse).toBeUndefined();
  expect(obj.partnerAnswers).toBeUndefined();
}

test.describe("STAGING TEST 8B — API privacy (isolated fixtures)", () => {
  test("Test 1–2: assessment isolation and comparison filtering", async ({ playwright, baseURL }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");

    const partnerASecret = "8b-privacy-partner-a-private-9911";
    const partnerBSecret = "8b-privacy-partner-b-private-8822";

    await setupPremaritalJourney(partnerA, partnerB);

    await partnerA.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { [PRIVATE_Q]: partnerASecret, [SHARED_LIKERT]: "5" } },
    });
    await partnerB.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { [PRIVATE_Q]: partnerBSecret, [SHARED_LIKERT]: "2" } },
    });

    const bDraft = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    const bDraftJson = await bDraft.json();
    expect(bDraft.ok()).toBeTruthy();
    assertNoPartnerAnswerLeak(bDraftJson, partnerASecret);
    expect(bDraftJson.myResponse?.answers?.[PRIVATE_Q]).toBe(partnerBSecret);
    expect(bDraftJson.partnerProgress?.status).toMatch(/in_progress|not_started|submitted/);

    await saveAndSubmitModule(partnerA, MOD1);
    await saveAndSubmitModule(partnerB, MOD1);

    const bSubmitted = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    const bSubmittedJson = await bSubmitted.json();
    expect(bSubmitted.ok()).toBeTruthy();
    assertNoPartnerAnswerLeak(bSubmittedJson, partnerASecret);
    expect(bSubmittedJson.myResponse?.answers?.[PRIVATE_Q]).toBe(partnerBSecret);
    expect(bSubmittedJson.partnerProgress?.status).toBe("submitted");

    const compareRes = await partnerB.get(`/api/marriage/comparison/${MOD1}`);
    const compareJson = await compareRes.json();
    expect(compareRes.ok()).toBeTruthy();

    const itemIds = (compareJson.items ?? []).map((i: { questionId: string }) => i.questionId);
    for (const id of PRIVATE_IDS) {
      expect(itemIds).not.toContain(id);
    }
    expect(itemIds).toContain(SHARED_LIKERT);

    const compareText = JSON.stringify(compareJson);
    expect(compareText).not.toContain(partnerASecret);
    expect(compareText).not.toContain(partnerBSecret);

    const sharedItem = compareJson.items.find((i: { questionId: string }) => i.questionId === SHARED_LIKERT);
    expect(sharedItem.myAnswer).toBeTruthy();
    expect(sharedItem.partnerAnswer).toBeTruthy();
  });

  test("Test 3: discussion API rejects private question (mark, note, reopen)", async ({
    playwright,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    await setupPremaritalJourney(partnerA, partnerB);
    await saveAndSubmitModule(partnerA, MOD1);
    await saveAndSubmitModule(partnerB, MOD1);

    for (const action of ["mark", "note", "reopen"] as const) {
      const body =
        action === "note"
          ? { moduleId: MOD1, questionId: PRIVATE_Q, action, sharedNote: "should not save" }
          : { moduleId: MOD1, questionId: PRIVATE_Q, action };
      const res = await partnerA.post("/api/marriage/discussion", { data: body });
      expect(res.ok(), `action=${action} ${await res.text()}`).toBeFalsy();
    }
  });

  test("Test 4: unauthorized and cross-couple access", async ({ playwright, baseURL }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const stranger = await newAuthedRequest(playwright, baseURL!, "stranger");
    const anon = await playwright.request.newContext({ baseURL: baseURL! });

    await setupPremaritalJourney(partnerA, partnerB);
    const secret = "8b-cross-couple-leak-check";
    await partnerA.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { [PRIVATE_Q]: secret } },
    });
    await saveAndSubmitModule(partnerA, MOD1);
    await saveAndSubmitModule(partnerB, MOD1);

    for (const ctx of [anon, stranger]) {
      const ass = await ctx.get(`/api/marriage/assessment/${MOD1}`);
      expect(ass.status()).toBeGreaterThanOrEqual(400);

      const cmp = await ctx.get(`/api/marriage/comparison/${MOD1}`);
      expect(cmp.status()).toBeGreaterThanOrEqual(400);

      const disc = await ctx.post("/api/marriage/discussion", {
        data: { moduleId: MOD1, questionId: SHARED_LIKERT, action: "mark" },
      });
      expect(disc.status()).toBeGreaterThanOrEqual(400);
    }

    const bAss = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    assertNoPartnerAnswerLeak(await bAss.json(), secret);

    await anon.dispose();
  });

  test("Test 5: explicit consent gating on comparison API", async ({ playwright, baseURL }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const journeyId = await setupPremaritalJourney(partnerA, partnerB);

    const consentSecret = "8b-consent-gated-answer-7711";
    await partnerA.patch(`/api/marriage/assessment/${MOD2}`, {
      data: { answers: { [CONSENT_Q]: consentSecret } },
    });
    await partnerB.patch(`/api/marriage/assessment/${MOD2}`, {
      data: { answers: { [CONSENT_Q]: "partner-b-consent-answer" } },
    });
    await saveAndSubmitModule(partnerA, MOD2);
    await saveAndSubmitModule(partnerB, MOD2);

    const compareNoConsent = await partnerA.get(`/api/marriage/comparison/${MOD2}`);
    const idsNoConsent = ((await compareNoConsent.json()).items ?? []).map(
      (i: { questionId: string }) => i.questionId,
    );
    expect(idsNoConsent).not.toContain(CONSENT_Q);

    await partnerA.post("/api/marriage/stage2", {
      data: {
        action: "set_sharing_consent",
        journeyId,
        moduleId: MOD2,
        questionId: CONSENT_Q,
        granted: true,
      },
    });
    await partnerB.post("/api/marriage/stage2", {
      data: {
        action: "set_sharing_consent",
        journeyId,
        moduleId: MOD2,
        questionId: CONSENT_Q,
        granted: true,
      },
    });

    const compareGranted = await partnerA.get(`/api/marriage/comparison/${MOD2}`);
    const compareGrantedJson = await compareGranted.json();
    const idsGranted = (compareGrantedJson.items ?? []).map((i: { questionId: string }) => i.questionId);
    expect(idsGranted).toContain(CONSENT_Q);
    expect(JSON.stringify(compareGrantedJson)).toContain(consentSecret);
  });
});
