import { expect, test } from "@playwright/test";
import { resetMarriageE2eState } from "./helpers/e2e-isolated-data";
import { signInPage } from "./helpers/marriage-auth";

test.beforeEach(async () => {
  await resetMarriageE2eState();
});

test.describe("Phase 3M counselor assignment — browser UX guards", () => {
  test("mobile viewport: admin empty state and no coordinator controls", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await signInPage(page, "adminA");
    await page.goto("/marriage/admin/counselor-assignments");
    await expect(
      page.getByText(/No couples are assigned to you yet|Couples & counselor status/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Administrative coordinators/i })).toHaveCount(0);
  });

  test("ordinary member cannot access counselor assignments admin page", async ({ page }) => {
    await signInPage(page, "member");
    await page.goto("/marriage/admin/counselor-assignments");
    await expect(page.getByText(/not authorized/i)).toBeVisible();
  });
});
