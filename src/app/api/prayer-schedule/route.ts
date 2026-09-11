import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  groupAssignmentsByUser,
  listUpcomingPrayerAssignments,
} from "@/lib/prayer-rotation-server";
import {
  SCHEDULE_SLOT_META,
  SCHEDULE_SLOT_TYPES,
  type ScheduleSlotType,
} from "@/lib/prayer-schedule-types";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const since = new Date().toISOString().slice(0, 10);
  const allAssignments = await Promise.all(
    SCHEDULE_SLOT_TYPES.map((slotType) => listUpcomingPrayerAssignments(slotType)),
  );

  const bySlot = Object.fromEntries(
    SCHEDULE_SLOT_TYPES.map((slotType, index) => [slotType, allAssignments[index]]),
  ) as Record<ScheduleSlotType, Awaited<ReturnType<typeof listUpcomingPrayerAssignments>>>;

  const mine = Object.fromEntries(
    SCHEDULE_SLOT_TYPES.map((slotType) => [
      slotType,
      bySlot[slotType].filter(
        (entry) =>
          entry.status === "published" &&
          entry.userId === user.id &&
          entry.assignmentDate >= since,
      ),
    ]),
  ) as Record<ScheduleSlotType, (typeof bySlot)[ScheduleSlotType]>;

  const team = Object.fromEntries(
    SCHEDULE_SLOT_TYPES.map((slotType) => [
      slotType,
      bySlot[slotType].filter(
        (entry) => entry.status === "published" && entry.assignmentDate >= since,
      ),
    ]),
  ) as Record<ScheduleSlotType, (typeof bySlot)[ScheduleSlotType]>;

  const grouped = Object.fromEntries(
    SCHEDULE_SLOT_TYPES.map((slotType) => [slotType, groupAssignmentsByUser(mine[slotType])]),
  ) as Record<ScheduleSlotType, ReturnType<typeof groupAssignmentsByUser>>;

  return NextResponse.json({
    mine,
    grouped,
    team,
    labels: SCHEDULE_SLOT_META,
  });
}
