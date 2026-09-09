import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createGroupResourceForUser,
  deleteGroupResourceForUser,
  listGroupResources,
  updateGroupResourceForUser,
} from "@/lib/group-resource-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  try {
    const resources = await listGroupResources(groupId, user);
    return NextResponse.json({ resources });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load resources." },
      { status: error instanceof Error && error.message.includes("Sign in") ? 401 : 403 },
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
  const action = String(body.action ?? "create");

  try {
    if (action === "delete") {
      await deleteGroupResourceForUser(user, String(body.id ?? ""));
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const resource = await updateGroupResourceForUser(user, String(body.id ?? ""), {
        title: body.title ? String(body.title) : undefined,
        description: body.description !== undefined ? String(body.description) : undefined,
        url: body.url !== undefined ? String(body.url) : undefined,
        category: body.category ? String(body.category) : undefined,
      });
      return NextResponse.json({ resource });
    }

    const resource = await createGroupResourceForUser(user, {
      groupId: String(body.groupId ?? ""),
      title: String(body.title ?? ""),
      description: body.description ? String(body.description) : undefined,
      url: body.url ? String(body.url) : undefined,
      category: body.category ? String(body.category) : undefined,
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save resource." },
      { status: 400 },
    );
  }
}
