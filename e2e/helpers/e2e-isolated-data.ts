/**
 * Isolated JSON data for Playwright marriage E2E (never touches production data/).
 */
import bcrypt from "bcryptjs";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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
  seniorPastor: {
    id: "marriage-e2e-senior-pastor",
    email: "marriage-e2e-senior-pastor@test.local",
    name: "E2E Senior Pastor",
    password: "E2eMarriageTest!local",
  },
  adminA: {
    id: "marriage-e2e-admin-a",
    email: "marriage-e2e-admin-a@test.local",
    name: "E2E Assignment Admin A",
    password: "E2eMarriageTest!local",
  },
  adminB: {
    id: "marriage-e2e-admin-b",
    email: "marriage-e2e-admin-b@test.local",
    name: "E2E Assignment Admin B",
    password: "E2eMarriageTest!local",
  },
  /** Ordinary church member (non-participant). */
  member: {
    id: "marriage-e2e-member",
    email: "marriage-e2e-member@test.local",
    name: "E2E Church Member",
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

const EMPTY_MARRIAGE_STORE = {
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
  answerChangeGenerations: [],
  assignmentRequests: [],
  assignmentAcknowledgments: [],
  participantCounselorRevocations: [],
  administrativeCoordinators: [],
};

function writePastoralRolesFixture() {
  writeFileSync(
    join(E2E_DATA, "pastoral-roles.json"),
    JSON.stringify(
      {
        seniorPastorUserId: E2E_USERS.seniorPastor.id,
        associatePastorUserId: null,
        updatedAt: new Date().toISOString(),
        updatedBy: E2E_USERS.seniorPastor.id,
        updatedByName: "E2E fixture",
      },
      null,
      2,
    ),
  );
}

function assertE2eFixturePathSafe() {
  const normalized = resolve(E2E_DATA).replace(/\\/g, "/").toLowerCase();
  if (!normalized.includes("/.e2e-isolated/")) {
    throw new Error(`Refusing E2E fixture writes outside .e2e-isolated: ${E2E_DATA}`);
  }
}

/** Reset marriage assignment state without deleting auth/groups (avoids server ENOENT races). */
export async function resetMarriageE2eState() {
  assertE2eFixturePathSafe();
  mkdirSync(E2E_DATA, { recursive: true });
  if (!existsSync(join(E2E_DATA, "users.json"))) {
    await prepareE2eIsolatedData();
    return;
  }
  for (const file of ["groups.json", "activity.json"] as const) {
    const path = join(E2E_DATA, file);
    if (!existsSync(path)) {
      writeFileSync(path, "[]");
    }
  }
  writeFileSync(join(E2E_DATA, "sessions.json"), "[]");
  writeFileSync(
    join(E2E_DATA, "marriage-counseling.json"),
    JSON.stringify(EMPTY_MARRIAGE_STORE, null, 2),
  );
  writePastoralRolesFixture();
}

export async function prepareE2eIsolatedData() {
  assertE2eFixturePathSafe();
  rmSync(E2E_ROOT, { recursive: true, force: true });
  mkdirSync(E2E_DATA, { recursive: true });

  const users = await Promise.all([
    seedUser(E2E_USERS.partnerA),
    seedUser(E2E_USERS.partnerB),
    seedUser(E2E_USERS.counselor),
    seedUser(E2E_USERS.stranger),
    seedUser(E2E_USERS.seniorPastor),
    seedUser(E2E_USERS.adminA),
    seedUser(E2E_USERS.adminB),
    seedUser(E2E_USERS.member),
  ]);

  writeFileSync(join(E2E_DATA, "users.json"), JSON.stringify(users, null, 2));
  writeFileSync(join(E2E_DATA, "sessions.json"), "[]");
  writeFileSync(join(E2E_DATA, "activity.json"), "[]");
  writeFileSync(join(E2E_DATA, "groups.json"), "[]");

  writeFileSync(
    join(E2E_DATA, "marriage-counseling.json"),
    JSON.stringify(EMPTY_MARRIAGE_STORE, null, 2),
  );
  writePastoralRolesFixture();
  writeFileSync(
    join(E2E_DATA, "marriage-curriculum.json"),
    JSON.stringify({ versions: [], programTracks: [] }, null, 2),
  );

  writeFileSync(
    join(E2E_ROOT, "README.txt"),
    "Ephemeral Playwright data. Safe to delete. Not used in production.\n",
  );
}
