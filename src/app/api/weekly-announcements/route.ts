import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageChurchEvents } from "@/lib/group-permissions-server";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { getDenverWeekRange, addDaysToDateKey } from "@/lib/denver-time";
import { getEvents } from "@/lib/event-server";
import { getDatesInMonth, isPrivateChurchCalendarEvent } from "@/lib/calendar-utils";

function selectedWeek(offset: number) {
  const current = getDenverWeekRange().since;
  const since = addDaysToDateKey(current, offset * 7);
  return { since, until: addDaysToDateKey(since, 6) };
}

async function canEdit() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return canManageChurchEvents(await getUserFromSession(token));
}

function churchEventsForWeek(events: Awaited<ReturnType<typeof getEvents>>, since: string, until: string) {
  const [year, month] = since.split("-").map(Number);
  const [endYear, endMonth] = until.split("-").map(Number);
  const months: Array<[number, number]> = [[year, month - 1]];
  if (month !== endMonth || year !== endYear) months.push([endYear, endMonth - 1]);
  const items: Array<{ id: string; title: string; date: string; time: string; location: string }> = [];
  for (const event of events) {
    if (event.published === false || isPrivateChurchCalendarEvent(event)) continue;
    for (const [y, m] of months) {
      for (const date of getDatesInMonth(event, y, m)) {
        if (date >= since && date <= until) {
          items.push({ id: event.id, title: event.title, date, time: event.time, location: event.location });
        }
      }
    }
  }
  return items.sort((a,b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)).slice(0, 30);
}

export async function GET(request: NextRequest) {
  const offset = request.nextUrl.searchParams.get("offset") === "1" ? 1 : 0;
  const { since, until } = selectedWeek(offset);
  const [canManage, events, bulletin] = await Promise.all([
    canEdit(),
    getEvents({ groupId: null }),
    useDatabase() ? prisma.weeklyBulletin.findUnique({ where: { weekStart: since } }) : Promise.resolve(null),
  ]);
  return NextResponse.json({
    weekStart: since,
    weekEnd: until,
    canManage,
    bulletin: bulletin && (bulletin.published || canManage)
      ? { title: bulletin.title, body: bulletin.body, published: bulletin.published }
      : null,
    events: churchEventsForWeek(events, since, until),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!(await canEdit())) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  if (!useDatabase()) return NextResponse.json({ error: "Bulletin storage is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const offset = body.offset === 1 ? 1 : 0;
  const weekStart = selectedWeek(offset).since;
  const title = String(body.title ?? "").trim().slice(0, 180);
  const content = String(body.body ?? "").trim().slice(0, 6000);
  const published = body.published !== false;
  if (!title && published) return NextResponse.json({ error: "Enter a bulletin title." }, { status: 400 });
  if (!content && published) return NextResponse.json({ error: "Enter at least one announcement." }, { status: 400 });
  await prisma.weeklyBulletin.upsert({
    where: { weekStart },
    create: { weekStart, title: title || "Weekly announcements", body: content, published },
    update: { title: title || "Weekly announcements", body: content, published },
  });
  return NextResponse.json({ ok: true });
}
