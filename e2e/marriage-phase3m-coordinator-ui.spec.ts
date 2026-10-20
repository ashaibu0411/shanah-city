import { expect, test } from "@playwright/test";
import { resetMarriageE2eState } from "./helpers/e2e-isolated-data";
import { newAuthedRequest, signInPage } from "./helpers/marriage-auth";
import { createConsentedPremaritalJourney } from "./helpers/phase3m-assignment";
import {
  E2E_ADMIN_A_LABEL,
  E2E_ADMIN_B_LABEL,
  E2E_COUPLE_LABEL,
  acceptBrowserDialogs,
  expectAdminDoesNotSeeCoupleOnAssignmentsPage,
  expectAdminSeesCoupleOnAssignmentsPage,
  uiAssignCoordinatorForCouple,
  uiRemoveCoordinatorForCouple,
} from "./helpers/phase3m-ui";

test.beforeEach(async () => {
  await resetMarriageE2eState();
});

test.describe("Phase 3M — administrative coordinator UI", () => {
  test("Senior Pastor assigns, reassigns, and removes coordinators; admin roster updates in UI", async ({
    page,
    playwright,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    const partnerA = await newAuthedRequest(playwright, baseURL!, "partnerA");
    const partnerB = await newAuthedRequest(playwright, baseURL!, "partnerB");
    await createConsentedPremaritalJourney(partnerA, partnerB);

    acceptBrowserDialogs(page);
    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await expect(page.getByRole("heading", { name: /Administrative coordinators/i })).toBeVisible();
    await uiAssignCoordinatorForCouple(page, E2E_COUPLE_LABEL, E2E_ADMIN_A_LABEL);

    await signInPage(page, "adminA");
    await expectAdminSeesCoupleOnAssignmentsPage(page, E2E_COUPLE_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiAssignCoordinatorForCouple(page, E2E_COUPLE_LABEL, E2E_ADMIN_B_LABEL, {
      reassign: true,
    });

    await signInPage(page, "adminA");
    await expectAdminDoesNotSeeCoupleOnAssignmentsPage(page, E2E_COUPLE_LABEL);

    await signInPage(page, "adminB");
    await expectAdminSeesCoupleOnAssignmentsPage(page, E2E_COUPLE_LABEL);

    await signInPage(page, "seniorPastor");
    await page.goto("/marriage/admin/counselor-assignments");
    await uiRemoveCoordinatorForCouple(page, E2E_COUPLE_LABEL);

    await signInPage(page, "adminA");
    await expectAdminDoesNotSeeCoupleOnAssignmentsPage(page, E2E_COUPLE_LABEL);
    await signInPage(page, "adminB");
    await expectAdminDoesNotSeeCoupleOnAssignmentsPage(page, E2E_COUPLE_LABEL);
  });
});
