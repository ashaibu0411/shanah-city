"use client";

import { useMemo, useState } from "react";
import {
  inferWorshipAudioContentType,
  resolveWorshipAudioUrl,
} from "@/lib/worship-audio-shared";

type WorshipAudioPlayerProps = {
  src: string;
  fileName?: string;
  className?: string;
};

export function WorshipAudioPlayer({ src, fileName, className }: WorshipAudioPlayerProps) {
  const resolvedSrc = useMemo(() => resolveWorshipAudioUrl(src), [src]);
  const contentType = inferWorshipAudioContentType(fileName ?? src);
  const [failed, setFailed] = useState(false);

  if (!resolvedSrc) return null;

  return (
    <div>
      <audio
        key={resolvedSrc}
        controls
        preload="metadata"
        playsInline
        className={className}
        onError={() => setFailed(true)}
        onLoadedData={() => setFailed(false)}
      >
        <source src={resolvedSrc} type={contentType} />
        <source src={resolvedSrc} />
      </audio>
      {failed && (
        <p className="mt-1 text-xs leading-relaxed text-red-600">
          This track could not play here. If it was recorded on another phone, try opening on
          Android/desktop or re-record / upload as m4a or mp3 (iPhone often cannot play webm).
        </p>
      )}
    </div>
  );
}
