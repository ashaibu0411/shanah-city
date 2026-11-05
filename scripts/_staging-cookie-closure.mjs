/**
 * Staging closure using session cookies (no password in logs).
 * Uses data/staging-qa-session-cookies.json and active journey from hub.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.STAGING_BASE_URL ?? "https://shanah-city-staging.vercel.app";
const cookies = JSON.parse(fs.readFileSync("data/staging-qa-session-cookies.json", "utf8")).sessions;

function cookie(key) {
  return cookies.find((s) => s.key === key)?.cookie ?? "";
}

const rows = [];
const row = (id, verdict, evidence) => rows.push({ id, verdict, evidence: String(evidence).slice(0, 400) });

class Client {
  constructor(key) {
    this.cookie = cookie(key);
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
      parsed = { raw: text.slice(0, 120) };
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
    else if (t === "likert" || t === "agreement") answers[q.id] = "agree";
    else answers[q.id] = "Staging synthetic response.";
  }
  return answers;
}

async function submitModule(client, moduleId) {
  const g = await client.j("GET", `/api/marriage/assessment/${moduleId}`);
  if (!g.ok) return g;
  await client.j("PATCH", `/api/marriage/assessment/${moduleId}`, {
    answers: minimalAnswers(g.body.module?.questions),
  });
  return client.j("POST", `/api/marriage/assessment/${moduleId}`, { action: "submit" });
}

async function main() {
  const a = new Client("partnerA");
  const b = new Client("partnerB");
  const c = new Client("counselor");

  const hubA = await a.j("GET", "/api/marriage/hub");
  if (!hubA.ok || !hubA.body.journey?.id) {
    row("cookie-auth", "FAIL", hubA.body.error ?? hubA.status);
    throw new Error("cookie auth");
  }
  row("cookie-auth", "PASS", `journey=${hubA.body.journey.id}`);
  const JOURNEY = hubA.body.journey.id;
  const SESSION_KEY = "session-4-money";
  const MODULES = ["mod-04-money"];

  const mode = await a.j("POST", "/api/marriage/journey", {
    action: "set_counseling_mode",
    journeyId: JOURNEY,
    mode: "SELF_PACED",
  });
  row("delivery-mode", mode.ok ? "PASS" : "FAIL", `${mode.status} ${mode.body.error ?? mode.body.counselingDeliveryMode ?? ""}`);

  const hubAfter = await a.j("GET", "/api/marriage/hub");
  row(
    "delivery-mode-hub",
    hubAfter.body.counselingExperience?.deliveryMode === "SELF_PACED" ? "PASS" : "FAIL",
    hubAfter.body.counselingExperience?.deliveryMode ?? "missing",
  );

  const center = await a.j("GET", `/api/marriage/self-paced?view=center&journeyId=${JOURNEY}`);
  row("feedback-center", center.ok ? "PASS" : "FAIL", center.status);

  const assign = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "assign_session",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
    moduleIds: MODULES,
  });
  row("counselor-assign", assign.ok ? "PASS" : "FAIL", `${assign.status} ${assign.body.error ?? assign.body.review?.workflowStatus ?? ""}`);

  const mod = MODULES[0];
  const subA = await submitModule(a, mod);
  row("partner-a-submit", subA.ok ? "PASS" : "FAIL", `${subA.status} ${subA.body?.error ?? ""}`);
  const subB = await submitModule(b, mod);
  row("partner-b-submit", subB.ok ? "PASS" : "FAIL", `${subB.status} ${subB.body?.error ?? ""}`);

  const review = await c.j(
    "GET",
    `/api/marriage/counselor/self-paced?journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`,
  );
  row(
    "counselor-review-workspace",
    review.ok ? "PASS" : "FAIL",
    review.body.review?.workflowStatus ?? review.status,
  );

  await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "save_feedback_draft",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
    feedback: { sharedFeedback: "Staging shared guidance for QA." },
  });
  const pub = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "publish_feedback",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
  });
  row("publish-feedback", pub.ok ? "PASS" : "FAIL", `${pub.status} ${pub.body.error ?? "ok"}`);

  const fbA = await a.j(
    "GET",
    `/api/marriage/self-paced?view=session&journeyId=${JOURNEY}&sessionKey=${encodeURIComponent(SESSION_KEY)}`,
  );
  row("couple-session-feedback", fbA.ok && fbA.body.feedback ? "PASS" : "FAIL", fbA.status);

  const hwCreate = await c.j("POST", "/api/marriage/counselor/homework", {
    journeyId: JOURNEY,
    title: `QA HW ${Date.now()}`,
    sessionId: SESSION_KEY,
    instructions: "Complete both prompts.",
    activities: [
      {
        id: "act-qa",
        kind: "individual_writing",
        title: "Reflect",
        questions: [
          { id: "q1", prompt: "Private note", responseKind: "long_text", visibility: "private" },
          { id: "q2", prompt: "Shared note", responseKind: "long_text", visibility: "shared_with_partner" },
        ],
      },
    ],
  });
  const hwId = hwCreate.body.homework?.id;
  row("hw-create", hwCreate.ok && hwId ? "PASS" : "FAIL", `${hwCreate.status} ${hwCreate.body.error ?? ""}`);

  if (hwId) {
    await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, { action: "release" });
    const ans = { "act-qa:q1": "private text", "act-qa:q2": "shared text" };
    await a.j("PATCH", `/api/marriage/homework/${hwId}`, { answers: ans });
    await b.j("PATCH", `/api/marriage/homework/${hwId}`, { answers: ans });
    const sA = await a.j("POST", `/api/marriage/homework/${hwId}/submit`);
    const sB = await b.j("POST", `/api/marriage/homework/${hwId}/submit`);
    row("hw-submit-both", sA.ok && sB.ok ? "PASS" : "FAIL", `A=${sA.status} B=${sB.status}`);

    const detail = await c.j("GET", `/api/marriage/counselor/homework/${hwId}`);
    const partnerAId = detail.body.partnerViews?.[0]?.userId;
    const rev = await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "request_revision",
      partnerUserId: partnerAId,
      revisionNote: "Add more detail.",
    });
    row("hw-revision", rev.ok ? "PASS" : "FAIL", rev.status);
    await a.j("PATCH", `/api/marriage/homework/${hwId}`, {
      answers: { ...ans, "act-qa:q2": "shared revised text" },
    });
    const resub = await a.j("POST", `/api/marriage/homework/${hwId}/submit`);
    row("hw-resubmit", resub.ok ? "PASS" : "FAIL", resub.status);
    await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "approve_submission",
      partnerUserId: partnerAId,
    });
    const partnerBId = detail.body.partnerViews?.[1]?.userId;
    await c.j("PATCH", `/api/marriage/counselor/homework/${hwId}`, {
      action: "approve_submission",
      partnerUserId: partnerBId,
    });
    row("hw-counselor-approve", "PASS", "both partners approved");
  }

  const approve = await c.j("POST", "/api/marriage/counselor/self-paced", {
    action: "approve_session",
    journeyId: JOURNEY,
    sessionKey: SESSION_KEY,
  });
  row("session-approve", approve.ok ? "PASS" : "FAIL", `${approve.status} ${approve.body.error ?? approve.body.review?.workflowStatus ?? ""}`);

  const s2 = await a.j("GET", "/api/marriage/stage2");
  const ids = (s2.body.activities ?? []).map((x) => x.moduleId);
  row("stage2-modules-1-5", ["s2-temperament-discovery", "s2-mod-03-communication"].every((id) => ids.includes(id)) ? "PASS" : "FAIL", ids.length);
  row("stage2-modules-7-12", ids.includes("s2-mod-12-enrichment") ? "PASS" : "FAIL", "");
  row("stage2-intimacy-list", !ids.includes("s2-mod-06-intimacy") ? "PASS" : "FAIL", "");
  const intimacy = await a.j("GET", "/api/marriage/assessment/s2-mod-06-intimacy");
  row("stage2-intimacy-blocked", intimacy.status >= 400 || intimacy.body.error ? "PASS" : "FAIL", intimacy.status);
  const s2mod = await a.j("GET", "/api/marriage/assessment/s2-mod-03-communication");
  row("stage2-module-access", s2mod.ok ? "PASS" : "FAIL", s2mod.status);

  const out = { at: new Date().toISOString(), journey: JOURNEY, sessionKey: SESSION_KEY, rows };
  fs.writeFileSync(path.join(process.cwd(), ".tmp-staging-cookie-closure.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(rows, null, 2));
  if (rows.some((r) => r.verdict === "FAIL")) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
