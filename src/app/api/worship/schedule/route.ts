import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
  getConfiguredWorshipGroupId,
} from "@/lib/worship-access-server";
import {
  generateWorshipSchedule,
  getWorshipRotationConfig,
  listUpcomingLeaderAssignments,
  saveWorshipRotationConfig,
} from "@/lib/worship-rotation-server";
import { getGroupDetail } from "@/lib/group-server";
import type { WorshipRotationPoolMember } from "@/lib/worship-types";

async function requireWorshipManager() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return {
      error: NextResponse.json({ error: "Join Shanah Worship (Choir) under Groups." }, { status: 403 }),
    };
  }

  if (!(await canManageWorshipPlan(user))) {
    return { error: NextResponse.json({ error: "Worship leader access required." }, { status: 403 }) };
  }

  return { user };
}

function parsePool(value: unknown): WorshipRotationPoolMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = entry as { userId?: string; name?: string };
      if (!row.userId?.trim() || !row.name?.trim()) return null;
      return { userId: row.userId.trim(), name: row.name.trim() };
    })
    .filter((entry): entry is WorshipRotationPoolMember => Boolean(entry));
}

export async function GET() {
  const auth = await requireWorshipManager();
  if (auth.error) return auth.error;

  const [config, assignments, group] = await Promise.all([
    getWorshipRotationConfig(),
    listUpcomingLeaderAssignments(),
    getGroupDetail(getConfiguredWorshipGroupId(), auth.user!.id),
  ]);

  return NextResponse.json({
    config,
    assignments,
    members: group?.members ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireWorshipManager();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save_config");

  try {
    if (action === "generate") {
      const result = await generateWorshipSchedule({
        startDate: body.startDate ? String(body.startDate) : undefined,
        weeksAhead: body.weeksAhead ? Number(body.weeksAhead) : undefined,
        overwrite: Boolean(body.overwrite),
        actor: { id: auth.user!.id, name: auth.user!.name },
      });

      return NextResponse.json({
        ok: true,
        createdCount: result.created.length,
        skippedDates: result.skipped,
        config: result.config,
        plans: result.created,
      });
    }

    const config = await saveWorshipRotationConfig({
      pool: parsePool(body.pool),
      serviceTime: String(body.serviceTime ?? "10:00"),
      serviceKind: body.serviceKind === "friday" ? "friday" : "sunday",
      rotationIndex: body.rotationIndex !== undefined ? Number(body.rotationIndex) : undefined,
      skipDates: Array.isArray(body.skipDates)
        ? body.skipDates.map((entry: unknown) => String(entry).trim()).filter(Boolean)
        : undefined,
      weeksAhead: body.weeksAhead !== undefined ? Number(body.weeksAhead) : undefined,
      uploadDutyLeadDays:
        body.uploadDutyLeadDays !== undefined ? Number(body.uploadDutyLeadDays) : undefined,
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update worship schedule." },
      { status: 400 },
    );
  }
}
