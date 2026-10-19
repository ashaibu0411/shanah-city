/**
 * build.cjs execution path — mocked subprocesses only (no Prisma, DB, or next build).
 * Run: node scripts/build-steps.test.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { executeBuildScript } = require("./build-steps.cjs");
const {
  STAGING_POOLED_HOST,
  STAGING_DIRECT_HOST,
  PRODUCTION_POOLED_HOST,
  PRODUCTION_DIRECT_HOST,
} = require("./build-migrate-guard.cjs");

const BLOCK =
  "build-steps.test.mjs must not invoke real subprocesses; use mockRun only.";

function url(host) {
  return `postgresql://neondb_owner:REDACTED@${host}/neondb?sslmode=require`;
}

function mockRun() {
  throw new Error(BLOCK);
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {{ failThrows?: boolean }} [options]
 */
function simulateBuild(env, options = {}) {
  const commands = [];
  let guardFailure = null;

  const outcome = executeBuildScript(env, {
    run(command, runEnv) {
      commands.push({ command, runEnv: runEnv ? { ...runEnv } : undefined });
    },
    failBuild(error) {
      guardFailure = error;
      if (options.failThrows) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });

  return { outcome, commands, guardFailure };
}

function commandNames(commands) {
  return commands.map((entry) => entry.command);
}

function assertNoPrisma(commands, label) {
  assert.equal(
    commands.some((entry) => entry.command.includes("prisma migrate deploy")),
    false,
    `${label}: prisma migrate deploy must not run`,
  );
}

function assertPrismaBeforeNext(commands, label) {
  const names = commandNames(commands);
  assert.deepEqual(
    names.filter((c) => c.includes("prisma migrate deploy")),
    ["npx prisma migrate deploy"],
    `${label}: exactly one migrate deploy`,
  );
  assert.equal(names.at(-1), "npx next build", `${label}: next build is last`);
  const migrateIndex = names.indexOf("npx prisma migrate deploy");
  const nextIndex = names.indexOf("npx next build");
  assert.ok(migrateIndex < nextIndex, `${label}: migrate runs before next build`);
}

// --- Preview: never migrate ---

for (const label of [
  "preview production URLs",
  "preview staging URLs",
  "preview malformed DATABASE_URL",
  "preview missing URLs",
]) {
  const previewEnv =
    label === "preview production URLs"
      ? {
          VERCEL: "1",
          VERCEL_ENV: "preview",
          VERCEL_PROJECT_NAME: "shanah-city",
          DATABASE_URL: url(PRODUCTION_POOLED_HOST),
          DIRECT_URL: url(PRODUCTION_DIRECT_HOST),
        }
      : label === "preview staging URLs"
        ? {
            VERCEL: "1",
            VERCEL_ENV: "preview",
            VERCEL_PROJECT_NAME: "shanah-city-staging",
            DATABASE_URL: url(STAGING_POOLED_HOST),
            DIRECT_URL: url(STAGING_DIRECT_HOST),
          }
        : label === "preview malformed DATABASE_URL"
          ? {
              VERCEL: "1",
              VERCEL_ENV: "preview",
              VERCEL_PROJECT_NAME: "shanah-city",
              DATABASE_URL: "not-a-url",
              DIRECT_URL: url(PRODUCTION_DIRECT_HOST),
            }
          : {
              VERCEL: "1",
              VERCEL_ENV: "preview",
              VERCEL_PROJECT_NAME: "shanah-city-staging",
            };

  const { outcome, commands } = simulateBuild(previewEnv);
  assert.equal(outcome.ok, true, label);
  assertNoPrisma(commands, label);
  assert.deepEqual(commandNames(commands), ["npx next build"], label);
}

// mockRun safety: orchestration must not call deps.run if we replaced — simulateBuild always uses recording run.
assert.throws(() => mockRun(), /must not invoke real subprocesses/);

// --- Production shanah-city: guard then migrate then next ---

const prodVercelEnv = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_NAME: "shanah-city",
  DATABASE_URL: url(PRODUCTION_POOLED_HOST),
  DIRECT_URL: url(PRODUCTION_DIRECT_HOST),
};

