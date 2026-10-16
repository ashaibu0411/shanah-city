/**
 * Run migrations ONLY when explicitly targeting staging (never production by accident).
 *
 * 1. Copy .env.staging.example → .env.staging.local (gitignored)
 * 2. Put STAGING Neon DATABASE_URL and DIRECT_URL in .env.staging.local
 * 3. Set STAGING_DATABASE_CONFIRM=shanah-city-staging in that file
 * 4. npm.cmd run db:deploy:staging
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const localFile = path.join(process.cwd(), ".env.staging.local");
if (!fs.existsSync(localFile)) {
  console.error("Missing .env.staging.local — create it from .env.staging.example first.");
  process.exit(1);
}

for (const line of fs.readFileSync(localFile, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[k] = v;
}

if (process.env.STAGING_DATABASE_CONFIRM?.trim() !== "shanah-city-staging") {
  console.error(
    'Set STAGING_DATABASE_CONFIRM=shanah-city-staging in .env.staging.local before running migrations.',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL missing in .env.staging.local");
  process.exit(1);
}

console.log("Confirmed staging target flag. Running prisma migrate deploy (connection hidden)...");
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: process.env,
});
