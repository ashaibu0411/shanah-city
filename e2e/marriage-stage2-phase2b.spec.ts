import { expect, test } from "@playwright/test";
import { prepareE2eIsolatedData } from "./helpers/e2e-isolated-data";
import {
  minimalAnswersForQuestions,
  saveAndSubmitModule,
  setupPremaritalJourney,
} from "./helpers/marriage-assessment";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";

const MOD1 = "s2-temperament-discovery";
const FIN = "s2-financial-workshop";
const INTIMACY = "s2-mod-06-intimacy";
const LESSON_SOCIAL = "m01-l02-social";

test.beforeEach(async () => {
  await prepareE2eIsolatedData();
});

test.describe("Stage 2 Phase 2B", () => {
  test("learning center, lesson save, refresh, and re-login resume", async ({ page, playwright, baseURL }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const journeyId = await setupPremaritalJourney(partnerA, partnerB);

    await signInPage(page, "partnerA");
    await page.request.post("/api/marriage/journey", {
      data: { action: "consent", journeyId },
    });
    await page.goto("/marriage/learn");
    await expect(page.getByTestId("marriage-learning-center")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Discover each other/i }).click();
    await page.locator(`a[href="/marriage/module/${MOD1}"]`).first().click();
    await expect(page.getByTestId("marriage-module-lessons")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId(`lesson-${LESSON_SOCIAL}`).click();
    await page.locator("button").filter({ hasText: /Agree|Neutral|Disagree/i }).first().click();
    await page.locator(".marriage-assessment-sticky-footer").getByRole("button", { name: /Continue/i }).click({ force: true });
    await page.waitForTimeout(1000);

    await page.goto(`/marriage/module/${MOD1}`);
    await expect(page.getByTestId("marriage-module-lessons")).toBeVisible({ timeout: 20_000 });
    expect(await page.getByTestId(`lesson-${LESSON_SOCIAL}`).innerText()).toMatch(/1\/\d+ responses/);

    await page.context().clearCookies();
    await signInPage(page, "partnerA");
    await page.request.post("/api/marriage/journey", {
      data: { action: "consent", journeyId },
    });
    await page.goto(`/marriage/module/${MOD1}`);
    await expect(page.getByTestId("marriage-module-lessons")).toBeVisible({ timeout: 20_000 });
    expect(await page.getByTestId(`lesson-${LESSON_SOCIAL}`).innerText()).toMatch(/1\/\d+ responses/);
  });

  test("submitted module: read-only answers, navigation, refresh, PATCH blocked", async ({
    page,
    playwright,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const journeyId = await setupPremaritalJourney(partnerA, partnerB);

    const privateSecret = "e2e-submitted-readonly-private-7711";
    await partnerA.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { "m01-reflect-hopes": privateSecret } },
    });
    await saveAndSubmitModule(partnerA, MOD1);

    const socialQuestionId = "m01-soc-1";
    const aAss = await partnerA.get(`/api/marriage/assessment/${MOD1}`);
    const aJson = await aAss.json();
    expect(aJson.myResponse?.status).toBe("submitted");
    expect(aJson.myResponse?.answers?.[socialQuestionId]).toBeTruthy();
    expect(aJson.myResponse?.answers?.["m01-reflect-hopes"]).toBe(privateSecret);

    const patchBlocked = await partnerA.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { [socialQuestionId]: "1" } },
    });
    expect(patchBlocked.ok()).toBeFalsy();

    const bPeek = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    const bJson = await bPeek.json();
    expect(bJson.myResponse?.answers?.["m01-reflect-hopes"]).toBeUndefined();
    expect(JSON.stringify(bJson)).not.toContain(privateSecret);
    expect(bJson.comparisonUnlocked).toBe(false);

    await signInPage(page, "partnerA");
    await page.request.post("/api/marriage/journey", {
      data: { action: "consent", journeyId },
    });
    await page.goto(`/marriage/module/${MOD1}?lesson=${LESSON_SOCIAL}`);
    await expect(page.getByTestId("marriage-lesson-read-only-banner")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Submitted — Read Only/i)).toBeVisible();
    await expect(
      page.getByText(/After a full day of people and noise, I need quiet before I can connect well at home/i),
    ).toBeVisible();

    const savedChoice = String(aJson.myResponse.answers[socialQuestionId]);
    const likertLabels: Record<string, RegExp> = {
      "1": /Strongly disagree/i,
      "2": /Disagree/i,
      "3": /Neutral/i,
      "4": /Agree/i,
      "5": /Strongly agree/i,
    };
    const activeOption = page.locator("button").filter({ hasText: likertLabels[savedChoice] ?? /Agree/i }).first();
    await expect(activeOption).toBeDisabled();

    await page.locator(".marriage-assessment-sticky-footer").getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText(/Item 2 of/i)).toBeVisible({ timeout: 10_000 });
    await page.locator(".marriage-assessment-sticky-footer").getByRole("button", { name: /Back/i }).click();
    await expect(page.getByText(/Item 1 of/i)).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("marriage-lesson-read-only-banner")).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/After a full day of people and noise, I need quiet before I can connect well at home/i),
    ).toBeVisible();
  });

  test("API: temperament compare, snapshot, privacy, budget, intimacy gate", async ({
    page,
    playwright,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const stranger = await newAuthedRequest(playwright, baseURL!, "stranger");

    await setupPremaritalJourney(partnerA, partnerB);

    const dash = await partnerA.get("/api/marriage/stage2");
    expect(dash.ok()).toBeTruthy();
    const dashJson = await dash.json();
    const allModuleIds = (dashJson.sections ?? []).flatMap((s: { moduleIds: string[] }) => s.moduleIds);
    expect(allModuleIds).not.toContain(INTIMACY);

    const intimacyBlocked = await partnerA.get(`/api/marriage/assessment/${INTIMACY}`);
    expect(intimacyBlocked.status()).toBeGreaterThanOrEqual(400);

    const secret = "e2e-draft-secret-temp-9911";
    await partnerA.patch(`/api/marriage/assessment/${MOD1}`, {
      data: { answers: { "m01-reflect-hopes": secret } },
    });
    const bPeek = await partnerB.get(`/api/marriage/assessment/${MOD1}`);
    expect(JSON.stringify(await bPeek.json())).not.toContain(secret);

    await saveAndSubmitModule(partnerA, MOD1);
    await saveAndSubmitModule(partnerB, MOD1);

    const aAss = await partnerA.get(`/api/marriage/assessment/${MOD1}`);
    const aJson = await aAss.json();
    expect(aJson.myResponse?.status).toBe("submitted");
    expect(aJson.comparisonUnlocked).toBe(true);

    const compareRes = await partnerA.get(`/api/marriage/comparison/${MOD1}`);
    const compare = await compareRes.json();
    expect(compareRes.ok(), compare.error ?? "compare failed").toBeTruthy();
    expect(compare.items?.length).toBeGreaterThan(0);

    const tempInsights = await partnerA.get("/api/marriage/stage2?view=temperament");
    expect(tempInsights.ok()).toBeTruthy();

    await signInPage(page, "partnerA");
    await page.goto(`/marriage/module/${MOD1}/compare`);
    await expect(page.getByTestId("temperament-snapshot")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("temperament-scoring-model-version")).toContainText("2.0.0");

    const strangerAssessment = await stranger.get(`/api/marriage/assessment/${MOD1}`);
    expect(strangerAssessment.status()).toBeGreaterThanOrEqual(400);

    const finGet = await partnerA.get(`/api/marriage/assessment/${FIN}`);
    const finMod = await finGet.json();
    const budgetId = finMod.module.questions.find((q: { type: string }) => q.type === "budget_worksheet")?.id;
    expect(budgetId).toBeTruthy();

    const overspend = {
      mode: "hypothetical",
      monthlyIncome: 1000,
      lines: [{ id: "housing", label: "Rent", amount: 2000 }],
    };
    await partnerA.patch(`/api/marriage/assessment/${FIN}`, {
      data: { answers: { [budgetId]: overspend } },
    });
    const badSubmit = await partnerA.post(`/api/marriage/assessment/${FIN}`, {
      data: { action: "submit" },
    });
    expect(badSubmit.ok()).toBeFalsy();

    const goodAnswers = minimalAnswersForQuestions(finMod.module.questions);
    await partnerA.patch(`/api/marriage/assessment/${FIN}`, { data: { answers: goodAnswers } });
    const goodSubmit = await partnerA.post(`/api/marriage/assessment/${FIN}`, {
      data: { action: "submit" },
    });
    expect(goodSubmit.ok()).toBeTruthy();
  });
});
