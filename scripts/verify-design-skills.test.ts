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

const canonical = readFileSync(
  join(root, ".cursor", "skills", "shanah-design-system", "SKILL.md"),
  "utf8",
);
assert.match(canonical, /wins over/, "canonical skill must declare precedence");

const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
assert.match(agents, /shanah-design-system/, "AGENTS.md must reference canonical skill");

console.log("Design skills verification passed.", skills.length, "skills");