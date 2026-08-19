import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageChurchEvents } from "@/lib/group-permissions-server";
import {
  isOutlookCalendarConfigured,
  syncOutlookChurchCalendar,
} from "@/lib/outlook-calendar-sync";

export async function GET() {
  return NextResponse.json({ configured: isOutlookCalendarConfigured() });
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json(
      { error: "Admin Group access required to sync Outlook." },
      { status: 403 },
    );
  }

  if (!isOutlookCalendarConfigured()) {
    return NextResponse.json(
      {
        error:
          "Outlook is not connected yet. Add OUTLOOK_CALENDAR_ICS_URL in Vercel from the published ICS link on admin@shanahcity.org.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await syncOutlookChurchCalendar();
    revalidatePath("/calendar");
    revalidatePath("/");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Outlook sync failed." },
      { status: 400 },
    );
  }
}
