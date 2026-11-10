const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(process.cwd(), ".env.production.local");
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

process.env.MEMBER_USER_ID = process.env.MEMBER_USER_ID ?? "user-1786578251521";
process.env.STRIPE_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID ?? "cus_VR8r4k73xPRJp5";
process.env.SINCE = process.env.SINCE ?? "2026-10-01";
process.env.UNTIL = process.env.UNTIL ?? "2026-10-31";

execSync("npx tsx scripts/giving-member-stripe-probe.ts", {
  stdio: "inherit",
  env: process.env,
});
