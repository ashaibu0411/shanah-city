import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirAvailabilityTabId } from "@/lib/choir-availability-types";
import {
  buildChoirAvailabilityCalendarMonth,
  buildChoirAvailabilityHomePayload,
  buildChoirMySchedulePayload,
  buildChoirTeamAvailabilityDashboard,
  getChoirAvailabilityGuidelines,
  getChoirAvailabilityPreferences,
  getChoirAvailabilitySchedulePayload,
  handleChoirAvailabilityAction,
  listChoirAvailabilityOpportunities,
} from "@/lib/choir-availability-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const view = searchParams.get("view")?.trim() ?? "home";

  if (view === "home") {
    try {
      const payload = await buildChoirAvailabilityHomePayload(user, groupId);
      if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
      return NextResponse.json({ payload });
    } catch (error) {
      console.error("[choir-availability:home]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load availability." },
        { status: 500 },
      );
    }
  }

  if (view === "opportunities") {
    const tab = (searchParams.get("tab")?.trim() ?? "upcoming") as ChoirAvailabilityTabId;
    const category = searchParams.get("category")?.trim();
    const status = searchParams.get("status")?.trim();
    const opportunities = await listChoirAvailabilityOpportunities(user, groupId, tab, {
      category,
      status,
    });
    if (!opportunities) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ opportunities });
  }

  if (view === "schedule") {
    const schedule = await getChoirAvailabilitySchedulePayload(user, groupId);
    if (!schedule) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ schedule });
  }

  if (view === "my_schedule") {
    try {
      const mySchedule = await buildChoirMySchedulePayload(user, groupId);
      if (!mySchedule) return NextResponse.json({ error: "Access denied." }, { status: 403 });
      return NextResponse.json({ mySchedule });
    } catch (error) {
      console.error("[choir-availability:my_schedule]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load your schedule." },
        { status: 500 },
      );
    }
  }

  if (view === "calendar") {
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return NextResponse.json({ error: "Year and month required." }, { status: 400 });
    }
    const calendar = await buildChoirAvailabilityCalendarMonth(user, groupId, year, month);
    if (!calendar) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ calendar });
  }

  if (view === "preferences") {
    const preferences = await getChoirAvailabilityPreferences(user, groupId);
    if (!preferences) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ preferences });
  }

  if (view === "guidelines") {
    const guidelines = await getChoirAvailabilityGuidelines(user, groupId);
    if (!guidelines) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ guidelines });
  }

  if (view === "team_dashboard") {
    try {
      const dashboard = await buildChoirTeamAvailabilityDashboard(user, groupId);
      return NextResponse.json({ dashboard });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Access denied." },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await handleChoirAvailabilityAction(user, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
