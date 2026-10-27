/**
 * Staging Marriage Prep hub regression (authenticated + simulated failures).
 * Requires: data/staging-qa-session-cookies.json (local, not committed) OR STAGING_QA_ROUND1_PASSWORD.
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const BASE = "https://shanah-city-staging.vercel.app";

function savedSessionCookie(key: string): string | null {
  try {
    const file = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
      sessions?: { key: string; cookie: string }[];
    };
    const row = data.sessions?.find((s) => s.key === key);
    if (!row?.cookie) return null;
    return row.cookie.split("=")[1] ?? null;
  } catch {
    return null;
  }
}

async function applyPartnerCookie(context: import("@playwright/test").BrowserContext, key: "partnerA" | "partnerB") {
  const value = savedSessionCookie(key);
  if (!value) return false;
  await context.addCookies([
    {
      name: "shanah_session",
      value,
      domain: "shanah-city-staging.vercel.app",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
  return true;
}

async function assertSpinnerClears(page: import("@playwright/test").Page) {
  await page.waitForTimeout(2500);
  const loading = await page.getByText("Loading…", { exact: true }).isVisible().catch(() => false);
  expect(loading, "should not spin forever on Loading…").toBe(false);
}

test.describe("Marriage Prep hub regression", () => {
  test.use({
    baseURL: BASE,
    viewport: { width: 390, height: 844 },
  });

  test("1 — Partner A signed-in hub", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.goto("/marriage");
    await page.getByText("Before We Say").waitFor({ state: "visible", timeout: 45_000 });
    await assertSpinnerClears(page);
  });

  test("2 — Partner B signed-in hub", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerB")).toBe(true);
    await page.goto("/marriage");
    await page.getByText("Before We Say").waitFor({ state: "visible", timeout: 45_000 });
    await assertSpinnerClears(page);
  });

  test("3 — Guest intro", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/marriage");
    await assertSpinnerClears(page);
    await expect(page.locator('a[href="/sign-in?next=/marriage"]')).toBeVisible();
    await expect(page.getByText("Before We Say")).toBeVisible();
  });

  test("4 — Simulated hub timeout", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.route("**/api/marriage/hub", async (route) => {
      await route.abort("timedout");
    });
    await page.goto("/marriage");
    await page.getByText("Could not load Marriage Prep").waitFor({ state: "visible", timeout: 30_000 });
    await assertSpinnerClears(page);
  });

  test("5 — Simulated hub HTTP 500 JSON", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.route("**/api/marriage/hub", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Server busy." }) }),
    );
    await page.goto("/marriage");
    await page.getByText("Could not load Marriage Prep").waitFor({ state: "visible", timeout: 20_000 });
    await expect(page.getByText("Server busy.")).toBeVisible();
    await assertSpinnerClears(page);
  });

  test("6 — Simulated non-JSON hub response", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.route("**/api/marriage/hub", (route) =>
      route.fulfill({ status: 502, contentType: "text/html", body: "<html><body>Bad Gateway</body></html>" }),
    );
    await page.goto("/marriage");
    await page.getByText("Could not load Marriage Prep").waitFor({ state: "visible", timeout: 20_000 });
    await assertSpinnerClears(page);
  });

  test("7 — Simulated network failure", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.route("**/api/marriage/hub", (route) => route.abort("failed"));
    await page.goto("/marriage");
    await page.getByText("Could not load Marriage Prep").waitFor({ state: "visible", timeout: 20_000 });
    await assertSpinnerClears(page);
  });

  test("8 — Retry after temporary failure", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    let fail = true;
    await page.route("**/api/marriage/hub", async (route) => {
      if (fail) {
        fail = false;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporary outage." }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto("/marriage");
    await page.getByText("Temporary outage.").waitFor({ state: "visible", timeout: 20_000 });
    await page.getByRole("button", { name: "Try again" }).click();
    await page.getByText("Before We Say").waitFor({ state: "visible", timeout: 45_000 });
  });

  test("9 — Session preserved after hub error (still signed in)", async ({ page, context }) => {
    expect(await applyPartnerCookie(context, "partnerA")).toBe(true);
    await page.route("**/api/marriage/hub", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Hub down." }) }),
    );
    await page.goto("/marriage");
    await page.getByText("Hub down.").waitFor({ state: "visible", timeout: 20_000 });
    const signInHeader = await page.getByRole("link", { name: "Sign In" }).isVisible().catch(() => false);
    expect(signInHeader, "signed-in member should not appear as guest after hub 503").toBe(false);
  });
});
