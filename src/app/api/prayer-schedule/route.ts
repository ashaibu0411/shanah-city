import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  groupAssignmentsByUser,
  listUpcomingPrayerAssignments,
} from "@/lib/prayer-rotation-server";
import {
  PRAYER_SLOT_META,
  type PrayerSlotType,
} from "@/lib/prayer-schedule-types";

function parseSlotType(value: string | null): PrayerSlotType | null {
  return value === "evening" ? "evening" : value === "morning" ? "morning" : null;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slotType = parseSlotType(searchParams.get("slot"));
  const since = new Date().toISOString().slice(0, 10);

  const [morning, evening] = await Promise.all([
    listUpcomingPrayerAssignments("morning"),
    listUpcomingPrayerAssignments("evening"),
  ]);

  const filterPublishedForUser = (slot: PrayerSlotType) =>
    (slot === slotType ? (slotType === "morning" ? morning : evening) : slot === "morning" ? morning : evening)
      .filter((entry) => entry.status === "published" && entry.userId === user.id && entry.assignmentDate >= since);

  const mine = {
    morning: filterPublishedForUser("morning"),
    evening: filterPublishedForUser("evening"),
  };

  const team = {
    morning: morning.filter((entry) => entry.status === "published" && entry.assignmentDate >= since),
    evening: evening.filter((entry) => entry.status === "published" && entry.assignmentDate >= since),
  };

  return NextResponse.json({
    mine,
    grouped: {
      morning: groupAssignmentsByUser(mine.morning),
      evening: groupAssignmentsByUser(mine.evening),
    },
    team,
    labels: PRAYER_SLOT_META,
  });
}
