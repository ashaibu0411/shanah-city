import "./load-project-env";
import { prisma } from "../src/lib/db";
import {
  DEFAULT_ROSTER_SERVICE_TIME,
  defaultRosterRolesForGroup,
  emptySlotsForRoles,
  nextServiceSundayIso,
} from "../src/lib/group-roster-types";
import { isMediaGroup } from "../src/lib/media-group";
import type { GroupCategory } from "../src/lib/group-types";
import { saveGroupServiceRoster } from "../src/lib/stores/group-roster-db";

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

function shouldSeedGroup(group: { id: string; name: string }) {
  if (group.id === "group-ushering") return true;
  return isMediaGroup(group);
}

async function publishStarterRoster(group: {
  id: string;
  name: string;
  category: string;
  memberIds: unknown;
  adminIds: unknown;
}) {
  const serviceDate = nextServiceSundayIso();
  const serviceTime = DEFAULT_ROSTER_SERVICE_TIME;

  const existing = await prisma.groupServiceRoster.findUnique({
    where: {
      groupId_serviceDate_serviceTime: {
        groupId: group.id,
        serviceDate,
        serviceTime,
      },
    },
  });

  if (existing?.status === "published") {
    console.log(`Skip ${group.name}: published roster already exists for ${serviceDate} ${serviceTime}.`);
    return;
  }

  const memberIds = parseStringArray(group.memberIds);
  const adminIds = parseStringArray(group.adminIds);
  const leaderId = adminIds[0] ?? memberIds[0] ?? null;
  if (!leaderId) {
    console.warn(`Skip ${group.name}: no members to use as roster author.`);
    return;
  }

  const leader = await prisma.user.findUnique({
    where: { id: leaderId },
    select: { id: true, name: true },
  });
  if (!leader) {
    console.warn(`Skip ${group.name}: roster author ${leaderId} not found.`);
    return;
  }

  const roles = defaultRosterRolesForGroup({
    id: group.id,
    name: group.name,
    category: group.category as GroupCategory,
  });

  const roster = await saveGroupServiceRoster({
    groupId: group.id,
    serviceDate,
    serviceTime,
    title: "Sunday Service",
    assignments: emptySlotsForRoles(roles),
    notes: "",
    status: "published",
    actor: { id: leader.id, name: leader.name },
  });

  console.log(`Published ${group.name} roster for ${serviceDate} at ${serviceTime} (${roster.id}).`);
  console.log(`  Roles: ${roles.join(", ")}`);
}

async function main() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      memberIds: true,
      adminIds: true,
    },
  });

  const targets = groups.filter(shouldSeedGroup);
  if (targets.length === 0) {
    console.log("No roster groups found to seed.");
    return;
  }

  for (const group of targets) {
    await publishStarterRoster(group);
  }

  console.log("Done. Assign people in each group under Manage → Service roster.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
