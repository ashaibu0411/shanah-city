/**
 * Isolated JSON data for Playwright marriage E2E (never touches production data/).
 */
import bcrypt from "bcryptjs";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const E2E_ROOT = join(process.cwd(), ".e2e-isolated");
export const E2E_DATA = join(E2E_ROOT, "data");

export const E2E_USERS = {
  partnerA: {
    id: "marriage-e2e-partner-a",
    email: "marriage-e2e-partner-a@test.local",
    name: "E2E Partner A",
    password: "E2eMarriageTest!local",
  },
  partnerB: {
    id: "marriage-e2e-partner-b",
    email: "marriage-e2e-partner-b@test.local",
    name: "E2E Partner B",
    password: "E2eMarriageTest!local",
  },
  counselor: {
    id: "marriage-e2e-counselor",
    email: "marriage-e2e-counselor@test.local",
    name: "E2E Counselor",
    password: "E2eMarriageTest!local",
  },
  stranger: {
    id: "marriage-e2e-stranger",
    email: "marriage-e2e-stranger@test.local",
    name: "E2E Stranger",
    password: "E2eMarriageTest!local",
  },
} as const;

async function seedUser(profile: {
  id: string;
  email: string;
  name: string;
  password: string;
}) {
  const now = new Date().toISOString();
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    campusId: "colorado",
    role: "member" as const,
    participationType: "member",
    notificationPrefs: {
      pushEnabled: false,
      devotions: false,
      messages: false,
      groupChat: false,
      announcements: false,
      worship: false,
      kids: false,
    },
    passwordHash: await bcrypt.hash(profile.password, 10),
    family: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function prepareE2eIsolatedData() {
  rmSync(E2E_ROOT, { recursive: true, force: true });
  mkdirSync(E2E_DATA, { recursive: true });

  const users = await Promise.all([
    seedUser(E2E_USERS.partnerA),
    seedUser(E2E_USERS.partnerB),
    seedUser(E2E_USERS.counselor),
    seedUser(E2E_USERS.stranger),
  ]);

  writeFileSync(join(E2E_DATA, "users.json"), JSON.stringify(users, null, 2));
  writeFileSync(join(E2E_DATA, "sessions.json"), "[]");
  writeFileSync(join(E2E_DATA, "activity.json"), "[]");
  writeFileSync(join(E2E_DATA, "groups.json"), "[]");

  const emptyMarriage = {
    journeys: [],
    consents: [],
    responses: [],
    unlocks: [],
    journal: [],
    assignments: [],
    sessions: [],
    counselorNotes: [],
    discussionMarks: [],
    invites: [],
    revisionRequests: [],
    auditLogs: [],
    actionPlans: [],
    sharedGoals: [],
    sharingConsents: [],
    activitySyncSessions: [],
  };
  writeFileSync(join(E2E_DATA, "marriage-counseling.json"), JSON.stringify(emptyMarriage, null, 2));
  writeFileSync(
    join(E2E_DATA, "marriage-curriculum.json"),
    JSON.stringify({ versions: [], programTracks: [] }, null, 2),
  );

  writeFileSync(
    join(E2E_ROOT, "README.txt"),
    "Ephemeral Playwright data. Safe to delete. Not used in production.\n",
  );
}
