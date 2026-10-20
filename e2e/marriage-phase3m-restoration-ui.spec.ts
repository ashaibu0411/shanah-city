import { expect, test } from "@playwright/test";
import { resetMarriageE2eState } from "./helpers/e2e-isolated-data";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";
import {
  assertNoClinicalLeak,
  createConsentedPremaritalJourney,
  expectCounselorClinicalAccess,
  seedPrivateAssessmentAnswer,
} from "./helpers/phase3m-assignment";
import {
  E2E_ADMIN_A_LABEL,
  E2E_COUPLE_LABEL,
  E2E_COUNSELOR_LABEL,
  acceptBrowserDialogs,
  uiAcknowledgeRestorationOnMarriageHub,
  uiAdminSubmitCounselorRequest,
  uiAssignCoordinatorForCouple,
  uiRevokeCounselorOnMarriageHub,
  uiSeniorPastorApproveFirstPending,
} from "./helpers/phase3m-ui";

test.beforeEach(async () => {
  await resetMarriageE2eState();
});

test.describe("Phase 3M — counselor approval and restoration UI", () => {
  test("SP approves via UI; participant revokes and acknowledges restoration in browser", async ({
    page,
    playwright,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const counselor = await newAuthedRequest(playwright, baseURL!, "counselor");
    const { journeyId } = await createConsentedPremaritalJourney(partnerA, partnerB);
    await seedPrivateAssessmentAnswer(partnerA);

    acceptBrowserDialogs(page);
    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAssignCoordinatorForCouple(page, E2E_COUPLE_LABEL, E2E_ADMIN_A_LABEL);

    await signInPage(page, "adminA");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAdminSubmitCounselorRequest(page, E2E_COUPLE_LABEL, E2E_COUNSELOR_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    const approveBody = await uiSeniorPastorApproveFirstPending(page);
    expect(approveBody.executed).toBe(true);
    await expect(page.getByText(/No pending requests/i)).toBeVisible();
    await expectCounselorClinicalAccess(counselor, journeyId, true);

    await signInPage(page, "partnerA");
    await uiRevokeCounselorOnMarriageHub(page);
    await expectCounselorClinicalAccess(counselor, journeyId, false);

    await signInPage(page, "adminA");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAdminSubmitCounselorRequest(page, E2E_COUPLE_LABEL, E2E_COUNSELOR_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    const restoreApprove = await uiSeniorPastorApproveFirstPending(page);
    expect(restoreApprove.executed).toBe(false);

    await signInPage(page, "partnerA");
    const ackBody = await uiAcknowledgeRestorationOnMarriageHub(page, E2E_COUNSELOR_LABEL);
    assertNoClinicalLeak(ackBody);
    expect(ackBody.executed).toBe(true);
    expect(await page.content()).not.toContain("phase3m-e2e-clinical-secret-marker");
    await expectCounselorClinicalAccess(counselor, journeyId, true);
    void partnerB;
  });

  test("both spouses must acknowledge restoration in the browser when both revoked", async ({
    page,
    playwright,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    const counselor = await newAuthedRequest(playwright, baseURL!, "counselor");
    const { journeyId } = await createConsentedPremaritalJourney(partnerA, partnerB);

    acceptBrowserDialogs(page);
    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAssignCoordinatorForCouple(page, E2E_COUPLE_LABEL, E2E_ADMIN_A_LABEL);

    await signInPage(page, "adminA");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAdminSubmitCounselorRequest(page, E2E_COUPLE_LABEL, E2E_COUNSELOR_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiSeniorPastorApproveFirstPending(page);

    await signInPage(page, "partnerA");
    await uiRevokeCounselorOnMarriageHub(page);
    await signInPage(page, "partnerB");
    await uiRevokeCounselorOnMarriageHub(page);

    await signInPage(page, "adminA");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAdminSubmitCounselorRequest(page, E2E_COUPLE_LABEL, E2E_COUNSELOR_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiSeniorPastorApproveFirstPending(page);

    await signInPage(page, "partnerA");
    const ackA = await uiAcknowledgeRestorationOnMarriageHub(page, E2E_COUNSELOR_LABEL);
    expect(ackA.executed).toBe(false);
    await expectCounselorClinicalAccess(counselor, journeyId, false);

    await signInPage(page, "partnerB");
    const ackB = await uiAcknowledgeRestorationOnMarriageHub(page, E2E_COUNSELOR_LABEL);
    expect(ackB.executed).toBe(true);
    await expectCounselorClinicalAccess(counselor, journeyId, true);
  });
});
