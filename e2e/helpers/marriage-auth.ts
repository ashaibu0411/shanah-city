import { expect, type APIRequestContext } from "@playwright/test";
import { E2E_USERS } from "./e2e-isolated-data";

export { E2E_USERS };

export async function signInRequest(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const res = await request.post("/api/auth", {
    data: { action: "signin", email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

export async function newAuthedRequest(
  playwright: { request: { newContext: (opts: { baseURL?: string }) => Promise<APIRequestContext> } },
  baseURL: string,
  who: keyof typeof E2E_USERS,
) {
  const user = E2E_USERS[who];
  const ctx = await playwright.request.newContext({ baseURL });
  await signInRequest(ctx, user.email, user.password);
  return ctx;
}

/** Sign in via API so session cookies apply to the same browser context (reliable on Chromium). */
export async function signInPage(page: import("@playwright/test").Page, who: keyof typeof E2E_USERS) {
  const user = E2E_USERS[who];
  const res = await page.request.post("/api/auth", {
    data: { action: "signin", email: user.email, password: user.password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}
