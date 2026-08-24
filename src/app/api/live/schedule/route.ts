import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canPublishMediaClips } from "@/lib/group-permissions-server";
import type { LiveStreamPlatform } from "@/lib/live-schedule-types";
import {
  clearLiveStreamSchedule,
  getLiveStreamSchedule,
  getUpcomingLiveStreamSchedule,
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
  const [schedule, canManage] = await Promise.all([
    getUpcomingLiveStreamSchedule(),
    canPublishMediaClips(user),
  ]);

  const managedSchedule = canManage ? await getLiveStreamSchedule() : null;

  return NextResponse.json({ schedule, managedSchedule, canManage });
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

  if (action === "clear") {
    await clearLiveStreamSchedule();
    revalidatePath("/");
    revalidatePath("/live");
    return NextResponse.json({ ok: true, schedule: null });
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
    const schedule = await saveLiveStreamSchedule({
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
    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save schedule." },
      { status: 400 },
    );
  }
}
