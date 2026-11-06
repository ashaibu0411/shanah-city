import { expect, test } from "@playwright/test";
import { prepareE2eIsolatedData } from "./helpers/e2e-isolated-data";
import { assignE2eCounselorToJourney } from "./helpers/marriage-e2e-store";
import { saveAndSubmitModule } from "./helpers/marriage-assessment";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";

test.beforeEach(async () => {
  await prepareE2eIsolatedData();
});

const MODULE_ID = "mod-01-knowing-yourself";
const PARTNER_A_SECRET = "e2e-partner-a-secret-recharge-alone";

test.describe("Marriage counseling two-partner journey", () => {
  test("invite, consent, private drafts, comparison unlock, counselor, export ACL", async ({
    playwright,
    baseURL,
    page,
  }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const counselor = await newAuthedRequest(playwright, baseURL!, "counselor");
    const stranger = await newAuthedRequest(playwright, baseURL!, "stranger");

    const inviteRes = await partnerA.post("/api/marriage/invite", {
      data: { action: "create", programType: "premarital" },
    });
    const inviteBody = await inviteRes.json();
    expect(inviteRes.ok(), inviteBody.error).toBeTruthy();
    const inviteCode = (inviteBody.code ?? inviteBody.invite?.code) as string;
    const journeyId = inviteBody.journey.id as string;
    expect(inviteCode).toBeTruthy();

    await partnerA.post("/api/marriage/journey", {
      data: { action: "consent", journeyId },
    });

    const acceptRes = await partnerB.post("/api/marriage/invite", {
      data: { action: "accept", code: inviteCode },
    });
    expect(acceptRes.ok(), (await acceptRes.json()).error).toBeTruthy();
    await partnerB.post("/api/marriage/journey", {
      data: { action: "consent", journeyId },
    });

    assignE2eCounselorToJourney(journeyId);

    const aAssessment = await partnerA.get(`/api/marriage/assessment/${MODULE_ID}`);
    const aData = await aAssessment.json();
    expect(aAssessment.ok()).toBeTruthy();
    const kypQuestion =
      aData.module.questions.find((q: { id: string }) => q.id === "kyp-recharge")?.id ??
      aData.module.questions[0]?.id;
    expect(kypQuestion).toBeTruthy();

    await partnerA.patch(`/api/marriage/assessment/${MODULE_ID}`, {
      data: { answers: { [kypQuestion]: PARTNER_A_SECRET } },
    });

    const bPeek = await partnerB.get(`/api/marriage/assessment/${MODULE_ID}`);
    const bPeekJson = await bPeek.json();
    expect(bPeek.ok()).toBeTruthy();
    expect(bPeekJson.partnerProgress?.status).toMatch(/in_progress|not_started/);
    expect(JSON.stringify(bPeekJson)).not.toContain(PARTNER_A_SECRET);

    const compareEarly = await partnerA.get(`/api/marriage/comparison/${MODULE_ID}`);
    expect(compareEarly.status()).toBeGreaterThanOrEqual(400);

    await saveAndSubmitModule(partnerA, MODULE_ID);
    await saveAndSubmitModule(partnerB, MODULE_ID);

    const compareRes = await partnerA.get(`/api/marriage/comparison/${MODULE_ID}`);
    const compare = await compareRes.json();
    expect(compareRes.ok(), compare.error).toBeTruthy();
    expect(compare.items?.length).toBeGreaterThan(0);
    for (const item of compare.items) {
      expect(item).not.toHaveProperty("answersJson");
    }

    const exportStranger = await stranger.get(`/api/marriage/privacy?journeyId=${journeyId}`);
    expect(exportStranger.status()).toBe(403);

    const exportA = await partnerA.get(`/api/marriage/privacy?journeyId=${journeyId}`);
    expect(exportA.ok()).toBeTruthy();
    const exportJson = await exportA.json();
    expect(exportJson.responses?.length).toBeGreaterThan(0);

    const counselorDetail = await counselor.get(`/api/marriage/counselor/journey/${journeyId}`);
    expect(counselorDetail.ok(), (await counselorDetail.json()).error).toBeTruthy();

    const noteRes = await counselor.post(`/api/marriage/counselor/journey/${journeyId}`, {
      data: { action: "save_note", body: "E2E counselor note — synthetic." },
    });
    expect(noteRes.ok()).toBeTruthy();

    const counselorBlocked = await stranger.get(`/api/marriage/counselor/journey/${journeyId}`);
    expect(counselorBlocked.status()).toBe(403);

    const finModule = "s2-financial-workshop";
    const secretIncome = "e2e-private-income-884422";
    await partnerA.patch(`/api/marriage/assessment/${finModule}`, {
      data: { answers: { "m05-income-private": secretIncome } },
    });
    const partnerBFin = await partnerB.get(`/api/marriage/assessment/${finModule}`);
    const finJson = await partnerBFin.json();
    expect(JSON.stringify(finJson)).not.toContain(secretIncome);

    const stage2Dash = await partnerA.get("/api/marriage/stage2");
    expect(stage2Dash.ok()).toBeTruthy();
    const dash = await stage2Dash.json();
    expect(dash.activities?.length).toBeGreaterThan(0);

    await signInPage(page, "partnerA");
    await page.goto("/marriage");
    await expect(page.getByRole("heading", { name: /Before We Say/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Compare ready|Submitted|Waiting for partner/i).first()).toBeVisible();
  });

  test("partner B UI join flow with invite code", async ({ page, baseURL, playwright }) => {
    test.setTimeout(120_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const inviteRes = await partnerA.post("/api/marriage/invite", {
      data: { action: "create", programType: "enrichment" },
    });
    const invitePayload = await inviteRes.json();
    const code = invitePayload.code ?? invitePayload.invite?.code;
    const journey = invitePayload.journey;
    expect(code).toBeTruthy();
    await partnerA.post("/api/marriage/journey", {
      data: { action: "consent", journeyId: journey.id },
    });

    await signInPage(page, "partnerB");
    await page.goto("/marriage/join");
    await page.locator("#invite-code").fill(String(code));
    await page.getByRole("button", { name: /join journey/i }).click();
    await expect(page).toHaveURL(/\/marriage/);
  });
});
