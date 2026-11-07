import assert from "node:assert/strict";
import { buildAppNavItems } from "../src/lib/use-app-nav-items";
import {
  marriageCounselingNavItem,
  marriageCounselorAssignmentsNavItem,
  couplesNavItem,
  temperamentShepherdingNavItem,
} from "../src/lib/site";

const basePerms = {
  canWriteDevotions: false,
  canAccessWorshipPlanner: false,
  canAccessFrontLiners: false,
  canAccessKidsMinistry: false,
  canManageAdmin: false,
  canReviewMinistryReports: false,
  canAccessFinance: false,
  canAccessCouplesHub: false,
  canAccessMarriageCounselorAssignments: false,
  canAccessTemperamentShepherdingHub: false,
  canAccessAskShepherd: false,
};

const guestItems = buildAppNavItems(null, basePerms);
assert.ok(
  guestItems.some((i) => i.href === marriageCounselingNavItem.href),
  "guests see Marriage Prep",
);
assert.ok(
  !guestItems.some((i) => i.href === couplesNavItem.href),
  "guests do not see Couples Hub",
);

const groupsIdx = guestItems.findIndex((i) => i.href === "/groups");
const marriageIdx = guestItems.findIndex((i) => i.href === marriageCounselingNavItem.href);
assert.ok(groupsIdx >= 0 && marriageIdx === groupsIdx + 1, "Marriage Prep follows Groups");

const signedInNoCouples = buildAppNavItems(
  { id: "u1", name: "Test", email: "t@t.com", campusId: "colorado", role: "member" } as never,
  basePerms,
);
assert.ok(signedInNoCouples.some((i) => i.href === marriageCounselingNavItem.href));
assert.ok(!signedInNoCouples.some((i) => i.href === couplesNavItem.href));

const signedInCouples = buildAppNavItems(
  { id: "u1", name: "Test", email: "t@t.com", campusId: "colorado", role: "member" } as never,
  { ...basePerms, canAccessCouplesHub: true },
);
const cIdx = signedInCouples.findIndex((i) => i.href === couplesNavItem.href);
const mIdx = signedInCouples.findIndex((i) => i.href === marriageCounselingNavItem.href);
assert.ok(cIdx >= 0 && mIdx === cIdx + 1, "Couples Hub immediately before Marriage Prep");

const assignmentAdminNav = buildAppNavItems(
  { id: "u1", name: "Test", email: "t@t.com", campusId: "colorado", role: "member" } as never,
  { ...basePerms, canAccessMarriageCounselorAssignments: true },
);
const marriageNavIdx = assignmentAdminNav.findIndex((i) => i.href === marriageCounselingNavItem.href);
const counselorNavIdx = assignmentAdminNav.findIndex(
  (i) => i.href === marriageCounselorAssignmentsNavItem.href,
);
assert.ok(
  marriageNavIdx >= 0 && counselorNavIdx === marriageNavIdx + 1,
  "Counselor Assignments follows Marriage Prep in sidebar/More",
);
assert.ok(
  !guestItems.some((i) => i.href === marriageCounselorAssignmentsNavItem.href),
  "guests do not see Counselor Assignments",
);

const eligibleChoirMemberNav = buildAppNavItems(
  { id: "choir1", name: "Choir Member", email: "choir@example.test", campusId: "colorado", role: "member" } as never,
  { ...basePerms, canAccessTemperamentShepherdingHub: true, canAccessWorshipPlanner: true },
);
assert.ok(
  eligibleChoirMemberNav.some((i) => i.href === temperamentShepherdingNavItem.href),
  "eligible choir members see My Temperament in sidebar and mobile More",
);
assert.ok(
  !signedInNoCouples.some((i) => i.href === temperamentShepherdingNavItem.href),
  "members without temperament permission do not see the hub link",
);
assert.ok(
  !guestItems.some((i) => i.href === temperamentShepherdingNavItem.href),
  "signed-out visitors do not see private temperament navigation",
);

console.log("app-nav-items.test.ts OK");
