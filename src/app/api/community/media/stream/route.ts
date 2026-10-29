import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { isAllowedCommunityStreamPathname } from "@/lib/community-blob";
import { fetchCommunityMediaBlob } from "@/lib/community-media-stream-server";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: "Sign in to play community media." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rate = await enforceRateLimit(`community-media-stream:${ip}`, {
    limit: 400,
    windowSeconds: 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  const { searchParams } = new URL(request.url);
  const pathname = (searchParams.get("pathname") ?? "").trim().replace(/^\/+/, "");
  if (!isAllowedCommunityStreamPathname(pathname)) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 403 });
  }

  try {
    return await fetchCommunityMediaBlob(pathname);
  } catch {
    return NextResponse.json({ error: "Could not stream media." }, { status: 502 });
  }
}
