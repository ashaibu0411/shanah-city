import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { getConfiguredWorshipGroupId, userIsInWorshipGroup } from "@/lib/worship-access-server";
import { getGroupDetail } from "@/lib/group-server";
import {
  listChoirServiceSchedules,
  persistChoirServiceSchedule,
  removeChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-server";
import type { ChoirLeadRole, ChoirServiceProgram } from "@/lib/choir-service-schedule-types";

function parseProgram(value: unknown): ChoirServiceProgram | null {
  if (value === "glory-encounter" || value === "sunday-service" || value === "special-program") {
    return value;
  }
  return null;
}

function parseLeadRole(value: unknown): ChoirLeadRole | null {
  if (value === "worship" || value === "praise" || value === "both") {
    return value;
  }
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await userIsInWorshipGroup(user.id))) {
    return NextResponse.json(
      { error: "Join Shanah Worship (Choir) under Groups." },
      { status: 403 },
    );
  }

  const groupId = getConfiguredWorshipGroupId();
  const canManage = await canManageGroupEvents(user, groupId);
  const entries = await listChoirServiceSchedules();
  const group = await getGroupDetail(groupId, user.id);
  const roster = (group?.members ?? []).map((member) => ({ id: member.id, name: member.name }));

  return NextResponse.json({ entries, canManage, roster });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const groupId = getConfiguredWorshipGroupId();
  if (!(await canManageGroupEvents(user, groupId))) {
    return NextResponse.json(
      { error: "Only choir leaders and assistants can edit the schedule." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const action = String(body.action ?? "save");

  if (action === "delete") {
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Schedule id is required." }, { status: 400 });
    }
    const removed = await removeChoirServiceScheduleEntry(id);
    if (!removed) {
      return NextResponse.json({ error: "Schedule entry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const program = parseProgram(body.program);
  const leadRole = parseLeadRole(body.leadRole);
  if (!program || !leadRole) {
    return NextResponse.json({ error: "Choose a valid service type and lead role." }, { status: 400 });
  }

  try {
    const entry = await persistChoirServiceSchedule({
      id: body.id ? String(body.id).trim() : undefined,
      serviceDate: String(body.serviceDate ?? ""),
      serviceTime: String(body.serviceTime ?? "10:00"),
      program,
      leadRole,
      worshipLeaderName: body.worshipLeaderName ? String(body.worshipLeaderName) : undefined,
      praiseLeaderName: body.praiseLeaderName ? String(body.praiseLeaderName) : undefined,
      ministration: Boolean(body.ministration),
      ministrationBy: body.ministrationBy ? String(body.ministrationBy) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      actor: { id: user.id, name: user.name },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save schedule." },
      { status: 400 },
    );
  }
}
