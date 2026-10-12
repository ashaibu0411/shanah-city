import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  buildChoirWorshipEventDetailPayload,
  buildChoirWorshipEventsHomePayload,
  getChoirWorshipEventGuidelines,
  handleChoirWorshipEventsAction,
  listChoirWorshipEventCards,
  listChoirWorshipEventRegistrations,
  listChoirWorshipEventTeamOpportunities,
} from "@/lib/choir-events-server";

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
    const payload = await buildChoirWorshipEventsHomePayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "list") {
    const mode = searchParams.get("mode")?.trim() as "upcoming" | "past" | "featured" | "all" | undefined;
    const cards = await listChoirWorshipEventCards(user, groupId, {
      mode: mode ?? "upcoming",
      query: searchParams.get("q")?.trim(),
      category: searchParams.get("category")?.trim(),
      registration: searchParams.get("registration")?.trim(),
    });
    if (!cards) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ events: cards });
  }

  if (view === "registrations") {
    const registrations = await listChoirWorshipEventRegistrations(user, groupId);
    if (!registrations) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ registrations });
  }

  if (view === "teams") {
    const opportunities = await listChoirWorshipEventTeamOpportunities(user, groupId);
    if (!opportunities) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ opportunities });
  }

  if (view === "guidelines") {
    const markdown = await getChoirWorshipEventGuidelines(user, groupId);
    if (!markdown) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ guidelines: { markdown } });
  }

  if (view === "detail") {
    const eventId = searchParams.get("eventId")?.trim();
    if (!eventId) return NextResponse.json({ error: "Event required." }, { status: 400 });
    const payload = await buildChoirWorshipEventDetailPayload(user, groupId, eventId);
    if (!payload) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ payload });
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
    const result = await handleChoirWorshipEventsAction(user, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
