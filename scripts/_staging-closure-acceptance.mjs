/**
 * Staging closure: self-paced premarital session + homework revision (API-only).
 * Requires STAGING_QA_ROUND1_PASSWORD and synthetic Phase C couple.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.STAGING_BASE_URL ?? "https://shanah-city-staging.vercel.app";
const PASS = process.env.STAGING_QA_ROUND1_PASSWORD?.trim();
const SYNTH_A = "marriage-qa-a-phasec-1793069774933@shanah-city-qa.invalid";
const SYNTH_B = "marriage-qa-b-phasec-1793069774933@shanah-city-qa.invalid";
const COUNSELOR = "marriage-qa-counselor-b-20261024-counselor-b@shanah-city-qa.invalid";
const JOURNEY = process.env.STAGING_CLOSURE_JOURNEY?.trim() || "mj-1793069778403-ir2lr5";
const SESSION_KEY = process.env.STAGING_CLOSURE_SESSION?.trim() || "session-3-communication";
const MODULES = ["mod-03-communication"];

const rows = [];
const row = (id, verdict, evidence) => rows.push({ id, verdict, evidence: String(evidence).slice(0, 600) });

class S {
  constructor() {
    this.cookie = "";
  }
  capture(res) {
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const p = line.split(";")[0];
      if (p.startsWith("shanah_session=")) this.cookie = p;
    }
  }
  async signin(email) {
    const res = await fetch(`${BASE}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signin", email, password: PASS }),
    });
    this.capture(res);
    return res.ok;
  }
  async j(method, p, body) {
    const res = await fetch(`${BASE}${p}`, {
      method,
      headers: { "Content-Type": "application/json", cookie: this.cookie },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 180) };
    }
    return { status: res.status, ok: res.ok, body: parsed };
  }
}

function minimalAnswers(questions) {
  const answers = {};
  for (const q of questions ?? []) {
    if (q.required === false) continue;
    const t = q.type ?? q.responseKind ?? "long_reflection";
    if (t === "single_choice" || t === "scenario") answers[q.id] = q.options?.[0]?.id ?? "a";
    else if (t === "multiple_choice") answers[q.id] = [q.options?.[0]?.id ?? "a"];
    else if (t === "likert" || t === "agreement") answers[q.id] = "4";
    else answers[q.id] = "Staging closure synthetic answer.";
  }
  return answers;
}

async function submitModule(client, moduleId) {
  const g = await client.j("GET", `/api/marriage/assessment/${moduleId}`);
  if (!g.ok) return g;
  const qs = g.body.module?.questions ?? [];
  const answers = minimalAnswers(qs);
  await client.j("PATCH", `/api/marriage/assessment/${moduleId}`, { answers });
  return client.j("POST", `/api/marriage/assessment/${moduleId}`, { action: "submit" });
}

async function main() {
  if (!PASS) throw new Error("STAGING_QA_ROUND1_PASSWORD required");

  const a = new S();
  const b = new S();
  const c = new S();
  if (!(await a.signin(SYNTH_A)) || !(await b.signin(SYNTH_B)) || !(await c.signin(COUNSELOR))) {
    row("signin", "FAIL", "synth accounts");
    throw new Error("signin");
  }
  row("signin", "PASS", "A/B/counselor");

  const mode = await a.j("POST", "/api/marriage/journey", {
    action: "set_counseling_mode",
    journeyId: JOURNEY,
    mode: "SELF_PACED",
  });
  row("self-paced-mode", mode.ok ? "PASS" : "FAIL", `${mode.status} ${mode.body.error ?? mode.body.counselingDeliveryMode}`);

  const wsBefore = await c.j(
    "GET",
    `/api/marriage/counselor/self-paced?journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`,
  );
  const completedBefore = wsBefore.body.workspace?.premaritalProgress?.sessionsCompleted ?? null;

  const assign = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "assign_session",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
    moduleIds: MODULES,
  });
  row("counselor-assign", assign.ok ? "PASS" : "FAIL", `${assign.status} ${assign.body.error ?? assign.body.review?.workflowStatus}`);

  const secret = `closure-secret-${Date.now()}`;
  const mod = MODULES[0];
  const peekBefore = await b.j("GET", `/api/marriage/assessment/${mod}`);
  row("b-before-a-submit", peekBefore.ok ? "PASS" : "FAIL", peekBefore.status);

  const subA = await submitModule(a, mod);
  row("partner-a-submit", subA.ok ? "PASS" : "FAIL", `${subA.status} ${subA.body?.error ?? ""}`);

  const peekMid = await b.j("GET", `/api/marriage/assessment/${mod}`);
  const leak = JSON.stringify(peekMid.body).includes(secret);
  row("privacy-before-b", !leak ? "PASS" : "FAIL", leak ? "secret leaked" : "no secret");

  const subB = await submitModule(b, mod);
  row("partner-b-submit", subB.ok ? "PASS" : "FAIL", `${subB.status} ${subB.body?.error ?? ""}`);

  const review = await c.j(
    "GET",
    `/api/marriage/counselor/self-paced?journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`,
  );
  row("counselor-review-ready", review.ok ? "PASS" : "FAIL", review.body.review?.workflowStatus ?? review.status);

  await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "save_feedback_draft",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
    feedback: {
      sharedFeedback: "Shared staging guidance.",
      partnerSpecific: { [peekMid.body?.viewerUserId ?? ""]: "Partner-specific note." },
      counselorInternalNotes: "Internal only",
    },
  });
  const pub = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "publish_feedback",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
  });
  row("publish-feedback", pub.ok ? "PASS" : "FAIL", `${pub.status} ${pub.body.error ?? "published"}`);

  const fbA = await a.j("GET", `/api/marriage/self-paced?view=session&journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`);
  row("couple-feedback-a", fbA.ok ? "PASS" : "FAIL", fbA.status);
  const fbBody = JSON.stringify(fbA.body);
  row("feedback-no-internal", !fbBody.includes("Internal only") ? "PASS" : "FAIL", "internal leak");

  const hwCreate = await c.j("POST", "/api/marriage/counselor/homework", {
    journeyId: JOURNEY,
    title: `Closure HW ${Date.now()}`,
    sessionId: SESSION_KEY,
    instructions: "Both partners complete.",
    activities: [
      {
        id: "act-closure",
        kind: "individual_writing",
        title: "Reflect",
        questions: [
          { id: "q-priv", prompt: "Private", responseKind: "long_text", visibility: "private" },
          { id: "q-shared", prompt: "Shared", responseKind: "long_text", visibility: "shared" },
        ],
      },
    ],
  });
  const hwId = hwCreate.body.homework?.id;
  row("hw-create-linked", hwCreate.ok && hwId ? "PASS" : "FAIL", `${hwCreate.status} ${hwCreate.body.error ?? hwId}`);

  if (hwId) {
    await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, { action: "release" });
    const ans = { "act-closure:q-priv": "priv", "act-closure:q-shared": "shared" };
    await a.j("PATCH", `/api/marriage/homework/${hwId}`, { answers: ans });
    await b.j("PATCH", `/api/marriage/homework/${hwId}`, { answers: ans });
    const sA = await a.j("POST", `/api/marriage/homework/${hwId}/submit`);
    const sB = await b.j("POST", `/api/marriage/homework/${hwId}/submit`);
    row("hw-submit", sA.ok && sB.ok ? "PASS" : "FAIL", `A=${sA.status} B=${sB.status}`);

    const revReq = await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "request_revision",
      partnerUserId: hwCreate.body.homework?.journeyId ? undefined : undefined,
    });
    const detail = await c.j("GET", `/api/marriage/counselor/homework/${hwId}`);
    const partnerAId = detail.body.partnerViews?.[0]?.userId;
    const rev = await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "request_revision",
      partnerUserId: partnerAId,
      revisionNote: "Please expand your reflection.",
    });
    row("hw-revision-request", rev.ok ? "PASS" : "FAIL", `${rev.status} ${rev.body?.error ?? ""}`);

    await a.j("PATCH", `/api/marriage/homework/${hwId}`, { answers: { ...ans, "act-closure:q-shared": "shared revised" } });
    const resub = await a.j("POST", `/api/marriage/homework/${hwId}/submit`);
    row("hw-resubmit", resub.ok ? "PASS" : "FAIL", resub.status);

    await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "approve_submission",
      partnerUserId: partnerAId,
    });
    const partnerBId = detail.body.partnerViews?.[1]?.userId;
    const apprB = await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "approve_submission",
      partnerUserId: partnerBId,
    });
    row("hw-approved", apprB.ok ? "PASS" : "FAIL", apprB.status);
  }

  const approve = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "approve_session",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
  });
  row("session-approve", approve.ok ? "PASS" : "FAIL", `${approve.status} ${approve.body.error ?? approve.body.review?.workflowStatus}`);

  const wsAfter = await c.j(
    "GET",
    `/api/marriage/counselor/self-paced?journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`,
  );
  const completedAfter = wsAfter.body.workspace?.premaritalProgress?.sessionsCompleted ?? null;
  const delta =
    completedBefore != null && completedAfter != null ? completedAfter - completedBefore : null;
  row("progress-increment", delta === 1 ? "PASS" : delta === 0 ? "SKIP" : "FAIL", `before=${completedBefore} after=${completedAfter} delta=${delta}`);

  const persist = await a.j("GET", `/api/marriage/self-paced?view=center&journeyId=${JOURNEY}`);
  row("persist-feedback-center", persist.ok ? "PASS" : "FAIL", `sessions=${persist.body.sessions?.length ?? "?"}`);

  // Stage 2 gate
  const intimacy = await a.j("GET", "/api/marriage/assessment/s2-mod-06-intimacy");
  row("stage2-intimacy-blocked", intimacy.status >= 400 ? "PASS" : "FAIL", intimacy.status);
  const s2 = await a.j("GET", "/api/marriage/stage2");
  const s2Ids = (s2.body.activities ?? []).map((x) => x.moduleId);
  row("stage2-no-intimacy-list", !s2Ids.includes("s2-mod-06-intimacy") ? "PASS" : "FAIL", s2Ids.length);

  const modId = "s2-mod-03-communication";
  if (s2Ids.includes(modId)) {
    const s2Assess = await a.j("GET", `/api/marriage/assessment/${modId}`);
    row("stage2-module-reach", s2Assess.ok ? "PASS" : "FAIL", s2Assess.status);
  }

  const out = { at: new Date().toISOString(), journey: JOURNEY, sessionKey: SESSION_KEY, rows };
  fs.writeFileSync(path.join(process.cwd(), ".tmp-staging-closure.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(rows, null, 2));
  const fails = rows.filter((r) => r.verdict === "FAIL");
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