{
  const { outcome, commands, guardFailure } = simulateBuild(prodVercelEnv);
  assert.equal(outcome.ok, true);
  assert.equal(guardFailure, null);
  assertPrismaBeforeNext(commands, "production Vercel");
  const migrateEnv = commands[0].runEnv;
  assert.ok(migrateEnv, "production migrate passes explicit env");
  assert.equal(
    migrateEnv.DATABASE_URL,
    url(PRODUCTION_DIRECT_HOST),
    "production migrate uses direct URL in subprocess env",
  );
  assert.equal(
    migrateEnv.DIRECT_URL,
    url(PRODUCTION_DIRECT_HOST),
    "production DIRECT_URL preserved for prisma.config precedence",
  );
}

// --- Staging project production deployment: guard then migrate ---

const stagingProdEnv = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_NAME: "shanah-city-staging",
  DATABASE_URL: url(STAGING_POOLED_HOST),
  DIRECT_URL: url(STAGING_DIRECT_HOST),
};

{
  const { outcome, commands, guardFailure } = simulateBuild(stagingProdEnv);
  assert.equal(outcome.ok, true);
  assert.equal(guardFailure, null);
  assertPrismaBeforeNext(commands, "staging production Vercel");
}

// --- Invalid targets: fail before migrate and before next build ---

{
  const { outcome, commands, guardFailure } = simulateBuild({
    ...stagingProdEnv,
    DATABASE_URL: url(PRODUCTION_POOLED_HOST),
    DIRECT_URL: url(PRODUCTION_DIRECT_HOST),
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failedAt, "staging_guard");
  assert.ok(guardFailure instanceof Error);
  assert.match(guardFailure.message, /staging pooled host/);
  assert.deepEqual(commands, []);
}

{
  const { outcome, commands, guardFailure } = simulateBuild({
    ...prodVercelEnv,
    DATABASE_URL: url(STAGING_POOLED_HOST),
    DIRECT_URL: url(STAGING_DIRECT_HOST),
  });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failedAt, "production_guard");
  assert.ok(guardFailure instanceof Error);
  assert.match(guardFailure.message, /staging Neon endpoints are not allowed/);
  assert.deepEqual(commands, []);
}

// --- Local / non-Vercel: migrate when configured, no hostname guard ---

{
  const { outcome, commands } = simulateBuild({
    DATABASE_URL: url(PRODUCTION_POOLED_HOST),
    DIRECT_URL: url(PRODUCTION_DIRECT_HOST),
  });
  assert.equal(outcome.ok, true);
  assertPrismaBeforeNext(commands, "local with URLs");
}

{
  const { outcome, commands } = simulateBuild({});
  assert.equal(outcome.ok, true);
  assertNoPrisma(commands, "local without DATABASE_URL");
  assert.deepEqual(commandNames(commands), ["npx next build"]);
}

// --- build.cjs wiring: only delegates to executeBuildScript ---

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const buildCjs = readFileSync(join(scriptsDir, "build.cjs"), "utf8");
assert.match(buildCjs, /executeBuildScript\(/, "build.cjs uses shared orchestration");
assert.doesNotMatch(
  buildCjs,
  /enforceStagingMigrateGuardIfNeeded/,
  "build.cjs does not duplicate guard logic",
);
assert.doesNotMatch(buildCjs, /resolvePrismaMigrateDeployPlan/, "build.cjs does not duplicate migrate plan");
assert.doesNotMatch(
  buildCjs,
  /prisma migrate deploy/,
  "build.cjs must not embed prisma migrate deploy (orchestration lives in build-steps.cjs)",
);
assert.doesNotMatch(buildCjs, /npx next build/, "build.cjs must not embed next build command");

console.log("build-steps.test.mjs: OK");
