import { expect, type Page } from "@playwright/test";

/** Optional member session for community screenshot captures. */
export async function signInForCommunityScreenshots(page: Page) {
  const email = process.env.PLAYWRIGHT_COMMUNITY_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_COMMUNITY_PASSWORD;
  if (!email || !password) return false;

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const res = await page.request.post("/api/auth", {
    data: { action: "signin", email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return true;
}
