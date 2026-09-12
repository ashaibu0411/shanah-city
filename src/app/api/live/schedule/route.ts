import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canPublishMediaClips } from "@/lib/group-permissions-server";
import type { LiveStreamPlatform } from "@/lib/live-schedule-types";
import {
  clearLiveStreamSchedule,
  getLiveStreamSchedules,
  getPublicLiveStreamSchedule,
  getUpcomingLiveStreamSchedules,
  saveLiveStreamSchedule,
} from "@/lib/live-schedule-server";

const PLATFORMS = new Set<LiveStreamPlatform>([
  "all",
  "youtube",
  "facebook-city",
  "facebook-revival",
]);

function parsePlatform(value: unknown): LiveStreamPlatform | undefined {
  const platform = String(value ?? "all") as LiveStreamPlatform;
  return PLATFORMS.has(platform) ? platform : undefined;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const canManage = await canPublishMediaClips(user);
  const [publicSchedule, schedules] = await Promise.all([
    getPublicLiveStreamSchedule(),
    getUpcomingLiveStreamSchedules(),
  ]);

  const managedSchedules = canManage ? await getLiveStreamSchedules() : null;
  const managedSchedule = managedSchedules?.[0] ?? null;

  return NextResponse.json({
    schedule: publicSchedule.schedule,
    livePhase: publicSchedule.livePhase,
    schedules,
    managedSchedule,
    managedSchedules,
    canManage,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canPublishMediaClips(user))) {
    return NextResponse.json(
      { error: "Only media team members or Admin Group can schedule livestreams." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const action = String(body.action ?? "save");
  const scheduleId = body.id ? String(body.id).trim() : undefined;

  if (action === "clear") {
    await clearLiveStreamSchedule(scheduleId);
    revalidatePath("/");
    revalidatePath("/live");
    const [publicSchedule, schedules] = await Promise.all([
      getPublicLiveStreamSchedule(),
      getUpcomingLiveStreamSchedules(),
    ]);
    return NextResponse.json({
      ok: true,
      schedule: publicSchedule.schedule,
      livePhase: publicSchedule.livePhase,
      schedules,
      managedSchedules: await getLiveStreamSchedules(),
    });
  }

  const title = String(body.title ?? "Shanah City Worship").trim();
  const startsAt = String(body.startsAt ?? "").trim();
  const platform = parsePlatform(body.platform);
  const notifyEnabled = Boolean(body.notifyEnabled);
  const notifyBody = body.notifyBody ? String(body.notifyBody).trim() : undefined;

  if (!title || !startsAt) {
    return NextResponse.json({ error: "Title and start time are required." }, { status: 400 });
  }

  try {
    const saved = await saveLiveStreamSchedule({
      id: scheduleId,
      title,
      startsAt,
      platform,
      notifyEnabled,
      notifyBody,
      createdBy: user.id,
      createdByName: user.name,
    });
    revalidatePath("/");
    revalidatePath("/live");
    const [publicSchedule, schedules] = await Promise.all([
      getPublicLiveStreamSchedule(),
      getUpcomingLiveStreamSchedules(),
    ]);
    return NextResponse.json({
      schedule: publicSchedule.schedule,
      livePhase: publicSchedule.livePhase,
      schedules,
      managedSchedules: await getLiveStreamSchedules(),
      saved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save schedule." },
      { status: 400 },
    );
  }
}
