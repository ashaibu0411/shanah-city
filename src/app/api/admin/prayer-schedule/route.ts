import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getAdminPeopleDirectory } from "@/lib/admin-people-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { approveAndNotifyPrayerSchedule } from "@/lib/prayer-notify-server";
import {
  generatePrayerSchedule,
  getPrayerRotationConfig,
  listUpcomingPrayerAssignments,
  savePrayerRotationConfig,
  type PrayerRotationPoolMember,
  type PrayerSlotType,
} from "@/lib/prayer-rotation-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canManageAsAdmin(user))) {
    return { error: NextResponse.json({ error: "Admin Group access required." }, { status: 403 }) };
  }

  return { user };
}

function parseSlotType(value: unknown): PrayerSlotType | null {
  return value === "evening" ? "evening" : value === "morning" ? "morning" : null;
}

function parsePool(value: unknown): PrayerRotationPoolMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = entry as { userId?: string; name?: string };
      if (!row.userId?.trim() || !row.name?.trim()) return null;
      return { userId: row.userId.trim(), name: row.name.trim() };
    })
    .filter((entry): entry is PrayerRotationPoolMember => Boolean(entry));
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const slotType = parseSlotType(searchParams.get("slot"));
  if (!slotType) {
    return NextResponse.json({ error: "slot=morning or slot=evening is required." }, { status: 400 });
  }

  const [config, assignments, people] = await Promise.all([
    getPrayerRotationConfig(slotType),
    listUpcomingPrayerAssignments(slotType),
    getAdminPeopleDirectory(auth.user!.id),
  ]);

  return NextResponse.json({
    config,
    assignments,
    members: people.map((person) => ({ id: person.id, name: person.name })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const slotType = parseSlotType(body.slotType ?? body.slot);
  if (!slotType) {
    return NextResponse.json({ error: "slotType is required." }, { status: 400 });
  }

  const action = String(body.action ?? "save_config");

  try {
    if (action === "generate") {
      const result = await generatePrayerSchedule({
        slotType,
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
        assignments: result.created,
      });
    }

    if (action === "approve") {
      const result = await approveAndNotifyPrayerSchedule({
        slotType,
        actor: { id: auth.user!.id, name: auth.user!.name },
      });

      return NextResponse.json({
        ok: true,
        config: result.config,
        assignments: result.assignments,
        notify: result.notify,
      });
    }

    const config = await savePrayerRotationConfig({
      slotType,
      pool: parsePool(body.pool),
      rotationIndex: body.rotationIndex !== undefined ? Number(body.rotationIndex) : undefined,
      skipDates: Array.isArray(body.skipDates)
        ? body.skipDates.map((entry: unknown) => String(entry).trim()).filter(Boolean)
        : undefined,
      weeksAhead: body.weeksAhead !== undefined ? Number(body.weeksAhead) : undefined,
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update prayer schedule." },
      { status: 400 },
    );
  }
}
