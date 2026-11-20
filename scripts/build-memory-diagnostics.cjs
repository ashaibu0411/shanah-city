#!/usr/bin/env node
/**
 * Run a one-off Next.js build with official memory diagnostics.
 * Not part of the standard Vercel build pipeline or production migrations.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

if (process.env.VERCEL_ENV === "production") {
  console.error("Refusing diagnostic compilation in the production deployment pipeline.");
  process.exit(1);
}

console.log("[build-memory] Starting opt-in Next.js build memory diagnostics.");
console.log("[build-memory] Standard npm run build is unchanged.");
console.log("[build-memory] Keep any emitted heap snapshots private; they may contain app data.");
const nextCli = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build", "--experimental-debug-memory-usage"], {
  cwd: path.resolve(__dirname, ".."),
  env: { ...process.env, SHANAH_BUILD_MEMORY_DIAGNOSTICS: "1", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: "inherit",
});
if (result.error) console.error("[build-memory] Unable to start:", result.error.message);
process.exit(result.status ?? 1);
