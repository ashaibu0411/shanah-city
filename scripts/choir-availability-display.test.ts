import assert from "node:assert/strict";
import { activeApprovedAvailability, denverTodayDateKey } from "../src/lib/unavailability-display";

const today = "2026-11-10";
const records = [
  { id: "past", status: "approved", startDate: "2026-10-19", endDate: "2026-10-25" },
  { id: "ending-yesterday", status: "approved", startDate: "2026-11-01", endDate: "2026-11-09" },
  { id: "ending-today", status: "approved", startDate: "2026-11-09", endDate: today },
  { id: "starts-today", status: "approved", startDate: today, endDate: "2026-11-14" },
  { id: "future", status: "approved", startDate: "2026-11-13", endDate: "2026-11-16" },
  { id: "future-pending", status: "pending", startDate: "2026-11-15", endDate: "2026-11-16" },
  { id: "future-rejected", status: "rejected", startDate: "2026-11-15", endDate: "2026-11-16" },
  { id: "malformed", status: "approved", startDate: "bad", endDate: "bad" },
];
assert.deepEqual(activeApprovedAvailability(records, today).map((x) => x.id), [
  "ending-today",
  "starts-today",
  "future",
]);
assert.deepEqual(activeApprovedAvailability([], today), []);
assert.equal(denverTodayDateKey(new Date("2026-11-11T06:30:00Z")), "2026-11-10");
assert.equal(denverTodayDateKey(new Date("2026-07-01T05:30:00Z")), "2026-06-30");
console.log("choir active availability display OK");
