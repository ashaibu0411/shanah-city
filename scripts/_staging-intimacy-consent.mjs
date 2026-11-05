/**
 * Staging Module 6 intimacy consent checks (API-only, no answer content logged).
 * Requires MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED=1 on staging and PR #29 code deployed.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.STAGING_BASE_URL ?? "https://shanah-city-staging.vercel.app";
const MOD = "s2-mod-06-intimacy";
const OPT = "m06-opt-in";
const cookies = JSON.parse(fs.readFileSync("data/staging-qa-session-cookies.json", "utf8")).sessions;
const rows = [];
const row = (id, verdict, evidence) => rows.push({ id, verdict, evidence: String(evidence).slice(0, 300) });

function cookie(key) {
  return cookies.find((s) => s.key === key)?.cookie ?? "";
}

class Client {
  constructor(key) {
    this.key = key;
    this.cookie = cookie(key);
  }
  async j(method, p, body) {
    const res = await fetch(`${BASE}${p}`, {
      method,
      headers: { "Content-Type": "application/json", cookie: this.cookie },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let parsed = {};
    try {
      parsed = await res.json();
    } catch {
      parsed = {};
    }
    return { status: res.status, ok: res.ok, body: parsed };
  }
}

async function main() {
  const a = new Client("partnerA");
  const b = new Client("partnerB");
  const c = new Client("counselor");

  const s2 = await a.j("GET", "/api/marriage/stage2");
  const ids = (s2.body.activities ?? []).map((x) => x.moduleId);
  row(
    "intimacy-listed-when-approved",
    ids.includes(MOD) ? "PASS" : "FAIL",
    `activities=${ids.length} hasIntimacy=${ids.includes(MOD)}`,
  );

  const other = await b.j("GET", "/api/marriage/assessment/s2-mod-03-communication");
  row("other-module-without-intimacy-consent", other.ok ? "PASS" : "FAIL", other.status);

  const aOptYes = await a.j("PATCH", `/api/marriage/assessment/${MOD}`, { answers: { [OPT]: "yes" } });
  row("partner-a-opt-in-yes", aOptYes.ok ? "PASS" : "FAIL", aOptYes.body.error ?? aOptYes.status);

  const aAfterYes = await a.j("GET", `/api/marriage/assessment/${MOD}`);
  const qCount = aAfterYes.body.module?.questions?.length ?? 0;
  row("partner-a-full-bank-after-yes", qCount > 1 ? "PASS" : "FAIL", `questions=${qCount}`);

  const bOptNo = await b.j("PATCH", `/api/marriage/assessment/${MOD}`, { answers: { [OPT]: "no" } });
  row("partner-b-opt-in-no", bOptNo.ok ? "PASS" : "FAIL", bOptNo.body.error ?? bOptNo.status);

  const bAfterNo = await b.j("GET", `/api/marriage/assessment/${MOD}`);
  const bQ = bAfterNo.body.module?.questions?.length ?? 0;
  row("partner-b-gated-after-no", bQ === 1 ? "PASS" : "FAIL", `questions=${bQ}`);

  const bypass = await b.j("PATCH", `/api/marriage/assessment/${MOD}`, {
    answers: { "m06-boundary-private": "should not persist" },
  });
  row("api-bypass-without-yes", !bypass.ok ? "PASS" : "FAIL", bypass.body.error ?? bypass.status);

  const bOtherAgain = await b.j("GET", "/api/marriage/stage2");
  row(
    "decline-does-not-block-stage2",
    bOtherAgain.ok && (bOtherAgain.body.activities?.length ?? 0) > 0 ? "PASS" : "FAIL",
    bOtherAgain.status,
  );

  await a.j("PATCH", `/api/marriage/assessment/${MOD}`, {
    answers: { "m06-boundary-private": "private staging note" },
  });
  const withdraw = await a.j("PATCH", `/api/marriage/assessment/${MOD}`, { answers: { [OPT]: "no" } });
  row("withdraw-clears-via-opt-no", withdraw.ok ? "PASS" : "FAIL", withdraw.body.error ?? "");
  const aWithdrawn = await a.j("GET", `/api/marriage/assessment/${MOD}`);
  const ansKeys = Object.keys(aWithdrawn.body.myResponse?.answers ?? {});
  row(
    "withdraw-sensitive-answers-hidden",
    !ansKeys.some((k) => k.startsWith("m06-") && k !== OPT) ? "PASS" : "FAIL",
    `keys=${ansKeys.length}`,
  );

  const submitNo = await b.j("POST", `/api/marriage/assessment/${MOD}`, { action: "submit" });
  row("submit-blocked-without-yes", !submitNo.ok ? "PASS" : "FAIL", submitNo.body.error ?? submitNo.status);

  const comparePrivate = await a.j("GET", `/api/marriage/comparison/${MOD}`);
  row(
    "compare-respects-privacy",
    comparePrivate.status === 400 || comparePrivate.body.error ? "PASS" : "FAIL",
    comparePrivate.body.error ?? comparePrivate.status,
  );

  const counselorView = await c.j("GET", `/api/marriage/counselor/journey/${aAfterYes.body.journeyId ?? "x"}`);
  row(
    "counselor-journey-loads",
    counselorView.status === 200 || counselorView.status === 404 ? "PASS" : "FAIL",
    counselorView.status,
  );

  const learnPage = await fetch(`${BASE}/marriage/learn`, { headers: { cookie: a.cookie } });
  row("mobile-learn-page", learnPage.ok ? "PASS" : "FAIL", learnPage.status);

  const modPage = await fetch(`${BASE}/marriage/module/${MOD}`, { headers: { cookie: b.cookie } });
  row("direct-url-declined-participant", modPage.ok ? "PASS" : "FAIL", modPage.status);

  fs.writeFileSync(
    path.join(process.cwd(), ".tmp-staging-intimacy-consent.json"),
    JSON.stringify({ at: new Date().toISOString(), rows }, null, 2),
  );
  console.log(JSON.stringify(rows, null, 2));
  if (rows.some((r) => r.verdict === "FAIL")) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
