import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { getGroupDetail } from "@/lib/group-server";
import {
  isChoirScheduleReadOnlyError,
  listGroupServiceSchedules,
  persistGroupServiceSchedule,
  removeGroupServiceScheduleEntry,
} from "@/lib/choir-service-schedule-server";
import type { GroupScheduleAssignment } from "@/lib/choir-service-schedule-types";
import {
  getGroupServiceScheduleConfig,
  groupHasServiceSchedule,
  parseProgramForGroup,
  parseRoleForGroup,
} from "@/lib/group-service-schedule-config";

function parseAssignments(
  config: NonNullable<ReturnType<typeof getGroupServiceScheduleConfig>>,
  value: unknown,
): GroupScheduleAssignment[] | null {
  if (!Array.isArray(value)) return null;
  const assignments: GroupScheduleAssignment[] = [];
  for (const row of value) {
    const item = row as { role?: unknown; personName?: unknown };
    const role = parseRoleForGroup(config, item.role);
    const personName = String(item.personName ?? "").trim();
    if (!role || !personName) continue;
    assignments.push({ role, personName });
  }
  return assignments.length > 0 ? assignments : null;
}

async function userCanViewSchedule(user: PublicMember, groupId: string) {
  if (await canManageAsAdmin(user)) {
    return true;
  }
  const group = await getGroupDetail(groupId, user.id);
  return Boolean(group?.isMember);
}

export function formatGroupScheduleSaveError(error: unknown) {
  if (isChoirScheduleReadOnlyError(error)) {
    return "Schedule could not be saved on the server. Run the latest database migration (ChoirServiceSchedule groupId) on production.";
  }
  return error instanceof Error ? error.message : "Could not save schedule.";
}

export async function readGroupServiceSchedule(user: PublicMember | null, groupId: string) {
  if (!groupHasServiceSchedule(groupId)) {
    return { error: "This group does not use service schedules.", status: 404 as const };
  }

  const config = getGroupServiceScheduleConfig(groupId)!;

  if (!user) {
    return { error: "Sign in required.", status: 401 as const };
  }

  if (!(await userCanViewSchedule(user, groupId))) {
    return { error: "Join this group under Groups to view the schedule.", status: 403 as const };
  }

  const canManage = await canManageGroupEvents(user, groupId);
  const entries = await listGroupServiceSchedules(groupId);
  const group = await getGroupDetail(groupId, user.id);
  const roster = (group?.members ?? []).map((member) => ({ id: member.id, name: member.name }));

  return {
    status: 200 as const,
    body: {
      entries,
      canManage,
      roster,
      config: { programs: config.programs, roles: config.roles },
    },
  };
}

export async function writeGroupServiceSchedule(
  user: PublicMember | null,
  groupId: string,
  body: Record<string, unknown>,
) {
  if (!groupHasServiceSchedule(groupId)) {
    return { error: "This group does not use service schedules.", status: 404 as const };
  }

  const config = getGroupServiceScheduleConfig(groupId)!;

  if (!user) {
    return { error: "Sign in required.", status: 401 as const };
  }

  if (!(await canManageGroupEvents(user, groupId))) {
    return {
      error: "Only group leaders, assistants, and church admins can add or change the schedule.",
      status: 403 as const,
    };
  }

  const action = String(body.action ?? "save");

  if (action === "delete") {
    const id = String(body.id ?? "").trim();
    if (!id) {
      return { error: "Schedule id is required.", status: 400 as const };
    }
    try {
      const removed = await removeGroupServiceScheduleEntry(id, groupId, {
        id: user.id,
        name: user.name,
      });
      if (!removed) {
        return { error: "Schedule entry not found.", status: 404 as const };
      }
      return { status: 200 as const, body: { ok: true } };
    } catch (error) {
      return { error: formatGroupScheduleSaveError(error), status: 500 as const };
    }
  }

  const program = parseProgramForGroup(config, body.program);
  const assignments = parseAssignments(config, body.assignments);
  if (!program || !assignments) {
    return {
      error: "Choose a service type and add at least one person with a role.",
      status: 400 as const,
    };
  }

  try {
    const entry = await persistGroupServiceSchedule({
      id: body.id ? String(body.id).trim() : undefined,
      groupId,
      serviceDate: String(body.serviceDate ?? ""),
      serviceTime: String(body.serviceTime ?? "10:00"),
      program,
      assignments,
      notes: body.notes ? String(body.notes) : undefined,
      actor: { id: user.id, name: user.name },
    });

    return { status: 200 as const, body: { entry } };
  } catch (error) {
    return { error: formatGroupScheduleSaveError(error), status: 400 as const };
  }
}
