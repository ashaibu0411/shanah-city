import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getStoryDmPreview } from "@/lib/story-dm-server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view this story." }, { status: 401 });
  }

  const { id } = await context.params;
  const statusId = String(id ?? "").trim();
  if (!statusId) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  const preview = await getStoryDmPreview(statusId);
  if (!preview) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  return NextResponse.json({ preview });
}
