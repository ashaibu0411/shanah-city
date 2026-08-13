import type { StreamPreview } from "@/lib/types";
import { getInAppEmbedUrl } from "@/lib/live-config";

type LiveVideoPlayerProps = {
  preview: StreamPreview;
  title?: string;
  className?: string;
};

export function LiveVideoPlayer({
  preview,
  title,
  className = "aspect-video w-full bg-black",
}: LiveVideoPlayerProps) {
  const embedUrl = getInAppEmbedUrl(preview);

  if (!embedUrl) return null;

  return (
    <div className={className}>
      <iframe
        src={embedUrl}
        title={title ?? `${preview.platform} · ${preview.label}`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
