"use client";

type WorshipSongBreakdownLyricsProps = {
  title: string;
  lyrics?: string;
};

export function WorshipSongBreakdownLyrics({ title, lyrics }: WorshipSongBreakdownLyricsProps) {
  if (!lyrics?.trim()) {
    return null;
  }

  return (
    <details className="mt-3 rounded-xl border border-night-900/5 bg-white/80 px-3 py-2 open:pb-3">
      <summary className="cursor-pointer text-sm font-semibold text-violet-800 hover:underline">
        View full lyrics — {title}
      </summary>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-night-800">{lyrics.trim()}</p>
    </details>
  );
}
