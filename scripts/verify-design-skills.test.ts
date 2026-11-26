import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const skills = [
  "shanah-design-system",
  "frontend-design",
  "apple-design",
  "transitions-dev",
  "impeccable",
  "ui-ux-pro-max",
  "design-references",
];

for (const name of skills) {
  const skillPath = join(root, ".cursor", "skills", name, "SKILL.md");
  assert.ok(existsSync(skillPath), `missing ${skillPath}`);
  const raw = readFileSync(skillPath, "utf8");
  assert.match(raw, /^---\r?\nname: /, `${name} must have YAML frontmatter`);
  assert.match(raw, /description:/, `${name} must have description`);
}

const hooksPath = join(root, ".cursor", "hooks.json");
assert.ok(!existsSync(hooksPath), "hooks.json must not be committed (Impeccable hooks disabled)");

const uiproData = join(
  root,
  ".cursor",
  "skills",
  "ui-ux-pro-max",
  "data",
  "ui-reasoning.csv",
);
assert.ok(existsSync(uiproData), "ui-ux-pro-max design research data must be present");

const impeccableRef = join(
  root,
  ".cursor",
  "skills",
  "impeccable",
  "reference",
  "critique.md",
);
assert.ok(existsSync(impeccableRef), "impeccable full reference tree must be present");

const transitionsRef = join(
  root,
  ".cursor",
  "skills",
  "transitions-dev",
  "06-modal.md",
);
assert.ok(existsSync(transitionsRef), "transitions-dev reference snippets must be present");

const polishPath = join(root, ".cursor", "skills", "transitions-polish", "SKILL.md");
assert.ok(existsSync(polishPath), "transitions-polish companion skill should be present");

const lockPath = join(root, "skills-lock.json");
assert.ok(existsSync(lockPath), "skills-lock.json should record transitions.dev provenance");

const canonical = readFileSync(
  join(root, ".cursor", "skills", "shanah-design-system", "SKILL.md"),
  "utf8",
);
assert.match(canonical, /wins over/, "canonical skill must declare precedence");

for (const dep of ["impeccable", "ui-ux-pro-max", "transitions-dev"] as const) {
  const body = readFileSync(
    join(root, ".cursor", "skills", dep, "SKILL.md"),
    "utf8",
  );
  assert.match(body, /shanah-design-system/, `${dep} must defer to shanah-design-system`);
}

const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
assert.match(agents, /shanah-design-system/, "AGENTS.md must reference canonical skill");
assert.match(agents, /Design quality/, "AGENTS.md must preserve design quality section");

console.log("Design skills verification passed.", skills.length, "core skills");