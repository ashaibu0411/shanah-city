import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { deleteCommunityStatus } from "@/lib/community-status-server";

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
