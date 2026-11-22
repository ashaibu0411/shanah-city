import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { KidCheckIn } from "../src/lib/member-types";
import type { KidsTeacherAssignment } from "../src/lib/kids-workspace-types";
import type { PublicMember } from "../src/lib/auth-types";
import {
  executeAuthorizedKidCheckout,
  filterAnnouncementsForUser,
  filterRosterByScope,
  hasConfirmedAssignmentForAgeGroup,
  resolveIncidentFromCheckIn,
  sanitizeRosterEntry,
  type KidsMinistryScope,
} from "../src/lib/kids-ministry-policy-server";
import type { KidsRosterEntry } from "../src/lib/kids-types";

const baseMember = {
  campusId: "main",
  family: [] as PublicMember["family"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const teacher: PublicMember = {
  ...baseMember,
  id: "teacher-pending",
  name: "Pending Teacher",
  email: "pending@example.com",
  role: "member",
};

const confirmedTeacher: PublicMember = {
  ...baseMember,
  id: "teacher-confirmed",
  name: "Confirmed Teacher",
  email: "confirmed@example.com",
  role: "member",
};

const activeCheckIn: KidCheckIn = {
  id: "kid-active-1",
  childName: "River",
  parentName: "Guardian",
  parentUserId: "parent-1",
  ageGroup: "Elementary (6-11)",
  service: "Sunday Morning",
  securityCode: "654321",
  checkedInAt: new Date().toISOString(),
};

function scopeWithAssignments(rows: KidsTeacherAssignment[]): KidsMinistryScope {
  const confirmedAgeGroups = [
    ...new Set(rows.filter((r) => r.status === "confirmed").map((r) => r.ageGroup)),
  ];
  return {
    canManage: false,
    service: "Sunday Morning",
    serviceDate: "2026-11-21",
    confirmedAgeGroups,
    canCheckIn: rows.some((r) => r.status === "confirmed"),
    myAssignments: rows,
  };
}

const pendingOnlyScope = scopeWithAssignments([
  {
    id: "a-pending",
    userId: teacher.id,
    userName: teacher.name,
    role: "teacher",
    ageGroup: "Elementary (6-11)",
    service: "Sunday Morning",
    serviceDate: "2026-11-21",
    status: "pending",
    assignedBy: "lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

const confirmedOtherRoom = scopeWithAssignments([
  {
    id: "a-confirmed",
    userId: confirmedTeacher.id,
    userName: confirmedTeacher.name,
    role: "teacher",
    ageGroup: "Preschool (3-5)",
    service: "Sunday Morning",
    serviceDate: "2026-11-21",
    status: "confirmed",
    assignedBy: "lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

const confirmedSameRoom = scopeWithAssignments([
  {
    id: "a-confirmed-same",
    userId: confirmedTeacher.id,
    userName: confirmedTeacher.name,
    role: "teacher",
    ageGroup: "Elementary (6-11)",
    service: "Sunday Morning",
    serviceDate: "2026-11-21",
    status: "confirmed",
    assignedBy: "lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

async function main() {
assert.equal(hasConfirmedAssignmentForAgeGroup(pendingOnlyScope, "Elementary (6-11)"), false);
assert.equal(hasConfirmedAssignmentForAgeGroup(confirmedSameRoom, "Elementary (6-11)"), true);

const roster: KidsRosterEntry[] = [
  {
    id: "1",
    childName: "River",
    parentName: "G",
    ageGroup: "Elementary (6-11)",
    service: "Sunday Morning",
    checkedInAt: new Date().toISOString(),
    medicalNotes: "private",
    hasMedicalAlert: true,
  },
];
assert.equal(filterRosterByScope(roster, pendingOnlyScope).length, 0);
assert.equal(filterRosterByScope(roster, confirmedSameRoom).length, 1);
const redacted = sanitizeRosterEntry(filterRosterByScope(roster, confirmedSameRoom)[0]!, false);
assert.notEqual(redacted.medicalNotes, "private");

let verifyMutations = 0;
const deniedCheckout = await executeAuthorizedKidCheckout(
  activeCheckIn.id,
  "654321",
  teacher.id,
  teacher,
  pendingOnlyScope,
  {
    getKidCheckIns: async () => [activeCheckIn],
    verifyCheckoutKid: async () => {
      verifyMutations += 1;
      return { checkin: { ...activeCheckIn, checkedOutAt: new Date().toISOString() } };
    },
  },
);
assert.equal(deniedCheckout.ok, false);
assert.equal(deniedCheckout.status, 403);
assert.equal(verifyMutations, 0, "checkout must not mutate when unauthorized");

verifyMutations = 0;
const wrongRoom = await executeAuthorizedKidCheckout(
  activeCheckIn.id,
  "654321",
  confirmedTeacher.id,
  confirmedTeacher,
  confirmedOtherRoom,
  {
    getKidCheckIns: async () => [activeCheckIn],
    verifyCheckoutKid: async () => {
      verifyMutations += 1;
      return { checkin: { ...activeCheckIn, checkedOutAt: new Date().toISOString() } };
    },
  },
);
assert.equal(wrongRoom.ok, false);
assert.equal(wrongRoom.status, 403);
assert.equal(verifyMutations, 0);

verifyMutations = 0;
const badCode = await executeAuthorizedKidCheckout(
  activeCheckIn.id,
  "000000",
  confirmedTeacher.id,
  confirmedTeacher,
  confirmedSameRoom,
  {
    getKidCheckIns: async () => [activeCheckIn],
    verifyCheckoutKid: async () => {
      verifyMutations += 1;
      return { checkin: activeCheckIn };
    },
  },
);
assert.equal(badCode.ok, false);
assert.equal(badCode.status, 403);
assert.equal(verifyMutations, 0, "checkout must not mutate when security code fails");

verifyMutations = 0;
const ok = await executeAuthorizedKidCheckout(
  activeCheckIn.id,
  "654321",
  confirmedTeacher.id,
  confirmedTeacher,
  confirmedSameRoom,
  {
    getKidCheckIns: async () => [activeCheckIn],
    verifyCheckoutKid: async () => {
      verifyMutations += 1;
      return { checkin: { ...activeCheckIn, checkedOutAt: new Date().toISOString() } };
    },
  },
);
assert.equal(ok.ok, true);
assert.equal(verifyMutations, 1);

const incident = resolveIncidentFromCheckIn(activeCheckIn, {
  childName: "Wrong Name",
  parentUserId: "fake-parent",
});
assert.equal(incident.childNameMismatch, true);
assert.equal(incident.parentUserId, "parent-1");
assert.equal(incident.childName, "River");

assert.equal(
  filterAnnouncementsForUser(
    [
      {
        id: "1",
        title: "All",
        body: "b",
        audience: "all_teachers",
        createdBy: "l",
        createdByName: "L",
        publishedAt: "x",
        createdAt: "x",
      },
      {
        id: "2",
        title: "Leaders",
        body: "b",
        audience: "leaders_only",
        createdBy: "l",
        createdByName: "L",
        publishedAt: "x",
        createdAt: "x",
      },
    ],
    false,
  ).length,
  1,
);

const ministryRoute = readFileSync("src/app/api/kids/ministry/route.ts", "utf8");
assert.match(ministryRoute, /executeAuthorizedKidCheckout/);
assert.doesNotMatch(ministryRoute, /\bverifyCheckoutKid\b/);
assert.match(ministryRoute, /hasConfirmedAssignmentForAgeGroup/);
assert.match(ministryRoute, /resolveIncidentFromCheckIn/);
assert.match(ministryRoute, /confirmedAgeGroups/);
assert.match(ministryRoute, /canViewSensitiveChildData/);
assert.match(ministryRoute, /volunteerEligibleForAssignment\(existing\.userId/);

console.log("Kids Ministry API security regression checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});