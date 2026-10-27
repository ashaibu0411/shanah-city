/**
 * Staging-only Marriage Prep Phase C API probes (read-only).
 * Requires data/staging-qa-session-cookies.json (gitignored).
 *
 * Usage: node scripts/_staging-marriage-phasec-api.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.STAGING_BASE_URL ?? "https://shanah-city-staging.vercel.app";

function cookieHeader(key) {
  const file = path.join(process.cwd(), "data", "staging-qa-session-cookies.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const row = data.sessions?.find((s) => s.key === key);
  if (!row?.cookie) throw new Error(`Missing session key: ${key}`);
  return row.cookie;
}

async function getJson(pathname, key) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { cookie: cookieHeader(key) },
  });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

async function main() {
  const out = { base: BASE, at: new Date().toISOString(), probes: {} };

  out.probes.stage2PartnerA = await getJson("/api/marriage/stage2", "partnerA");
  out.probes.hubPartnerA = await getJson("/api/marriage/hub", "partnerA");
  out.probes.comparisonMod01 = await getJson(
    "/api/marriage/comparison/mod-01-knowing-yourself",
    "partnerA",
  );
  out.probes.assessmentIntimacy = await getJson(
    "/api/marriage/assessment/s2-mod-06-intimacy",
    "partnerA",
  );
  out.probes.comparisonStranger = await (async () => {
    try {
      return await getJson("/api/marriage/comparison/mod-01-knowing-yourself", "stranger");
    } catch (e) {
      return { error: String(e.message ?? e) };
    }
  })();

  const hub = out.probes.hubPartnerA.body;
  const modules = hub?.modules ?? [];
  out.summary = {
    stage2Enabled: out.probes.stage2PartnerA.body?.enabled ?? null,
    hubModuleCount: modules.length,
    hubModuleIds: modules.map((m) => m.moduleId ?? m.id),
    stage2ActivityIds: (out.probes.stage2PartnerA.body?.activities ?? []).map((a) => a.moduleId),
    intimacyInActivities: (out.probes.stage2PartnerA.body?.activities ?? []).some(
      (a) => a.moduleId === "s2-mod-06-intimacy",
    ),
    comparisonError:
      out.probes.comparisonMod01.status === 400
        ? out.probes.comparisonMod01.body?.error ?? out.probes.comparisonMod01.body
        : null,
  };

  const outFile = path.join(process.cwd(), ".tmp-staging-phasec-remediation-api.json");
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out.summary, null, 2));
  console.log(`Wrote ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
