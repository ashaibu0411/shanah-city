import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const QA_TRACK = "qa-staging-shanah-instrumental-v1";

function resolveSessionCookie() {
  const fromEnv = process.env.STAGING_QA_SESSION_COOKIE?.trim();
  if (fromEnv) return fromEnv.includes("=") ? fromEnv : `shanah_session=${fromEnv}`;
  const cookiePath = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (!fs.existsSync(cookiePath)) return "";
  const parsed = JSON.parse(fs.readFileSync(cookiePath, "utf8")) as {
    sessions?: { key?: string; cookie?: string }[];
  };
  const entry = parsed.sessions?.find((s) => s.key === "partnerA") ?? parsed.sessions?.[0];
  const c = entry?.cookie?.trim() ?? "";
  return c.includes("=") ? c : c ? `shanah_session=${c}` : "";
}

function tinyJpeg() {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
    "base64",
  );
}

test.describe("Free Worship Music staging (browser)", () => {
  test("photo story streams authorized catalog audio", async ({ page, request, baseURL }) => {
    const cookieHeader = resolveSessionCookie();
    test.skip(!cookieHeader, "Refresh data/staging-qa-session-cookies.json");
    test.skip(!baseURL?.includes("staging"), "Set PLAYWRIGHT_BASE_URL to staging");

    const authHeaders = { Cookie: cookieHeader };
    const me = await request.get(`${baseURL}/api/auth`, { headers: authHeaders });
    if (me.status() === 401) test.skip(true, "QA session expired");

    const imgUp = await request.post(`${baseURL}/api/community/media`, {
      headers: authHeaders,
      multipart: {
        file: {
          name: `story-photo-e2e-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          buffer: tinyJpeg(),
        },
      },
    });
    expect(imgUp.status(), await imgUp.text()).toBe(200);
    const { mediaUrl } = (await imgUp.json()) as { mediaUrl: string };

    const pub = await request.post(`${baseURL}/api/community/statuses`, {
      headers: { ...authHeaders, "Content-Type": "application/json" },
      data: {
        caption: "[e2e free worship qa]",
        mediaType: "image",
        mediaUrl,
        storyKind: "story",
        musicTrackId: QA_TRACK,
      },
    });
    expect(pub.status(), await pub.text()).toBe(201);

    const pb = await request.get(
      `${baseURL}/api/community/story-music/playback?trackId=${encodeURIComponent(QA_TRACK)}`,
    );
    const plan = (await pb.json()) as { mode?: string; audioUrl?: string };
    expect(plan.mode).toBe("audio");

    await page.context().addCookies([
      {
        name: "shanah_session",
        value: cookieHeader.replace(/^shanah_session=/, ""),
        domain: new URL(baseURL!).hostname,
        path: "/",
        sameSite: "Lax",
      },
    ]);

    await page.goto(`${baseURL}/community`, { waitUntil: "domcontentloaded" });

    const soundBtn = page.getByRole("button", { name: /sound|mute/i }).first();
    if (await soundBtn.isVisible().catch(() => false)) await soundBtn.click();

    const img = page.locator(".community-story-viewer img, .community-story-slide img").first();
    await expect(img).toBeVisible({ timeout: 15000 });

    const audioOk = await page.evaluate(async (streamUrl) => {
      const audio = document.createElement("audio");
      audio.src = streamUrl;
      return new Promise<{ ok: boolean }>((resolve) => {
        const t = window.setTimeout(() => resolve({ ok: false }), 12000);
        audio.addEventListener("canplay", () => {
          window.clearTimeout(t);
          resolve({ ok: true });
        });
        audio.addEventListener("error", () => {
          window.clearTimeout(t);
          resolve({ ok: false });
        });
        audio.load();
      });
    }, plan.audioUrl!);

    expect(audioOk.ok).toBeTruthy();
  });
});
