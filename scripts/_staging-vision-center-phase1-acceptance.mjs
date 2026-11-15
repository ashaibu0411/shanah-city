/**
 * Staging Vision Center Phase 1 API acceptance (staging project / PR preview).
 * Requires data/staging-qa-session-cookies.json when available.
 *
 * Usage:
 *   STAGING_BASE_URL=https://shanah-city-staging-git-...vercel.app node scripts/_staging-vision-center-phase1-acceptance.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";

const BASE =
  process.env.STAGING_BASE_URL ??
  "https://shanah-city-staging-git-feature-8f4b6e-zaqnombre-9816s-projects.vercel.app";

const ROLE_ACCOUNTS = {
  seniorPastor: {
    email: process.env.STAGING_VISION_PASTOR_EMAIL?.trim() ?? "afroconnect63@gmail.com",
    password: process.env.STAGING_VISION_PASTOR_PASSWORD?.trim() ?? process.env.STAGING_QA_ROUND1_PASSWORD?.trim(),
  },
  counselor: {
    email: process.env.STAGING_VISION_LEADER_EMAIL?.trim() ?? "afro.connect63@gmail.com",
    password: process.env.STAGING_VISION_LEADER_PASSWORD?.trim() ?? process.env.STAGING_QA_ROUND1_PASSWORD?.trim(),
  },
  stranger: {
    email: process.env.STAGING_VISION_STRANGER_EMAIL?.trim() ?? "ribonbishop@gmail.com",
    password: process.env.STAGING_VISION_STRANGER_PASSWORD?.trim() ?? process.env.STAGING_QA_ROUND1_PASSWORD?.trim(),
  },
};

function loadEnvFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(process.cwd(), ".env.staging.local"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

const sessionByKey = {};

/** Ephemeral staging-only sessions (Vision PR85 QA); not production secrets. */
const STAGING_QA_SESSIONS = {
  seniorPastor: "shanah_session=vision-pr85-staging-pastor",
  counselor: "shanah_session=vision-pr85-staging-leader",
  stranger: "shanah_session=vision-pr85-staging-stranger",
};

async function signIn(key) {
  const account = ROLE_ACCOUNTS[key];
  if (!account?.email || !account?.password) return null;
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signin", email: account.email, password: account.password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const line of setCookie) {
    const part = line.split(";")[0];
    if (part.startsWith("shanah_session=")) {
      sessionByKey[key] = part;
      return part;
    }
  }
  return null;
}

async function cookieHeader(key) {
  if (sessionByKey[key]) return sessionByKey[key];
  if (process.env.STAGING_VISION_USE_PR85_TOKENS === "1" && STAGING_QA_SESSIONS[key]) {
    sessionByKey[key] = STAGING_QA_SESSIONS[key];
    return sessionByKey[key];
  }
  const file = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const row = data.sessions?.find((s) => s.key === key);
    if (row?.cookie) {
      const c = row.cookie.includes("=") ? row.cookie : `shanah_session=${row.cookie}`;
      sessionByKey[key] = c;
      return c;
    }
  }
  const signedIn = await signIn(key);
  if (signedIn) return signedIn;
  if (STAGING_QA_SESSIONS[key]) {
    sessionByKey[key] = STAGING_QA_SESSIONS[key];
    return sessionByKey[key];
  }
  return null;
}

function protectionHeaders() {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  return bypass ? { "x-vercel-protection-bypass": bypass } : {};
}

