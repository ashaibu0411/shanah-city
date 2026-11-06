/**
 * Staging PR28 smoke checks (no secrets logged).
 */
import fs from "node:fs";

const BASE = process.env.STAGING_BASE_URL ?? "https://shanah-city-staging.vercel.app";
const cookie = JSON.parse(fs.readFileSync("data/staging-qa-session-cookies.json", "utf8")).sessions.find(
  (s) => s.key === "partnerA",
)?.cookie;

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { status: res.status, body };
}

const unauth = await fetch(`${BASE}/api/marriage/self-paced`);
const feedbackPage = await fetch(`${BASE}/marriage/feedback`);
const reviewPage = await fetch(`${BASE}/marriage/counselor/review/mj-test/session-1-foundations`);

const hub = await get("/api/marriage/hub");
const sp = await get("/api/marriage/self-paced?view=center");
const s2 = await get("/api/marriage/stage2");
const intimacy = await get("/api/marriage/assessment/s2-mod-06-intimacy");

const acts = s2.body.activities ?? [];
const moduleIds = acts.map((a) => a.moduleId);

console.log(
  JSON.stringify(
    {
      selfPacedUnauthStatus: unauth.status,
      feedbackPageStatus: feedbackPage.status,
      reviewPageStatus: reviewPage.status,
      hubHasCounselingExperience: Boolean(hub.body.counselingExperience),
      deliveryMode: hub.body.counselingExperience?.deliveryMode ?? null,
      selfPacedCenterStatus: sp.status,
      selfPacedSessionCount: sp.body.sessions?.length ?? 0,
      stage2Enabled: s2.body.enabled,
      hasModules1to5: [
        "s2-temperament-discovery",
        "s2-mod-02-family-background",
        "s2-mod-03-communication",
        "s2-mod-04-conflict-lab",
        "s2-financial-workshop",
      ].every((id) => moduleIds.includes(id)),
      hasModules7to12: [
        "s2-mod-07-faith-values",
        "s2-mod-08-roles",
        "s2-mod-09-parenting",
        "s2-mod-10-trust-digital",
        "s2-mod-11-life-vision",
        "s2-mod-12-enrichment",
      ].every((id) => moduleIds.includes(id)),
      intimacyBlocked: Boolean(intimacy.body.error) || !intimacy.body.module,
      intimacyInActivityList: moduleIds.includes("s2-mod-06-intimacy"),
    },
    null,
    2,
  ),
);
