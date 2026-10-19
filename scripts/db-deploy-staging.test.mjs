/**
 * db-deploy-staging.cjs wiring — no Prisma CLI or database connections.
 * Run: node scripts/db-deploy-staging.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const script = readFileSync(join(scriptsDir, "db-deploy-staging.cjs"), "utf8");

assert.match(
  script,
  /validateManualStagingMigrateDeploy\(process\.env\)/,
  "db-deploy-staging validates before prisma migrate deploy",
);

const validateIndex = script.indexOf("validateManualStagingMigrateDeploy(process.env)");
const migrateExecIndex = script.indexOf('execSync("npx prisma migrate deploy"');
assert.ok(
  validateIndex >= 0 && migrateExecIndex > validateIndex,
  "validation must appear before prisma migrate execSync in db-deploy-staging.cjs",
);

console.log("db-deploy-staging.test.mjs: OK");
