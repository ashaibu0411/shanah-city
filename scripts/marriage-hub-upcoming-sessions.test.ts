import assert from "node:assert/strict";
import { formatMarriageSessionScheduledAt } from "../src/lib/marriage-session-scheduling";
import {
  buildHubUpcomingSessionsFromRecords,
  HUB_UPCOMING_SESSIONS_LIMIT,
  pickHubNextSession,
  toHubUpcomingSessionView,
} from "../src/lib/marriage-hub-upcoming-sessions";
import type { MarriageCounselingSessionRecord } from "../src/lib/marriage-counseling-types";

function session(
  partial: Partial<MarriageCounselingSessionRecord> & Pick<MarriageCounselingSessionRecord, "id" | "scheduledAt">,
): MarriageCounselingSessionRecord {
  return {
    journeyId: partial.journeyId ?? "journey-a",
    createdBy: partial.createdBy ?? "counselor-1",
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    status: partial.status ?? "scheduled",
    ...partial,
  };
}

const nowMs = new Date("2026-10-22T12:00:00.000Z").getTime();

function main() {
  const empty = buildHubUpcomingSessionsFromRecords([], { nowMs });
  assert.deepEqual(empty, []);
  assert.equal(pickHubNextSession([], nowMs), null);

  const one = buildHubUpcomingSessionsFromRecords(
    [
      session({
        id: "s1",
        scheduledAt: "2026-10-31T01:00:00.000Z",
        schedulingTimeZone: "America/Denver",
        topic: "Communication",
        zoomUrl: "https://zoom.example/1",
      }),
    ],
    { nowMs },
  );
  assert.equal(one.length, 1);
  assert.equal(one[0].id, "s1");
  assert.equal(one[0].zoomUrl, "https://zoom.example/1");
  const nextOne = pickHubNextSession(
    [
      session({
        id: "s1",
        scheduledAt: "2026-10-31T01:00:00.000Z",
        schedulingTimeZone: "America/Denver",
      }),
    ],
    nowMs,
  );
  assert.equal(nextOne?.id, "s1");
  assert.equal(nextOne?.id, one[0].id);

  const multi = buildHubUpcomingSessionsFromRecords(
    [
      session({ id: "later", scheduledAt: "2026-11-07T02:00:00.000Z", topic: "Nov" }),
      session({ id: "earlier", scheduledAt: "2026-10-31T01:00:00.000Z", topic: "Oct" }),
    ],
    { nowMs },
  );
  assert.deepEqual(
    multi.map((s) => s.id),
    ["earlier", "later"],
  );
  assert.equal(pickHubNextSession(
    [
      session({ id: "later", scheduledAt: "2026-11-07T02:00:00.000Z" }),
      session({ id: "earlier", scheduledAt: "2026-10-31T01:00:00.000Z" }),
    ],
    nowMs,
  )?.id, "earlier");

  const filtered = buildHubUpcomingSessionsFromRecords(
    [
      session({ id: "past", scheduledAt: "2026-10-01T01:00:00.000Z" }),
      session({ id: "cancelled", scheduledAt: "2026-12-01T02:00:00.000Z", status: "cancelled" }),
      session({ id: "future", scheduledAt: "2026-11-07T02:00:00.000Z" }),
    ],
    { nowMs },
  );
  assert.deepEqual(filtered.map((s) => s.id), ["future"]);

  const many = buildHubUpcomingSessionsFromRecords(
    Array.from({ length: 7 }, (_, i) =>
      session({
        id: `s${i}`,
        scheduledAt: new Date(nowMs + (i + 1) * 86400000).toISOString(),
      }),
    ),
    { nowMs },
  );
  assert.equal(many.length, HUB_UPCOMING_SESSIONS_LIMIT);

  const journeyA = session({ id: "a1", journeyId: "journey-a", scheduledAt: "2026-11-07T02:00:00.000Z" });
  const journeyB = session({ id: "b1", journeyId: "journey-b", scheduledAt: "2026-11-08T02:00:00.000Z" });
  const onlyA = buildHubUpcomingSessionsFromRecords(
    [journeyA, journeyB].filter((s) => s.journeyId === "journey-a"),
    { nowMs },
  );
  assert.deepEqual(onlyA.map((s) => s.id), ["a1"]);

  const view = toHubUpcomingSessionView(
    session({
      id: "safe",
      scheduledAt: "2026-10-31T01:00:00.000Z",
      topic: "Topic",
      notes: "Private counselor note",
      createdBy: "counselor-1",
      zoomUrl: " https://zoom.example/x ",
    }),
  );
  assert.deepEqual(Object.keys(view).sort(), ["id", "scheduledAt", "schedulingTimeZone", "topic", "zoomUrl"]);
  assert.equal(view.zoomUrl, "https://zoom.example/x");

  const label = formatMarriageSessionScheduledAt("2026-10-31T01:00:00.000Z", "America/Denver");
  assert.match(label, /Oct 30, 2026/);
  assert.match(label, /7:00 PM/);

  console.log("marriage-hub-upcoming-sessions.test.ts: ok");
}

main();
