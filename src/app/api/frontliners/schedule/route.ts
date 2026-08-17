import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canAccessFrontLiners,
  canManageFrontLiners,
  getConfiguredFrontLinersGroupId,
} from "@/lib/frontliners-access-server";
import {
  cloneUsherScheduleContent,
  serviceDateTimeLabel,
  USHER_SERVICE_TIMES,
  type UsherAssignment,
  type UsherSchedule,
} from "@/lib/frontliners-types";
import {
  deleteUsherSchedule,
  findPreviousUsherSchedule,
  getUsherSchedule,
  listUsherSchedules,
  saveUsherSchedule,
} from "@/lib/usher-schedule-server";
import { getGroupDetail } from "@/lib/group-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

async function requireFrontLinersAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canAccessFrontLiners(user))) {
    return {
      error: NextResponse.json(
        {
          error: "Join FrontLiners under Groups to access the usher schedule.",
        },
        { status: 403 },
      ),
    };
  }

  return { user };
}

function parseUshers(body: Record<string, unknown>): UsherAssignment[] {
  if (!Array.isArray(body.ushers)) return [];
  return body.ushers as UsherAssignment[];
}

function canViewSchedule(
  userId: string,
  canManage: boolean,
  schedule: { status: string; ushers: UsherAssignment[] },
) {
  if (canManage) return true;
  if (schedule.status !== "published") return false;
  return schedule.ushers.some((usher) => usher.userId === userId);
}

export async function GET(request: Request) {
  const auth = await requireFrontLinersAccess();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const serviceDate = searchParams.get("serviceDate") ?? undefined;
  const serviceTime = searchParams.get("serviceTime") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const roster = searchParams.get("roster") === "1";
  const canManage = await canManageFrontLiners(auth.user!);

  if (roster) {
    if (!canManage) {
      return NextResponse.json({ error: "FrontLiners leader access required." }, { status: 403 });
    }
    const group = await getGroupDetail(getConfiguredFrontLinersGroupId(), auth.user!.id);
    return NextResponse.json({
      members: group?.members ?? [],
      roles: [
        { value: "lead", label: "Usher lead" },
        { value: "usher", label: "Usher" },
        { value: "greeter", label: "Greeter" },
      ],
      serviceTimes: USHER_SERVICE_TIMES,
    });
  }

  if (serviceDate && serviceTime) {
    const schedule = await getUsherSchedule(serviceDate, serviceTime);
    if (!schedule) {
      return NextResponse.json({ schedule: null, canManage });
    }

    if (!canViewSchedule(auth.user!.id, canManage, schedule)) {
      return NextResponse.json({ schedule: null, canManage, hidden: true });
    }

    return NextResponse.json({ schedule, canManage });
  }

  const schedules = await listUsherSchedules({ since });
  const visible = schedules.filter((schedule: UsherSchedule) =>
    canViewSchedule(auth.user!.id, canManage, schedule),
  );

  return NextResponse.json({ schedules: visible, canManage });
}

export async function POST(request: Request) {
  const auth = await requireFrontLinersAccess();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");
  const serviceDate = String(body.serviceDate ?? "").trim();
  const serviceTime = String(body.serviceTime ?? "").trim();

  if (!serviceDate || !serviceTime) {
    return NextResponse.json({ error: "Service date and time are required." }, { status: 400 });
  }

  const canManage = await canManageFrontLiners(auth.user!);
  if (!canManage) {
    return NextResponse.json({ error: "FrontLiners leader access required." }, { status: 403 });
  }

  if (action === "delete") {
    const removed = await deleteUsherSchedule(serviceDate, serviceTime);
    if (!removed) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "copy_from_previous") {
    const source = await findPreviousUsherSchedule(serviceDate, serviceTime);
    if (!source) {
      return NextResponse.json(
        { error: "No previous usher schedule found for this time slot." },
        { status: 404 },
      );
    }

    const cloned = cloneUsherScheduleContent(source);
    const schedule = await saveUsherSchedule({
      serviceDate,
      serviceTime,
      ushers: cloned.ushers,
      notes: cloned.notes,
      status: "draft",
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({
      schedule,
      copiedFrom: serviceDateTimeLabel(source.serviceDate, source.serviceTime),
    });
  }

  let status: "draft" | "published" = "draft";
  if (action === "publish") {
    status = "published";
  } else if (action === "unpublish") {
    status = "draft";
  } else if (body.status === "published") {
    status = "published";
  }

  const schedule = await saveUsherSchedule({
    serviceDate,
    serviceTime,
    ushers: parseUshers(body),
    notes: body.notes ? String(body.notes).trim() : undefined,
    status,
    actor: { id: auth.user!.id, name: auth.user!.name },
  });

  return NextResponse.json({ schedule });
}
