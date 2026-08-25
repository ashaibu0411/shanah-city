import { NextResponse } from "next/server";
import type { ArtworkVariant } from "@/lib/content-artwork";
import { getDevotionById } from "@/lib/devotion-server";
import {
  buildDevotionThumbnailSvg,
  buildGenericDevotionThumbnailSvg,
} from "@/lib/devotion-thumbnail-svg";

function parseVariant(value: string | null): ArtworkVariant {
  if (value === "wide" || value === "banner") return value;
  return "square";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") ?? "").trim();
  const variant = parseVariant(searchParams.get("variant"));

  let svg = buildGenericDevotionThumbnailSvg(variant);
  let cacheTag = "generic";

  if (id) {
    const devotion = await getDevotionById(id);
    if (devotion && devotion.published !== false) {
      svg = buildDevotionThumbnailSvg(
        {
          id: devotion.id,
          title: devotion.title,
          reference: devotion.reference,
          date: devotion.date,
        },
        variant,
      );
      cacheTag = devotion.updatedAt ?? devotion.id;
    }
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      ETag: `"devotion-thumb-${variant}-${cacheTag}"`,
    },
  });
}
