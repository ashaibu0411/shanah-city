import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getStoryInsightsForAuthor } from "@/lib/community-status-insights-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view story responses." }, { status: 401 });
  }

  const { id } = await context.params;
  const statusId = String(id ?? "").trim();
  if (!statusId) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  try {
    const insights = await getStoryInsightsForAuthor({
      statusId,
      authorId: user.id,
    });
    return NextResponse.json(insights);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load responses.";
    const status = message.includes("author") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
