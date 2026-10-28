import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function resolveSessionCookie() {
  const fromEnv = process.env.STAGING_QA_SESSION_COOKIE?.trim();
  if (fromEnv) return fromEnv.includes("=") ? fromEnv : `shanah_session=${fromEnv}`;
  const cookiePath = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (!fs.existsSync(cookiePath)) return "";
  const parsed = JSON.parse(fs.readFileSync(cookiePath, "utf8")) as {
    sessions?: { cookie?: string }[];
  };
  const entry = parsed.sessions?.find((s) => s.cookie?.includes("shanah_session="));
  return entry?.cookie?.trim() ?? "";
}

/** Minimal mono 8 kHz WAV (~0.25 s) for upload fixtures. */
function buildMinimalWav() {
  const sampleRate = 8000;
  const seconds = 0.25;
  const numSamples = Math.floor(sampleRate * seconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i += 1) {
    const sample = Math.sin((i / sampleRate) * Math.PI * 2 * 440) * 8000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }
  return buffer;
}

test.describe("Community story member voice (staging)", () => {
  test("publish fixture audio, reload feed, verify browser audio can load", async ({
    page,
    request,
    baseURL,
  }) => {
    const cookieHeader = resolveSessionCookie();
    test.skip(!cookieHeader, "Set STAGING_QA_SESSION_COOKIE or refresh data/staging-qa-session-cookies.json");

    const authHeaders = { Cookie: cookieHeader };

    const me = await request.get(`${baseURL}/api/auth`, { headers: authHeaders });
    if (me.status() === 401) {
      test.skip(true, "QA session cookie expired — sign in on staging and update the cookie file.");
    }

    let audioUrl = process.env.STORY_E2E_AUDIO_URL?.trim() ?? "";

    if (!audioUrl) {
    const wav = buildMinimalWav();
    const upload = await request.post(`${baseURL}/api/community/media`, {
      headers: authHeaders,
      multipart: {
        file: {
          name: `story-recording-e2e-${Date.now()}.wav`,
          mimeType: "audio/wav",
          buffer: wav,
        },
      },
    });
    const uploadText = await upload.text();
    if (!upload.ok()) {
      if (uploadText.includes("private store") || uploadText.includes("Blob")) {
        test.skip(true, "Staging Blob store cannot accept public community uploads in this environment.");
      }
    }
    expect(upload.status(), uploadText).toBe(200);
    const uploadBody = JSON.parse(uploadText) as { mediaUrl?: string; mediaType?: string };
    expect(uploadBody.mediaType).toBe("audio");
    expect(uploadBody.mediaUrl).toBeTruthy();

    const publish = await request.post(`${baseURL}/api/community/statuses`, {
      headers: { ...authHeaders, "Content-Type": "application/json" },
      data: {
        caption: "[e2e voice story]",
        mediaType: "text",
        memberStoryAudioUrl: uploadBody.mediaUrl,
        memberAudioRightsAck: true,
      },
    });
    expect(publish.status(), await publish.text()).toBe(201);
    const published = (await publish.json()) as { status?: { id?: string; memberStoryAudio?: { url?: string } } };
    const statusId = published.status?.id;
    const audioUrl = published.status?.memberStoryAudio?.url;
    expect(statusId).toBeTruthy();
    expect(audioUrl).toBeTruthy();

    const feed = await request.get(`${baseURL}/api/community/statuses`, { headers: authHeaders });
    expect(feed.ok()).toBeTruthy();
    const feedBody = (await feed.json()) as { statuses?: { id: string; memberStoryAudio?: { url?: string } }[] };
    const fromFeed = feedBody.statuses?.find((entry) => entry.id === statusId);
    expect(fromFeed?.memberStoryAudio?.url).toBe(audioUrl);

    const range = await request.get(audioUrl!, { headers: { Range: "bytes=0-1023" } });
    expect(range.status()).toBeGreaterThanOrEqual(200);
    expect(range.status()).toBeLessThan(300);

    await page.context().addCookies([
      {
        name: "shanah_session",
        value: cookieHeader.replace(/^shanah_session=/, ""),
        domain: new URL(baseURL!).hostname,
        path: "/",
      },
    ]);

    const playback = await page.evaluate(async (url) => {
      const audio = document.createElement("audio");
      audio.preload = "auto";
      const result = await new Promise<{ ok: boolean; duration: number; error: string }>((resolve) => {
        const timer = window.setTimeout(() => resolve({ ok: false, duration: 0, error: "timeout" }), 15000);
        audio.addEventListener(
          "loadedmetadata",
          () => {
            window.clearTimeout(timer);
            resolve({
              ok: Number.isFinite(audio.duration) && audio.duration > 0,
              duration: audio.duration,
              error: "",
            });
          },
          { once: true },
        );
        audio.addEventListener(
          "error",
          () => {
            window.clearTimeout(timer);
            resolve({ ok: false, duration: 0, error: "audio error" });
          },
          { once: true },
        );
        audio.src = url;
        audio.load();
      });
      return result;
    }, audioUrl!);

    expect(playback.ok, playback.error || `duration=${playback.duration}`).toBe(true);
  });
});
