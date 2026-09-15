import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  isStoryReactionKind,
} from "@/lib/community-story-reactions";
import { toggleCommunityStatusReaction } from "@/lib/community-status-reaction-server";
import { deleteCommunityStatus } from "@/lib/community-status-server";
import type { CommunityStoryReactionKind } from "@/lib/member-types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage stories." }, { status: 401 });
  }

  const { id } = await context.params;
  const statusId = String(id ?? "").trim();
  if (!statusId) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  try {
    const result = await deleteCommunityStatus({
      id: statusId,
      authorId: user.id,
    });

    if (result === "forbidden") {
      return NextResponse.json({ error: "You can only delete your own stories." }, { status: 403 });
    }

    if (!result) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete story.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to react." }, { status: 401 });
  }

  const { id: statusId } = await context.params;
  const body = (await request.json()) as { kind?: string };
  const kind = String(body.kind ?? "") as CommunityStoryReactionKind;

  if (!isStoryReactionKind(kind)) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  try {
    const result = await toggleCommunityStatusReaction({
      statusId,
      userId: user.id,
      kind,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not react.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
