import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPostReactionInsights } from "@/lib/community-post-reaction-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to see who reacted." }, { status: 401 });
  }

  const { id } = await context.params;
  const postId = String(id ?? "").trim();
  if (!postId) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  try {
    const reactions = await getPostReactionInsights(postId);
    return NextResponse.json({ reactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load reactions.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
