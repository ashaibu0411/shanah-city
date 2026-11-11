import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  coerceWorshipServiceTime,
  pickWorshipPlanForServiceDate,
  worshipAutoOpenHrefForDate,
  worshipPlansOnDate,
  worshipPlannerHrefForService,
} from "../src/lib/worship-plan-event-resolve";
import {
  coalesceWorshipRotationConfig,
  normalizeWorshipRotationIndex,
  type WorshipServicePlan,
} from "../src/lib/worship-types";

assert.equal(coerceWorshipServiceTime("10:00"), "10:00");
assert.equal(coerceWorshipServiceTime("10:00 AM"), "10:00");
assert.equal(coerceWorshipServiceTime("11:30 AM"), "11:30");
assert.equal(coerceWorshipServiceTime(undefined), "10:00");

assert.equal(normalizeWorshipRotationIndex(undefined), 0);
assert.equal(normalizeWorshipRotationIndex("3"), 3);
assert.equal(normalizeWorshipRotationIndex(Number.NaN), 0);
assert.equal(
  coalesceWorshipRotationConfig({ id: "default", rotationIndex: undefined } as never).rotationIndex,
  0,
);

const plans = [
  {
    serviceDate: "2026-03-08",
    serviceTime: "10:00",
    status: "published",
    songs: [{ id: "a", title: "A" }],
    team: [],
  },
  {
    serviceDate: "2026-03-08",
    serviceTime: "11:30",
    status: "draft",
    songs: [{ id: "b", title: "B" }],
    team: [],
  },
] as WorshipServicePlan[];

assert.equal(
  pickWorshipPlanForServiceDate(plans, "2026-03-08", { eventTimeLabel: "11:30 AM" })?.serviceTime,
  "11:30",
);
assert.equal(
  pickWorshipPlanForServiceDate(plans, "2026-03-08", { preferPublished: true })?.serviceTime,
  "10:00",
);
assert.equal(pickWorshipPlanForServiceDate(plans, "2026-03-08", { preferPublished: false })?.songs[0]?.id, "a");

assert.equal(
  worshipPlannerHrefForService("2026-03-08", plans, {
    eventTimeLabel: "11:30 AM",
    canManagePlan: true,
  }),
  "/worship?date=2026-03-08&time=11%3A30",
);
assert.equal(
  worshipPlannerHrefForService("2026-03-08", plans, {
    canManagePlan: false,
    preferPublished: true,
  }),
  "/worship?date=2026-03-08&time=10%3A00",
);
assert.equal(
  worshipPlannerHrefForService("2026-12-01", plans, { canManagePlan: true }),
  "/worship?date=2026-12-01&time=10%3A00",
);

assert.equal(worshipPlansOnDate(plans, "2026-03-08").length, 2);
assert.equal(worshipPlansOnDate(plans, "2026-01-01").length, 0);
assert.equal(
  worshipAutoOpenHrefForDate(plans, "2026-03-08", true),
  null,
);
assert.equal(
  worshipAutoOpenHrefForDate(
    [{ serviceDate: "2026-04-01", serviceTime: "10:00", status: "published", songs: [], team: [] }] as WorshipServicePlan[],
    "2026-04-01",
    false,
  ),
  "/worship/service?date=2026-04-01&time=10%3A00",
);
assert.equal(
  worshipAutoOpenHrefForDate(
    [{ serviceDate: "2026-04-01", serviceTime: "10:00", status: "published", songs: [], team: [] }] as WorshipServicePlan[],
    "2026-04-01",
    true,
  ),
  "/worship?date=2026-04-01&time=10%3A00",
);

const panelSource = readFileSync(
  path.join(process.cwd(), "src/components/worship/WorshipPlannerPanel.tsx"),
  "utf8",
);
assert.match(panelSource, /useSearchParams/);
assert.match(panelSource, /syncWorshipPlannerUrl/);
assert.match(panelSource, /urlDate/);

const eventsServer = readFileSync(
  path.join(process.cwd(), "src/lib/choir-events-server.ts"),
  "utf8",
);
assert.match(eventsServer, /pickWorshipPlanForServiceDate/);
assert.doesNotMatch(eventsServer, /plan\.title\?\.trim\(\)\.toLowerCase\(\) === event\.title/);

const cardSource = readFileSync(
  path.join(process.cwd(), "src/components/groups/choir/events/WorshipEventCard.tsx"),
  "utf8",
);
assert.match(cardSource, /worshipPlanHref/);
assert.match(cardSource, /worshipEventPrimaryHref/);

const groupCalendarPanel = readFileSync(
  path.join(process.cwd(), "src/components/calendar/GroupCalendarPanel.tsx"),
  "utf8",
);
assert.match(groupCalendarPanel, /Worship planner/);
assert.match(groupCalendarPanel, /layout=\{choirScheduleSplit \? "editor" : "full"\}/);
assert.match(groupCalendarPanel, /layout="upcoming"/);
assert.match(groupCalendarPanel, /linkWorshipPlanner/);

const calendarMonth = readFileSync(
  path.join(process.cwd(), "src/components/calendar/CalendarMonthView.tsx"),
  "utf8",
);
assert.match(calendarMonth, /worshipAutoOpenHrefForDate/);
assert.match(calendarMonth, /WorshipPlanDayPicker/);

console.log("worship-planner-deep-link.test.ts OK");
