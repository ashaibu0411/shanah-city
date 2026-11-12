/**
 * Seeds synthetic Community QA content via public APIs only.
 * Use against disposable local/staging — never production church data.
 * Prints PLAYWRIGHT_COMMUNITY_* env lines for the populated screenshot test.
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const base = (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3021").replace(/\/$/, "");
const ts = Date.now();
const password = `Qa!${randomBytes(18).toString("base64url")}9`;
const emailA = `premium-v4-qa-a-${ts}@shanah-city-qa.invalid`;
const emailB = `premium-v4-qa-b-${ts}@shanah-city-qa.invalid`;

// An explicit opt-in is required because localhost can still point to a shared
// staging/production DB through DATABASE_URL. Never run against the live site.
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const baseUrl = new URL(base);
if (!allowedHosts.has(baseUrl.hostname)) {
  throw new Error("Fixture seeding is local-only. Never run this script against a public/staging/production URL.");
}
if (process.env.PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED !== "YES") {
  throw new Error("Refusing fixture seed: first verify DATABASE_URL points to a disposable QA database, then set PREMIUM_V4_FIXTURE_TEST_DATABASE_CONFIRMED=YES.");
}

const jar = new Map();

function storeCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  const legacy = res.headers.get("set-cookie");
  const lines = [...raw, ...(legacy ? [legacy] : [])];
  for (const line of lines) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(method, pathName, body, multipart) {
  const headers = { cookie: cookieHeader() };
  let payload = body;
  if (multipart) {
    payload = body;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${pathName}`, { method, headers, body: payload });
  storeCookies(res);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${pathName} ${res.status}: ${text}`);
  }
  return json;
}

async function signup(name, email) {
  await api("POST", "/api/auth", {
    action: "signup",
    name,
    displayName: name,
    email,
    password,
    campusId: "colorado",
    participationType: "in_person",
  });
}

function localFixtureImageUrl() {
  const imageDir = path.join(process.cwd(), "public", "uploads", "community", "images");
  const preferred = fs
    .readdirSync(imageDir)
    .filter((name) => name.startsWith("qa-premium-v4-") && name.endsWith(".png") && name !== "qa-premium-v4-sample.png")
    .sort();
  const pick = preferred[0] ?? "qa-premium-v4-sample.png";
  const file = path.join(imageDir, pick);
  if (!fs.existsSync(file)) {
    throw new Error("Missing QA community image under public/uploads/community/images/");
  }
  return `/uploads/community/images/${pick}`;
}

async function main() {
  await signup("QA Member A", emailA);
  const mediaUrl = localFixtureImageUrl();
  const praisePost = await api("POST", "/api/community", {
    content: "Synthetic testimony — grateful for how God is moving in our church family.",
    type: "praise",
  });
  const postId = praisePost.post?.id;
  if (!postId) throw new Error("Fixture could not create praise post.");

  await api("POST", "/api/community", {
    content: "Worship night snapshot (synthetic QA asset).",
    type: "general",
    mediaItems: [{ url: mediaUrl, type: "image" }],
  });

  await signup("QA Member B", emailB);
  const withComment = await api("POST", "/api/community", {
    action: "comment",
    postId,
    content: "Synthetic QA comment — praying with you!",
  });
  const parentCommentId = withComment.post?.comments?.[0]?.id;
  if (parentCommentId) {
    await api("POST", "/api/community", {
      action: "reply",
      postId,
      parentCommentId,
      content: "Synthetic QA reply — amen!",
    });
  }

  await api("POST", "/api/community/statuses", {
    mediaType: "text",
    caption: "Synthetic QA story — celebrating community this week.",
  });
  await api("POST", "/api/community/statuses", {
    mediaType: "image",
    mediaUrl,
    caption: "Synthetic QA photo story.",
  });

  console.log(`PLAYWRIGHT_COMMUNITY_EMAIL=${emailA}`);
  console.log(`PLAYWRIGHT_COMMUNITY_PASSWORD=${password}`);
  console.log(`Fixture users: ${emailA}, ${emailB}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
