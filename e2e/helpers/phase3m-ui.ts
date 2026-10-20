import { expect, type Page } from "@playwright/test";

export const E2E_COUPLE_LABEL = "E2E Partner A & E2E Partner B";
export const E2E_ADMIN_A_LABEL = "E2E Assignment Admin A";
export const E2E_ADMIN_B_LABEL = "E2E Assignment Admin B";
export const E2E_COUNSELOR_LABEL = "E2E Counselor";

const dialogWiredPages = new WeakSet<Page>();

export function acceptBrowserDialogs(page: Page) {
  if (dialogWiredPages.has(page)) return;
  dialogWiredPages.add(page);
  page.on("dialog", (dialog) => void dialog.accept());
}

export async function expectUiAssignmentPost(
  page: Page,
  trigger: () => Promise<void>,
  label: string,
) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/api/marriage/counselor/assignment-requests") &&
        r.request().method() === "POST",
    ),
    trigger(),
  ]);
  const body = (await response.json()) as Record<string, unknown> & { error?: string };
  expect(response.ok(), `${label} failed: ${body.error ?? JSON.stringify(body)}`).toBeTruthy();
  return body;
}

export async function uiAssignCoordinatorForCouple(
  page: Page,
  coupleLabel: string,
  adminLabel: string,
  options?: { reassign?: boolean },
) {
  const card = page.locator("li").filter({ hasText: coupleLabel }).first();
  await expect(card).toBeVisible();
  const openLabel = options?.reassign ? "Reassign coordinator" : "Assign coordinator";
  await card.getByRole("button", { name: openLabel }).click();
  await card.getByLabel("Assignment admin").selectOption({ label: adminLabel });
  await expectUiAssignmentPost(page, () =>
    card
      .getByRole("button", {
        name: options?.reassign ? "Confirm reassignment" : "Confirm assignment",
      })
      .click(),
  `assign coordinator (${adminLabel})`);
  await expect(card.getByText(adminLabel)).toBeVisible();
}

export async function uiRemoveCoordinatorForCouple(page: Page, coupleLabel: string) {
  const card = page.locator("li").filter({ hasText: coupleLabel }).first();
  await expectUiAssignmentPost(
    page,
    () => card.getByRole("button", { name: "Remove coordinator" }).click(),
    "remove coordinator",
  );
  await expect(card.getByText("Unassigned")).toBeVisible();
}

export async function uiAdminSubmitCounselorRequest(
  page: Page,
  coupleLabel: string,
  counselorLabel: string,
) {
  const row = page.locator("li").filter({ hasText: coupleLabel }).first();
  await row.getByRole("button", { name: "Submit assignment request" }).click();
  const panel = row.locator("div.border-t");
  await expect(panel).toBeVisible();
  const selects = panel.locator("select");
  await selects.nth(0).selectOption("assign");
  await selects.nth(1).selectOption({ label: counselorLabel });
  await expectUiAssignmentPost(
    page,
    () => panel.getByRole("button", { name: "Submit for Senior Pastor approval" }).click(),
    "submit counselor assignment",
  );
}

export async function uiSeniorPastorApproveFirstPending(page: Page) {
  const approveButton = page.getByRole("button", { name: /^Approve$/ }).first();
  await expect(approveButton).toBeVisible();
  const body = await expectUiAssignmentPost(page, () => approveButton.click(), "SP approve");
  return body;
}

export async function expectAdminSeesCoupleOnAssignmentsPage(page: Page, coupleLabel: string) {
  await page.goto("/marriage/admin/counselor-assignments");
  await expect(page.getByRole("heading", { name: /Couples & counselor status/i })).toBeVisible();
  await expect(page.getByText(coupleLabel).first()).toBeVisible();
}

export async function expectAdminDoesNotSeeCoupleOnAssignmentsPage(page: Page, coupleLabel: string) {
  await page.goto("/marriage/admin/counselor-assignments");
  await expect(page.getByText(coupleLabel)).toHaveCount(0);
  await expect(
    page.getByText(/No couples are assigned to you yet|No active marriage journeys/i).first(),
  ).toBeVisible();
}

export async function uiRevokeCounselorOnMarriageHub(page: Page) {
  await page.goto("/marriage");
  const consentButton = page.getByRole("button", { name: /I understand — continue/i });
  if (await consentButton.isVisible().catch(() => false)) {
    await consentButton.click();
    await expect(page.getByText("My journey")).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("heading", { name: "Counselor access" })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole("button", { name: "Revoke counselor access" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Revoke counselor access" }).click();
  await expect(page.getByText(/Counselor access revoked/i)).toBeVisible({ timeout: 15_000 });
}

export async function uiAcknowledgeRestorationOnMarriageHub(page: Page, counselorLabel: string) {
  await page.goto("/marriage");
  const consentButton = page.getByRole("button", { name: /I understand — continue/i });
  if (await consentButton.isVisible().catch(() => false)) {
    await consentButton.click();
    await expect(page.getByText("My journey")).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("heading", { name: "Counselor access" })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText(new RegExp(`Proposed counselor:.*${counselorLabel}`, "i"))).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText(/does not share assessment answers/i)).toBeVisible();
  const body = await expectUiAssignmentPost(
    page,
    () => page.getByRole("button", { name: "Authorize counselor restoration" }).click(),
    "acknowledge restoration",
  );
  return body;
}
