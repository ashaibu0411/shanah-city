import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  coerceWorshipServiceTime,
  pickWorshipPlanForServiceDate,
} from "../src/lib/worship-plan-event-resolve";
import type { WorshipServicePlan } from "../src/lib/worship-types";

assert.equal(coerceWorshipServiceTime("10:00"), "10:00");
assert.equal(coerceWorshipServiceTime("10:00 AM"), "10:00");
assert.equal(coerceWorshipServiceTime("11:30 AM"), "11:30");
assert.equal(coerceWorshipServiceTime(undefined), "10:00");

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

console.log("worship-planner-deep-link.test.ts OK");
