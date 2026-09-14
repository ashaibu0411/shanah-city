import { NextResponse } from "next/server";
import { normalizeStorySocialLink } from "@/lib/community-story-link-shared";
import { resolveStoryLinkPreview } from "@/lib/community-story-link-preview-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = String(searchParams.get("url") ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing url." }, { status: 400 });
  }

  try {
    const { url } = normalizeStorySocialLink(raw);
    const preview = await resolveStoryLinkPreview(url);
    return NextResponse.json({ preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load link preview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
