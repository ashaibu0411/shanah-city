import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getServiceDateLabel, suggestAgeGroupFromBirthYear } from "../src/lib/kids-workspace-types";
assert.equal(suggestAgeGroupFromBirthYear("2019"), "Elementary (6-11)");
assert.match(getServiceDateLabel(new Date("2026-11-21T12:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);

const api = readFileSync("src/app/api/kids/ministry/route.ts", "utf8");
assert.match(api, /childSearch/);
assert.match(api, /assign-teacher/);
assert.match(api, /complete-lesson/);
assert.match(api, /mark-safeguarding-complete/);
assert.match(api, /teacher-checkin/);
assert.match(api, /familyMemberId/);

const panel = readFileSync("src/components/kids/KidsMinistryPanel.tsx", "utf8");
assert.match(panel, /KidsTeacherHomeTab/);
assert.match(panel, /KidsRegisteredChildPicker/);
assert.match(panel, /first letter of child's name/);

const schema = readFileSync("prisma/schema.prisma", "utf8");
assert.match(schema, /model KidsTeacherAssignment/);
assert.match(schema, /model KidsLessonCompletion/);

console.log("Kids Ministry workspace regression checks passed.");