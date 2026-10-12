import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const { getGroupDetail } = await import("../src/lib/group-server.ts");
const { buildChoirCalendarPagePayload } = await import("../src/lib/choir-calendar-server.ts");
const { buildChoirAvailabilityHomePayload, buildChoirMySchedulePayload } = await import(
  "../src/lib/choir-availability-server.ts"
);

const groupId = "group-choir";
const group = await getGroupDetail(groupId);
const member = group?.members?.[0];
if (!member) {
  console.error("FAIL: no members on group-choir");
  process.exit(1);
}

const user = { id: member.id, name: member.name, email: "verify@local", role: "member" };
const asMember = await getGroupDetail(groupId, user.id);

const checks = [
  ["Worship Calendar", () => buildChoirCalendarPagePayload(user, groupId)],
  ["Availability Center", () => buildChoirAvailabilityHomePayload(user, groupId)],
  ["My Schedule", () => buildChoirMySchedulePayload(user, groupId)],
];

console.log("Member:", user.id, user.name, "isMember:", asMember?.isMember);
let failed = 0;
for (const [label, fn] of checks) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    if (!result) {
      console.log(`FAIL ${label}: null payload (${ms}ms) — access denied path`);
      failed += 1;
    } else {
      const extra =
        "events" in result
          ? `events=${result.events.length}`
          : "assignments" in result
            ? `assignments=${result.assignments.length}`
            : "ok";
      console.log(`OK   ${label}: ${extra} (${ms}ms)`);
    }
  } catch (error) {
    console.log(`FAIL ${label}: THREW`, error instanceof Error ? error.message : error);
    failed += 1;
  }
}
process.exit(failed > 0 ? 1 : 0);
