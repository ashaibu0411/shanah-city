import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const QA_TRACK = "qa-staging-shanah-instrumental-v1";
const POC_TRACK = "poc-gh-adom-test";
const E2E_CAPTION_MUSIC = "[e2e free worship qa]";
const E2E_CAPTION_PLAIN = "[e2e free worship qa slide2]";

type CookieFile = {
  sessions?: { key?: string; email?: string; cookie?: string }[];
};

function loadCookieFile(): CookieFile | null {
  const cookiePath = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (!fs.existsSync(cookiePath)) return null;
  return JSON.parse(fs.readFileSync(cookiePath, "utf8")) as CookieFile;
}

function sessionCookieFromFile(parsed: CookieFile | null): string {
  const fromEnv = process.env.STAGING_QA_SESSION_COOKIE?.trim();
  if (fromEnv) return fromEnv.includes("=") ? fromEnv : `shanah_session=${fromEnv}`;
  const entry = parsed?.sessions?.find((s) => s.key === "partnerA") ?? parsed?.sessions?.[0];
  const c = entry?.cookie?.trim() ?? "";
  return c.includes("=") ? c : c ? `shanah_session=${c}` : "";
}

async function refreshStagingSession(
  request: import("@playwright/test").APIRequestContext,
  baseURL: string,
  parsed: CookieFile | null,
): Promise<string> {
  const pass = process.env.STAGING_QA_ROUND1_PASSWORD?.trim();
  const entry = parsed?.sessions?.find((s) => s.key === "partnerA");
  if (!pass || !entry?.email) return "";

  const res = await request.post(`${baseURL}/api/auth`, {
    data: { action: "signin", email: entry.email, password: pass },
  });
  const headers = res.headersArray();
  for (const h of headers) {
    if (h.name.toLowerCase() === "set-cookie" && h.value.startsWith("shanah_session=")) {
      return h.value.split(";")[0] ?? "";
    }
  }
  return "";
}

function tinyJpeg() {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
    "base64",
  );
}

