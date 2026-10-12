import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirResourceTabId } from "@/lib/choir-resource-types";
import {
  buildChoirResourceHomePayload,
  handleChoirResourceAction,
  listChoirResourceCards,
  listChoirResourceRequestsForLeader,
  listChoirResourceRequestsForMember,
} from "@/lib/choir-resource-server";

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
    const payload = await buildChoirResourceHomePayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "list") {
    const tab = searchParams.get("tab")?.trim() as ChoirResourceTabId | undefined;
    const query = searchParams.get("q")?.trim();
    const cards = await listChoirResourceCards(user, groupId, { tab, query });
    if (!cards) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ resources: cards });
  }

  if (view === "my_requests") {
    try {
      const requests = await listChoirResourceRequestsForMember(user, groupId);
      return NextResponse.json({ requests });
    } catch {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
  }

  if (view === "leader_requests") {
    try {
      const requests = await listChoirResourceRequestsForLeader(user, groupId);
      return NextResponse.json({ requests });
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
    const result = await handleChoirResourceAction(user, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
