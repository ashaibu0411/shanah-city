import Image from "next/image";
import { worshipSongThumbnailUrl } from "@/lib/choir-setlist-utils";

type SetlistSongThumbnailProps = {
  youtubeVideoId?: string | null;
  title: string;
};

export function SetlistSongThumbnail({ youtubeVideoId, title }: SetlistSongThumbnailProps) {
  const src = worshipSongThumbnailUrl({ youtubeVideoId });
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={52}
        height={52}
        className="choir-setlist-thumb-img"
        unoptimized
      />
    );
  }

  return (
    <span className="choir-setlist-thumb-placeholder" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z"
        />
      </svg>
    </span>
  );
}