async function api(method, pathname, key, body) {
  const headers = { "Content-Type": "application/json", ...protectionHeaders() };
  const cookie = await cookieHeader(key);
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

async function main() {
  const report = {
    base: BASE,
    at: new Date().toISOString(),
    migrationVerifiedSeparately: true,
    steps: {},
    regression: {},
    pass: true,
  };

  const pastorList = await api("GET", "/api/vision/plans", "seniorPastor");
  report.steps.seniorPastorList = { status: pastorList.status, isOwner: pastorList.json?.isOwner, planCount: pastorList.json?.plans?.length };
  if (pastorList.status !== 200) report.pass = false;

  if (pastorList.status === 200 && pastorList.json?.isOwner) {
    const init = await api("POST", "/api/vision/plans", "seniorPastor", { action: "initialize-2027" });
    report.steps.initialize2027 = init;

    const listAfter = await api("GET", "/api/vision/plans", "seniorPastor");
    const worship = (listAfter.json?.plans ?? []).find((p) => p.ministryKey === "worship");
    report.steps.worshipPlanId = worship?.id ?? null;

    if (worship?.id) {
      const strangerPlan = await api("GET", `/api/vision/plans?planId=${encodeURIComponent(worship.id)}`, "stranger");
      report.steps.strangerBlockedPlan = { status: strangerPlan.status, error: strangerPlan.json?.error };

      const leaderAuth = await api("GET", "/api/auth", "counselor");
      const leaderUserId = leaderAuth.json?.user?.id;
      const leaderKey = "counselor";

      if (leaderUserId) {
        const assign = await api("POST", "/api/vision/plans", "seniorPastor", {
          action: "assign",
          planId: worship.id,
          userId: leaderUserId,
          deadline: "2026-12-15",
        });
        report.steps.assignLeader = { status: assign.status, userId: leaderUserId, leaderKey };

        const leaderList = await api("GET", "/api/vision/plans", leaderKey);
        report.steps.leaderSeesAssigned = {
          status: leaderList.status,
          count: leaderList.json?.plans?.length,
          ministries: (leaderList.json?.plans ?? []).map((p) => p.ministryKey),
        };

        const crossMinistry = (listAfter.json?.plans ?? []).find((p) => p.ministryKey === "cares");
        if (crossMinistry?.id) {
          const cross = await api("GET", `/api/vision/plans?planId=${encodeURIComponent(crossMinistry.id)}`, leaderKey);
          report.steps.leaderBlockedOtherMinistry = { status: cross.status, error: cross.json?.error };
        }

        const ack = await api("PATCH", "/api/vision/plans", leaderKey, { action: "acknowledge", planId: worship.id });
        report.steps.acknowledge = ack;

        const comment = await api("POST", "/api/vision/plans", leaderKey, {
          action: "comment",
          planId: worship.id,
          body: "Staging QA: Worship staging question",
          kind: "idea",
          sectionKey: "branding",
          referenceUrl: "https://www.figma.com/file/staging-qa-placeholder",
        });
        report.steps.commentWithHttpsLink = { status: comment.status, commentId: comment.json?.comment?.id };

        const badLink = await api("POST", "/api/vision/plans", leaderKey, {
          action: "comment",
          planId: worship.id,
          body: "Should reject http link",
          kind: "idea",
          referenceUrl: "http://insecure.example/test",
        });
        report.steps.rejectInsecureReferenceUrl = { status: badLink.status, error: badLink.json?.error };

        const save = await api("PATCH", "/api/vision/plans", leaderKey, {
          action: "save-response",
          planId: worship.id,
          proposal: "Staging QA worship proposal for 2027 review.",
          capacity: "with_support",
          supportNeeds: "AV volunteer support",
        });
        const submit = await api("PATCH", "/api/vision/plans", leaderKey, {
          action: "submit",
          planId: worship.id,
          proposal: "Staging QA worship proposal for 2027 review.",
          capacity: "with_support",
          supportNeeds: "AV volunteer support",
        });
        report.steps.leaderSubmit = { save, submit };

        const detail = await api("GET", `/api/vision/plans?planId=${encodeURIComponent(worship.id)}`, "seniorPastor");
        const idea = (detail.json?.plan?.comments ?? []).find((c) => c.kind === "idea");
        if (idea?.id) {
          const decide = await api("PATCH", "/api/vision/plans", "seniorPastor", {
            action: "decide-comment",
            planId: worship.id,
            commentId: idea.id,
            decision: "accepted",
            note: "Staging acceptance",
          });
          report.steps.ideaDecision = decide;
        }

        report.steps.auditCount = detail.json?.plan?.audits?.length ?? null;

        const approve = await api("PATCH", "/api/vision/plans", "seniorPastor", {
          action: "approve",
          planId: worship.id,
        });
        report.steps.approve = { status: approve.status, planStatus: approve.json?.plan?.status };
      }
    }
  }

  const pageHtml = await fetch(`${BASE}/leadership/vision`, {
    headers: { cookie: (await cookieHeader("seniorPastor")) ?? "", ...protectionHeaders() },
  }).then((r) => r.text());
  report.steps.mobileLayoutHints = {
    hasViewport: pageHtml.includes('name="viewport"'),
    hasVisionCenterTitle: pageHtml.includes("2027 Vision Center"),
    hasMaxWidthLayout: pageHtml.includes("max-w-5xl"),
  };

  report.regression.groups = await api("GET", "/api/groups", "stranger");
  report.regression.commsCalendar = await api("GET", "/api/comms/calendar", "seniorPastor");
  report.regression.adminReports = await api("GET", "/api/admin/reports", "seniorPastor");
  report.regression.visionApiStranger = await api("GET", "/api/vision/plans", "stranger");

  if (report.steps.seniorPastorList?.status !== 200 || !report.steps.seniorPastorList?.isOwner) report.pass = false;
  if (report.steps.strangerBlockedPlan?.status !== 403) report.pass = false;
  if (report.steps.leaderBlockedOtherMinistry?.status !== 403) report.pass = false;
  if (report.regression.visionApiStranger?.status !== 200 || (report.regression.visionApiStranger.json?.plans?.length ?? 0) > 0) {
    report.pass = false;
  }

  const outFile = path.join(process.cwd(), "docs", "VISION_CENTER_STAGING_ACCEPTANCE_PR85.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pass: report.pass, base: BASE, outFile }, null, 2));
  console.log(JSON.stringify(report.steps, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});