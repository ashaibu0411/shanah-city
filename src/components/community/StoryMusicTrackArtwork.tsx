"use client";

type StoryMusicTrackArtworkProps = {
  title: string;
  artist: string;
  trackId: string;
  size?: "sm" | "md";
  className?: string;
};

function hueFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function StoryMusicTrackArtwork({
  title,
  artist,
  trackId,
  size = "sm",
  className = "",
}: StoryMusicTrackArtworkProps) {
  const hue = hueFromId(trackId);
  const dim = size === "md" ? "h-12 w-12 text-lg" : "h-9 w-9 text-base";
  const initial = (title.trim()[0] || artist.trim()[0] || "♪").toUpperCase();

  return (
    <div
      className={`${dim} shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-clay-500/90 to-night-800 shadow-inner ring-1 ring-black/10 dark:ring-white/15 ${className}`}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 45% 42%) 0%, hsl(${(hue + 40) % 360} 35% 28%) 100%)`,
      }}
      aria-hidden
    >
      <span className="flex h-full w-full items-center justify-center font-serif font-bold text-white/95">
        {initial}
      </span>
    </div>
  );
}
