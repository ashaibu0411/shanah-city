import { NextResponse } from "next/server";
import { searchCommunityStoryMusic } from "@/lib/community-story-music";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const region = searchParams.get("region") ?? "all";
  const tracks = searchCommunityStoryMusic(q, 56, region);
  return NextResponse.json({ tracks });
}
