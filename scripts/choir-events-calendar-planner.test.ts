import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const choirPanel = readFileSync(
  path.join(process.cwd(), "src/components/calendar/ChoirServiceSchedulePanel.tsx"),
  "utf8",
);
assert.match(choirPanel, /layout\?: GroupServiceScheduleLayout/);
assert.match(choirPanel, /worshipPlannerHrefForService/);
assert.match(choirPanel, /Open worship plan/);

const groupPanel = readFileSync(
  path.join(process.cwd(), "src/components/calendar/GroupCalendarPanel.tsx"),
  "utf8",
);

const worshipPlannerIndex = groupPanel.indexOf("Worship planner");
const upcomingIndex = groupPanel.indexOf('layout="upcoming"');
const calendarIndex = groupPanel.indexOf("<GroupEventsSection");
assert.ok(worshipPlannerIndex > -1 && upcomingIndex > worshipPlannerIndex, "upcoming after planner");
assert.ok(calendarIndex > worshipPlannerIndex && upcomingIndex > calendarIndex, "calendar before upcoming");

console.log("choir-events-calendar-planner.test.ts OK");
