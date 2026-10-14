"use client";

import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import type { SermonVideo } from "@/lib/youtube-sermons-server";

export function SermonCardMedia({
  video,
  title,
  thumbnail,
  compact,
}: {
  video: SermonVideo;
  title: string;
  thumbnail: string;
  compact?: boolean;
}) {
  return (
    <SermonMediaPanel video={video} title={title} thumbnail={thumbnail} compact={compact} className="min-h-[220px] md:min-h-[280px]" />
  );
}
