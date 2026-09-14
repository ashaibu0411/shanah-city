import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { addStoryReply } from "@/lib/community-status-insights-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to reply." }, { status: 401 });
  }

  const { id } = await context.params;
  const statusId = String(id ?? "").trim();
  if (!statusId) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  const body = (await request.json()) as { content?: string };
  const content = String(body.content ?? "").trim();

  try {
    const reply = await addStoryReply({
      statusId,
      authorId: user.id,
      authorName: getPublicDisplayName(user),
      content,
    });
    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reply.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
