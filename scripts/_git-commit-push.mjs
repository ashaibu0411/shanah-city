import { execSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const log = join(root, ".tmp-git-push.log");
writeFileSync(log, "");

function run(cmd) {
  appendFileSync(log, `$ ${cmd}\n`);
  const out = execSync(cmd, { cwd: root, encoding: "utf8" });
  appendFileSync(log, out);
  return out;
}

try {
  run("git status -sb");
  run("git add docs/MARRIAGE_STAGE2_PASTORAL_REVIEW.md docs/MARRIAGE_PREP_MILESTONE_AUDIT.md package.json scripts src");
  run("git diff --cached --stat");
  const msg =
    "Complete marriage prep: homework unify, partner-join notify, workflow nav\\n\\nCouple and counselor homework lists merge legacy assignments safely. Partner-joined in-app notifications for invite and couple-link paths with dedupe. Onboarding CTAs, readiness notify, tests and audit docs.";
  run(`git commit -m "${msg}"`);
  run("git log -1 --format=%H");
  run("git push -u origin feature/marriage-prep-platform");
  appendFileSync(log, "DONE\n");
} catch (e) {
  appendFileSync(log, `\nERROR: ${e.message}\n${e.stdout ?? ""}${e.stderr ?? ""}`);
  process.exit(e.status ?? 1);
}
