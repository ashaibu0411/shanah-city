export {
  type ArtworkVariant,
  type ArtworkFields,
  ARTWORK_VARIANTS,
  artworkField as devotionArtworkField,
  getContentArtwork,
} from "@/lib/content-artwork";

import type { ArtworkFields, ArtworkVariant } from "@/lib/content-artwork";
import { getContentArtwork } from "@/lib/content-artwork";

/** Card/thumbnail with title baked in — push and social previews. */
export function getDevotionArtwork(
  record: ArtworkFields & { id: string },
  prefer: ArtworkVariant = "wide",
) {
  return (
    getContentArtwork(record, prefer) ??
    `/api/devotions/thumbnail?id=${encodeURIComponent(record.id)}&variant=${prefer}&style=card`
  );
}

/** Text-free cover art for in-app lists and readers (1920×1080 / 1024×1024). */
export function getDevotionCoverArtwork(
  record: ArtworkFields & { id: string },
  prefer: ArtworkVariant = "wide",
) {
  return (
    getContentArtwork(record, prefer) ??
    `/api/devotions/thumbnail?id=${encodeURIComponent(record.id)}&variant=${prefer}&style=cover`
  );
}
