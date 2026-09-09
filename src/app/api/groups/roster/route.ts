import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroupDetail } from "@/lib/group-server";
import {
  canManageGroupRoster,
  canViewGroupRoster,
  canViewRosterRecord,
} from "@/lib/group-roster-access-server";
import {
  deleteGroupServiceRoster,
  findPreviousGroupServiceRoster,
  getGroupRosterTemplateRoles,
  getGroupServiceRoster,
  listGroupServiceRosters,
  saveGroupRosterTemplateRoles,
  saveGroupServiceRoster,
} from "@/lib/group-roster-server";
import {
  cloneRosterSlotsForCopy,
  DEFAULT_ROSTER_SERVICE_TIME,
  groupUsesServiceRoster,
  nextServiceSundayIso,
  normalizeRosterSlots,
  rosterServiceDateTimeLabel,
  rosterServiceTimes,
  rosterSlotsFromMembers,
  type GroupRosterSlot,
} from "@/lib/group-roster-types";

function parseSlots(body: Record<string, unknown>): GroupRosterSlot[] {
  if (!Array.isArray(body.assignments)) return [];
  return normalizeRosterSlots(body.assignments as GroupRosterSlot[]);
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim();
  if (!groupId) {
    return NextResponse.json({ error: "Group id is required." }, { status: 400 });
  }

  const group = await getGroupDetail(groupId, user.id);
  if (!group || !(await canViewGroupRoster(user, groupId))) {
    return NextResponse.json({ error: "Group roster access denied." }, { status: 403 });
  }

  const canManage = await canManageGroupRoster(user, groupId);
  const serviceDate = searchParams.get("serviceDate")?.trim();
  const serviceTime = searchParams.get("serviceTime")?.trim();
  const since = searchParams.get("since")?.trim();
  const template = searchParams.get("template") === "1";

  if (template) {
    if (!canManage) {
      return NextResponse.json({ error: "Group leader access required." }, { status: 403 });
    }
    const roles = await getGroupRosterTemplateRoles(group);
    return NextResponse.json({
      roles,
      members: group.members.map((member) => ({ id: member.id, name: member.name })),
      serviceTimes: rosterServiceTimes(),
    });
  }

  if (serviceDate && serviceTime) {
    const roster = await getGroupServiceRoster(groupId, serviceDate, serviceTime);
    if (!roster) {
      const roles = await getGroupRosterTemplateRoles(group);
      return NextResponse.json({
        roster: null,
        canManage,
        templateRoles: roles,
        defaultAssignments: rosterSlotsFromMembers(
          roles,
          group.members.map((member) => ({ id: member.id, name: member.name })),
        ),
      });
    }

    if (!canViewRosterRecord(user.id, canManage, roster)) {
      return NextResponse.json({ roster: null, canManage, hidden: true });
    }

    return NextResponse.json({ roster, canManage });
  }

  const rosters = await listGroupServiceRosters({
    groupId,
    since: since || new Date().toISOString().slice(0, 10),
  }).then((entries) =>
    entries.filter((entry) => canViewRosterRecord(user.id, canManage, entry)),
  );

  return NextResponse.json({ rosters, canManage });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const serviceDate = String(body.serviceDate ?? nextServiceSundayIso()).trim();
  const serviceTime = String(body.serviceTime ?? DEFAULT_ROSTER_SERVICE_TIME).trim();
  const action = String(body.action ?? "save");

  if (!groupId) {
    return NextResponse.json({ error: "Group id is required." }, { status: 400 });
  }

  const group = await getGroupDetail(groupId, user.id);
  if (!group || !groupUsesServiceRoster(group)) {
    return NextResponse.json({ error: "This group does not use service rosters." }, { status: 403 });
  }

  const canManage = await canManageGroupRoster(user, groupId);
  if (!canManage) {
    return NextResponse.json({ error: "Group leader access required." }, { status: 403 });
  }

  if (action === "delete") {
    const removed = await deleteGroupServiceRoster(groupId, serviceDate, serviceTime);
    if (!removed) {
      return NextResponse.json({ error: "Roster not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "copy_from_previous") {
    const source = await findPreviousGroupServiceRoster(groupId, serviceDate, serviceTime);
    if (!source) {
      return NextResponse.json({ error: "No previous roster found for this time slot." }, { status: 404 });
    }

    const roles = source.assignments.map((slot) => slot.roleLabel);
    await saveGroupRosterTemplateRoles(groupId, roles);
    const assignments = cloneRosterSlotsForCopy(source.assignments);

    const roster = await saveGroupServiceRoster({
      groupId,
      serviceDate,
      serviceTime,
      title: source.title ?? undefined,
      assignments,
      notes: source.notes ?? undefined,
      status: "draft",
      actor: { id: user.id, name: user.name },
    });

    return NextResponse.json({
      roster,
      copiedFrom: rosterServiceDateTimeLabel(source.serviceDate, source.serviceTime),
    });
  }

  const assignments = parseSlots(body);
  const roleLabels = assignments.map((slot) => slot.roleLabel);
  if (roleLabels.length > 0) {
    await saveGroupRosterTemplateRoles(groupId, roleLabels);
  }

  let status: "draft" | "published" = "draft";
  if (action === "publish") status = "published";
  else if (action === "unpublish") status = "draft";
  else if (body.status === "published") status = "published";

  const roster = await saveGroupServiceRoster({
    groupId,
    serviceDate,
    serviceTime,
    title: body.title ? String(body.title) : undefined,
    assignments,
    notes: body.notes ? String(body.notes) : undefined,
    status,
    actor: { id: user.id, name: user.name },
  });

  return NextResponse.json({ roster });
}
