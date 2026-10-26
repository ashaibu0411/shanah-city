import { execSync } from "node:child_process";
import { writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const log = join(root, ".tmp-marriage-verify.log");
writeFileSync(log, `verify started ${new Date().toISOString()}\n`);

const steps = [
  ["curriculum", "npm.cmd run test:marriage:curriculum"],
  ["couple-homework-hub", "npm.cmd run test:marriage:couple-homework-hub"],
  ["explicit-consent", "npm.cmd run test:marriage:explicit-consent"],
  ["homework-waiting-partner", "npm.cmd run test:marriage:homework-waiting-partner"],
  ["notifications", "npm.cmd run test:marriage:notifications"],
  ["hub-partner-gate", "npm.cmd run test:marriage:hub-partner-gate"],
  ["partner-notifications", "npm.cmd run test:marriage:partner-notifications"],
  ["counselor-homework-unified", "npm.cmd run test:marriage:counselor-homework-unified"],
  ["build", "npm.cmd run build"],
];

const summary = {};
for (const [name, cmd] of steps) {
  appendFileSync(log, `\n=== ${name} ===\n`);
  let code = 0;
  try {
    const out = execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    appendFileSync(log, out);
  } catch (e) {
    code = e.status ?? 1;
    appendFileSync(log, e.stdout ?? "");
    appendFileSync(log, e.stderr ?? "");
  }
  appendFileSync(log, `EXIT:${code}\n`);
  summary[name] = code;
}

appendFileSync(log, `\n=== SUMMARY ===\n${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
