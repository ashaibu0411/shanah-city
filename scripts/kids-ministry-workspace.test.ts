import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getServiceDateLabel, suggestAgeGroupFromBirthYear } from "../src/lib/kids-workspace-types";
import {
  assertAllowedAgeGroupValue,
  assertAllowedService,
  buildRegisteredCheckInPayload,
  filterAnnouncementsForUser,
  filterRosterByScope,
  isAllowedAgeGroup,
  sanitizeRosterEntry,
} from "../src/lib/kids-ministry-policy-server";
import type { KidsAnnouncement } from "../src/lib/kids-workspace-types";
import type { KidsRosterEntry } from "../src/lib/kids-types";

assert.equal(suggestAgeGroupFromBirthYear("2019"), "Elementary (6-11)");
assert.match(getServiceDateLabel(new Date("2026-11-21T12:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);

assert.throws(() => assertAllowedService("Not a service"), /Invalid service/);
assert.throws(() => assertAllowedAgeGroupValue("Toddler room"), /Invalid classroom/);

const scopeTeacher = {
  canManage: false,
  service: "Sunday Morning",
  serviceDate: "2026-11-21",
  assignedAgeGroups: ["Preschool (3-5)"],
  canCheckIn: true,
  myAssignments: [],
};
assert.equal(isAllowedAgeGroup(scopeTeacher, "Preschool (3-5)"), true);
assert.equal(isAllowedAgeGroup(scopeTeacher, "Elementary (6-11)"), false);

const roster: KidsRosterEntry[] = [
  {
    id: "1",
    childName: "Ada",
    parentName: "Parent",
    ageGroup: "Preschool (3-5)",
    service: "Sunday Morning",
    checkedInAt: new Date().toISOString(),
    allergies: "Peanuts",
    medicalNotes: "Epi pen",
    hasAllergyAlert: true,
    hasMedicalAlert: true,
    authorizedPickup: [{ name: "Aunt", phone: "555", relationship: "aunt" }],
  },
  {
    id: "2",
    childName: "Ben",
    parentName: "Parent",
    ageGroup: "Elementary (6-11)",
    service: "Sunday Morning",
    checkedInAt: new Date().toISOString(),
  },
];

const scoped = filterRosterByScope(roster, scopeTeacher);
assert.equal(scoped.length, 1);
assert.equal(scoped[0]?.childName, "Ada");

const redacted = sanitizeRosterEntry(scoped[0]!, false);
assert.equal(redacted.allergies, "Allergy alert on file — see room lead.");
assert.equal(redacted.medicalNotes, "Medical alert on file — see room lead.");
assert.equal(redacted.authorizedPickup?.[0]?.phone, undefined);

const announcements: KidsAnnouncement[] = [
  {
    id: "a1",
    title: "All",
    body: "Team",
    audience: "all_teachers",
    createdBy: "lead",
    createdByName: "Lead",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "a2",
    title: "Leaders",
    body: "Private",
    audience: "leaders_only",
    createdBy: "lead",
    createdByName: "Lead",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];
assert.equal(filterAnnouncementsForUser(announcements, false).length, 1);
assert.equal(filterAnnouncementsForUser(announcements, true).length, 2);

const payload = buildRegisteredCheckInPayload({
  parent: { id: "parent-1", name: "Guardian Name" },
  child: {
    id: "child-1",
    name: "Child Name",
    relationship: "child",
    allergies: "None",
    medicalNotes: "Asthma",
    authorizedPickup: [{ name: "Pickup", phone: "555-0100" }],
  },
  ageGroup: "Preschool (3-5)",
  service: "Sunday Morning",
  securityCode: "123456",
});
assert.equal(payload.parentUserId, "parent-1");
assert.equal(payload.familyMemberId, "child-1");
assert.equal(payload.childName, "Child Name");
assert.equal(payload.allergies, "None");

const api = readFileSync("src/app/api/kids/ministry/route.ts", "utf8");
assert.match(api, /childSearch/);
assert.match(api, /memberSearch/);
assert.match(api, /assign-teacher/);
assert.match(api, /complete-lesson/);
assert.match(api, /attest-safeguarding-training/);
assert.match(api, /verify-volunteer-safeguarding/);
assert.match(api, /teacher-checkin/);
assert.match(api, /familyMemberId/);
assert.match(api, /filterAnnouncementsForUser/);
assert.match(api, /verifyRegisteredChildForCheckIn/);
assert.doesNotMatch(api, /mark-safeguarding-complete/);

const panel = readFileSync("src/components/kids/KidsMinistryPanel.tsx", "utf8");
assert.match(panel, /KidsTeacherHomeTab/);
assert.match(panel, /KidsRegisteredChildPicker/);
assert.match(panel, /first letter of child's name/);
assert.match(panel, /attest-safeguarding-training/);

const tabs = readFileSync("src/components/kids/KidsMinistryWorkspaceTabs.tsx", "utf8");
assert.match(tabs, /memberSearch/);
assert.match(tabs, /Type first letters of name/);

const schema = readFileSync("prisma/schema.prisma", "utf8");
assert.match(schema, /model KidsTeacherAssignment/);
assert.match(schema, /model KidsLessonCompletion/);
assert.match(schema, /safeguardingSelfAttestedAt/);
assert.match(schema, /safeguardingLeaderVerifiedAt/);

console.log("Kids Ministry workspace regression checks passed.");