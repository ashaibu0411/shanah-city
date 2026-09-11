import { NextResponse } from "next/server";
import type { ArtworkVariant } from "@/lib/content-artwork";
import { getDevotionById } from "@/lib/devotion-server";
import {
  buildDevotionCoverSvg,
  buildDevotionThumbnailSvg,
  buildGenericDevotionCoverSvg,
  buildGenericDevotionThumbnailSvg,
} from "@/lib/devotion-thumbnail-svg";

function parseVariant(value: string | null): ArtworkVariant {
  if (value === "wide" || value === "banner") return value;
  return "square";
}

function parseStyle(value: string | null) {
  return value === "card" ? "card" : "cover";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") ?? "").trim();
  const variant = parseVariant(searchParams.get("variant"));
  const style = parseStyle(searchParams.get("style"));

  let svg =
    style === "cover"
      ? buildGenericDevotionCoverSvg(variant)
      : buildGenericDevotionThumbnailSvg(variant);
  let cacheTag = "generic";

  if (id) {
    const devotion = await getDevotionById(id);
    if (devotion && devotion.published !== false) {
      const input = {
        id: devotion.id,
        title: devotion.title,
        reference: devotion.reference,
        date: devotion.date,
      };
      svg =
        style === "cover"
          ? buildDevotionCoverSvg(input, variant)
          : buildDevotionThumbnailSvg(input, variant);
      cacheTag = devotion.updatedAt ?? devotion.id;
    }
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      ETag: `"devotion-${style}-${variant}-${cacheTag}-v2"`,
    },
  });
}
