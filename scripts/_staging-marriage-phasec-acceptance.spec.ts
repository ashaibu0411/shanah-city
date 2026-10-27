/**
 * Staging Phase C acceptance harness (partial automation).
 * Full eight-session operational campaign still requires fresh synthetic journey + counselor tooling.
 *
 * Requires: data/staging-qa-session-cookies.json
 * Run: npx playwright test -c playwright.staging.phasec.config.ts
 */
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const BASE = "https://shanah-city-staging.vercel.app";
const PREMARITAL_TRACK_MODULE_COUNT = 16;
const FULL_CURRICULUM_MODULE_COUNT = 20;

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

async function applyCookie(context: import("@playwright/test").BrowserContext, key: string) {
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

async function apiGet(context: import("@playwright/test").BrowserContext, pathname: string) {
  const res = await context.request.get(pathname);
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

test.describe("Phase C staging acceptance (API + hub)", () => {
  test.use({ baseURL: BASE, viewport: { width: 390, height: 844 } });

  test("premarital hub exposes program track module count", async ({ context }) => {
    expect(await applyCookie(context, "partnerA")).toBe(true);
    const { status, body } = await apiGet(context, "/api/marriage/hub");
    expect(status).toBe(200);
    expect(body.modules?.length).toBe(PREMARITAL_TRACK_MODULE_COUNT);
    expect(body.modules?.length).not.toBe(FULL_CURRICULUM_MODULE_COUNT);
  });

  test("Stage 2 dashboard must not list unapproved intimacy module", async ({ context }) => {
    expect(await applyCookie(context, "partnerA")).toBe(true);
    const { status, body } = await apiGet(context, "/api/marriage/stage2");
    expect(status).toBe(200);
    const ids = (body.activities ?? []).map((a: { moduleId: string }) => a.moduleId);
    expect(ids).not.toContain("s2-mod-06-intimacy");
    const sectionIds = (body.sections ?? []).flatMap(
      (s: { moduleIds?: string[] }) => s.moduleIds ?? [],
    );
    expect(sectionIds).not.toContain("s2-mod-06-intimacy");
  });

  test("intimacy assessment blocked when not pastorally approved", async ({ context }) => {
    expect(await applyCookie(context, "partnerA")).toBe(true);
    const res = await context.request.get("/api/marriage/assessment/s2-mod-06-intimacy");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("comparison returns validation error until both partners submit", async ({ context }) => {
    expect(await applyCookie(context, "partnerA")).toBe(true);
    const res = await context.request.get("/api/marriage/comparison/mod-01-knowing-yourself");
    expect(res.status()).toBe(400);
    const body = await res.json();
    const msg = String(body.error ?? body.message ?? "");
    expect(msg.length).toBeGreaterThan(0);
  });

  test("stranger cannot access counselor APIs", async ({ context }) => {
    expect(await applyCookie(context, "stranger")).toBe(true);
    const dashboard = await context.request.get("/api/marriage/counselor");
    expect(dashboard.status()).toBe(403);
    const detail = await context.request.get(
      "/api/marriage/counselor/journey/mj-1792881982047-oe7cmu",
    );
    expect(detail.status()).toBe(403);
  });

  test("eight-session premarital program structure on hub", async ({ context }) => {
    expect(await applyCookie(context, "partnerA")).toBe(true);
    const { body } = await apiGet(context, "/api/marriage/hub");
    expect(body.premaritalProgram?.sessions?.length).toBe(8);
  });
});

test.describe("Phase C — manual / blocked automation", () => {
  test.fixme("fresh invite + partner join (synthetic QA couple)", () => {});
  test.fixme("all 97 curriculum questions on staging UI", () => {});
  test.fixme("sessions 1–8 scheduling, attendance, homework, counselor review", () => {});
  test.fixme("counselor A/B isolation and reassignment", () => {});
  test.fixme("readiness rules + senior pastor approval + certificate immutability", () => {});
});
