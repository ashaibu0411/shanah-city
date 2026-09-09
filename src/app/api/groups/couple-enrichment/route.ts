import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createEnrichmentModuleForLeader,
  deleteEnrichmentModuleForLeader,
  getEnrichmentPanelData,
  toggleEnrichmentProgress,
} from "@/lib/couple-enrichment-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  try {
    const data = await getEnrichmentPanelData(groupId, user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load growth track." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "");
  const action = String(body.action ?? "toggle");

  try {
    if (action === "create") {
      const data = await createEnrichmentModuleForLeader(user, {
        groupId,
        title: String(body.title ?? ""),
        description: body.description ? String(body.description) : undefined,
      });
      return NextResponse.json(data, { status: 201 });
    }

    if (action === "delete") {
      const data = await deleteEnrichmentModuleForLeader(
        user,
        groupId,
        String(body.moduleId ?? ""),
      );
      return NextResponse.json(data);
    }

    const data = await toggleEnrichmentProgress(
      user,
      groupId,
      String(body.moduleId ?? ""),
      body.completed === true,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save growth track." },
      { status: 400 },
    );
  }
}