async function storySlideIndexForUser(
  request: import("@playwright/test").APIRequestContext,
  baseURL: string,
  authHeaders: Record<string, string>,
  userId: string,
  statusId: string,
): Promise<number> {
  const feed = await request.get(`${baseURL}/api/community/statuses`, { headers: authHeaders });
  expect(feed.ok()).toBeTruthy();
  const body = (await feed.json()) as {
    statuses?: { id: string; authorId: string; createdAt: string }[];
  };
  const mine = (body.statuses ?? [])
    .filter((s) => s.authorId === userId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const idx = mine.findIndex((s) => s.id === statusId);
  expect(idx, `status ${statusId} missing from member feed`).toBeGreaterThanOrEqual(0);
  return idx;
}

async function uploadStoryImage(
  request: import("@playwright/test").APIRequestContext,
  baseURL: string,
  authHeaders: Record<string, string>,
) {
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
  return mediaUrl;
}

test.describe("Free Worship Music staging (browser)", () => {
  test.describe.configure({ mode: "serial" });

  test("photo story streams authorized catalog audio", async ({ page, request, baseURL }) => {
    test.setTimeout(120_000);
    const cookieFile = loadCookieFile();
    let cookieHeader = sessionCookieFromFile(cookieFile);
    test.skip(!cookieHeader, "Refresh data/staging-qa-session-cookies.json");
    test.skip(!baseURL?.includes("staging"), "Set PLAYWRIGHT_BASE_URL to staging");

    let authHeaders: Record<string, string> = { Cookie: cookieHeader };
    let me = await request.get(`${baseURL}/api/auth`, { headers: authHeaders });
    if (me.status() === 401) {
      const refreshed = await refreshStagingSession(request, baseURL!, cookieFile);
      test.skip(!refreshed, "QA session expired — set STAGING_QA_ROUND1_PASSWORD");
      cookieHeader = refreshed;
      authHeaders = { Cookie: cookieHeader };
      me = await request.get(`${baseURL}/api/auth`, { headers: authHeaders });
    }
    expect(me.ok()).toBeTruthy();
    const meBody = (await me.json()) as { user?: { id: string } };
    const userId = meBody.user?.id ?? "";
    expect(userId).toBeTruthy();

    const catalogRes = await request.get(`${baseURL}/api/community/story-music?q=&genre=all`, {
      headers: authHeaders,
    });
    expect(catalogRes.ok()).toBeTruthy();
    const catalog = (await catalogRes.json()) as {
      freeLibraryLive?: boolean;
      hybrid?: boolean;
      tracks?: { id: string }[];
    };
    expect(catalog.freeLibraryLive).toBe(true);
    const ids = (catalog.tracks ?? []).map((t) => t.id);
    expect(ids).toContain(QA_TRACK);
    expect(ids).not.toContain(POC_TRACK);

    const mediaUrl1 = await uploadStoryImage(request, baseURL!, authHeaders);
    const mediaUrl2 = await uploadStoryImage(request, baseURL!, authHeaders);

    const pub1 = await request.post(`${baseURL}/api/community/statuses`, {
      headers: { ...authHeaders, "Content-Type": "application/json" },
      data: {
        caption: E2E_CAPTION_MUSIC,
        mediaType: "image",
        mediaUrl: mediaUrl1,
        storyKind: "story",
        musicTrackId: QA_TRACK,
      },
    });
    expect(pub1.status(), await pub1.text()).toBe(201);
    const body1 = (await pub1.json()) as {
      status?: { id?: string; music?: { trackId?: string } };
    };
    expect(body1.status?.music?.trackId).toBe(QA_TRACK);
    const musicStatusId = body1.status?.id ?? "";
    expect(musicStatusId).toBeTruthy();

    const pub2 = await request.post(`${baseURL}/api/community/statuses`, {
      headers: { ...authHeaders, "Content-Type": "application/json" },
      data: {
        caption: E2E_CAPTION_PLAIN,
        mediaType: "image",
        mediaUrl: mediaUrl2,
        storyKind: "story",
      },
    });
    expect(pub2.status(), await pub2.text()).toBe(201);

    const pb = await request.get(
      `${baseURL}/api/community/story-music/playback?trackId=${encodeURIComponent(QA_TRACK)}`,
      { headers: authHeaders },
    );
    const plan = (await pb.json()) as { mode?: string; audioUrl?: string };
    expect(plan.mode).toBe("audio");
    expect(plan.audioUrl).toBeTruthy();

    await page.context().addCookies([
      {
        name: "shanah_session",
        value: cookieHeader.replace(/^shanah_session=/, ""),
        domain: new URL(baseURL!).hostname,
        path: "/",
        sameSite: "Lax",
      },
    ]);

    await page.goto(`${baseURL}/community`, { waitUntil: "networkidle" });

    const yourStory = page.getByRole("button", { name: "Your story" });
    await expect(yourStory).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".community-story-ring-unseen, .community-story-ring-seen")).toBeVisible({
      timeout: 20000,
    });

    const musicSlideIndex = await storySlideIndexForUser(
      request,
      baseURL!,
      authHeaders,
      userId,
      musicStatusId,
    );

    await yourStory.click();

    const viewer = page.locator(".community-story-viewer");
    await expect(viewer).toBeVisible({ timeout: 15000 });

    for (let i = 0; i < musicSlideIndex; i += 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(320);
    }

    const photo = page.locator(".community-story-viewer-photo");
    await expect(photo).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(E2E_CAPTION_MUSIC)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Staging QA Instrumental \(TEST ONLY\)/)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: /story background audio|Retry story music/i }),
    ).toBeVisible({ timeout: 15000 });

    const photoLayout = await page.evaluate(() => {
      const img = document.querySelector(".community-story-viewer-photo") as HTMLImageElement | null;
      const media = document.querySelector(".community-story-viewer-media");
      if (!img || !media) return null;
      const ir = img.getBoundingClientRect();
      const mr = media.getBoundingClientRect();
      const style = getComputedStyle(img);
      return {
        objectFit: style.objectFit,
        fillsMediaWidth: ir.width >= mr.width * 0.95,
        fillsMediaHeight: ir.height >= mr.height * 0.95,
      };
    });
    expect(photoLayout).not.toBeNull();
    expect(photoLayout!.objectFit).toBe("contain");
    expect(photoLayout!.fillsMediaWidth).toBeTruthy();
    expect(photoLayout!.fillsMediaHeight).toBeTruthy();

    const muteHeader = page.getByRole("button", { name: "Mute video" });
    await expect(muteHeader).toBeVisible({ timeout: 20000 });

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const audio = document.querySelector(".community-story-viewer audio") as HTMLAudioElement | null;
            if (!audio?.src) return "missing";
            return audio.paused ? "paused" : "playing";
          }),
        { timeout: 20000 },
      )
      .toBe("playing");

    await muteHeader.click();
    await expect(page.getByRole("button", { name: "Turn on sound" })).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const audio = document.querySelector(".community-story-viewer audio") as HTMLAudioElement | null;
          return audio?.paused ?? true;
        }),
      )
      .toBe(true);

    const musicSticker = page.getByRole("button", { name: /story background audio/i });
    await musicSticker.click();
    await expect(muteHeader).toBeVisible();
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const audio = document.querySelector(".community-story-viewer audio") as HTMLAudioElement | null;
            return Boolean(audio?.src && !audio.paused);
          }),
        { timeout: 15000 },
      )
      .toBe(true);

    const streamOk = await page.evaluate(async (streamUrl) => {
      const audio = document.createElement("audio");
      audio.src = streamUrl;
      return new Promise<boolean>((resolve) => {
        const t = window.setTimeout(() => resolve(false), 12000);
        audio.addEventListener("canplay", () => {
          window.clearTimeout(t);
          resolve(true);
        });
        audio.addEventListener("error", () => {
          window.clearTimeout(t);
          resolve(false);
        });
        audio.load();
      });
    }, plan.audioUrl!);
    expect(streamOk).toBeTruthy();

    const tapLayer = page.locator(".community-story-viewer-tap-layer");
    await expect(tapLayer).toBeVisible();
    const box = await tapLayer.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width * 0.85, box!.y + box!.height * 0.5);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const audio = document.querySelector(".community-story-viewer audio");
          return audio == null || (audio as HTMLAudioElement).paused;
        }),
      )
      .toBe(true);

    await expect(viewer).toBeVisible();
    await expect(photo).toBeVisible();

    await page.getByRole("button", { name: "Close stories" }).click();
    await expect(viewer).toBeHidden({ timeout: 10000 });
  });
});
