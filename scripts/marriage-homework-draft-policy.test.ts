import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const manager = readFileSync(
  join(root, "src/components/marriage/MarriageCounselorHomeworkManager.tsx"),
  "utf8",
);
assert.doesNotMatch(
  manager,
  /createFromTemplate\(initialTemplateKey\)/,
  "URL template param must not auto-create drafts",
);
assert.match(manager, /Create homework draft/, "explicit create draft button");

const homeworkPage = readFileSync(
  join(root, "src/app/marriage/counselor/journey/[journeyId]/homework/page.tsx"),
  "utf8",
);
assert.match(homeworkPage, /initialTemplateKey/, "template query may preselect");

const route = readFileSync(join(root, "src/app/api/marriage/counselor/homework/route.ts"), "utf8");
assert.match(route, /createSessionHomeworkDraft/, "draft creation stays POST-only");
assert.match(route, /getUserFromSession/, "counselor homework API requires session");

const server = readFileSync(join(root, "src/lib/marriage-homework-server.ts"), "utf8");
assert.match(server, /findDraftSessionHomeworkByTemplate/, "duplicate draft prevention");

console.log("marriage-homework-draft-policy.test.ts: OK");
