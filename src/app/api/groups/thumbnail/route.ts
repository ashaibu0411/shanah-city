import { NextResponse } from "next/server";
import type { ArtworkVariant } from "@/lib/content-artwork";
import { getGroups } from "@/lib/group-server";
import {
  buildGenericGroupThumbnailSvg,
  buildGroupThumbnailSvg,
} from "@/lib/group-thumbnail-svg";

function parseVariant(value: string | null): ArtworkVariant {
  if (value === "wide" || value === "banner") return value;
  return "square";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") ?? "").trim();
  const variant = parseVariant(searchParams.get("variant"));

  let svg = buildGenericGroupThumbnailSvg(variant);
  let cacheTag = "generic";

  if (id) {
    const groups = await getGroups();
    const group = groups.find((entry) => entry.id === id);
    if (group) {
      svg = buildGroupThumbnailSvg(
        {
          id: group.id,
          name: group.name,
          category: group.category,
          description: group.description,
        },
        variant,
      );
      cacheTag = group.updatedAt ?? group.id;
    }
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      ETag: `"group-thumb-${variant}-${cacheTag}"`,
    },
  });
}
