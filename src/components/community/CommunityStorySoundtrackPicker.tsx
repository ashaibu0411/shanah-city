"use client";

import { useEffect, useState } from "react";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";
import { CommunityStoryMusicPicker } from "@/components/community/CommunityStoryMusicPicker";
import { CommunityStoryMemberAudioPanel } from "@/components/community/CommunityStoryMemberAudioPanel";

export type StorySoundtrackMode =
  | "none"
  | "youtube"
  | "member-record"
  | "member-upload"
  | "free-worship"
  | "library";

type CommunityStorySoundtrackPickerProps = {
  allowMemberOverlay: boolean;
  selectedMusicTrackId: string | null;
  onSelectMusic: (track: CommunityStoryMusicTrack | null) => void;
  memberAudioUrl: string | null;
  onMemberAudioUrl: (url: string | null) => void;
  memberRightsAck: boolean;
  onMemberRightsAck: (value: boolean) => void;
  onSoundtrackError: (message: string) => void;
};

const SECTION_OPTIONS: Array<{
  id: "youtube" | "background" | "free-worship" | "library";
  label: string;
  subtitle: string;
  disabled?: boolean;
}> = [
  { id: "background", label: "Background Audio", subtitle: "Record or Upload" },
  { id: "youtube", label: "Gospel Music Videos", subtitle: "YouTube" },
  { id: "free-worship", label: "Free Worship Music", subtitle: "Licensed library" },
  { id: "library", label: "Shanah Worship Music", subtitle: "Coming Soon", disabled: true },
];

export function CommunityStorySoundtrackPicker({
  allowMemberOverlay,
  selectedMusicTrackId,
  onSelectMusic,
  memberAudioUrl,
  onMemberAudioUrl,
  memberRightsAck,
  onMemberRightsAck,
  onSoundtrackError,
}: CommunityStorySoundtrackPickerProps) {
  const [section, setSection] = useState<
    "none" | "youtube" | "background" | "free-worship" | "library"
  >("none");
  const [backgroundMode, setBackgroundMode] = useState<"member-record" | "member-upload">(
    "member-record",
  );
  const [freeLibraryLive, setFreeLibraryLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/community/story-music?genre=all&q=")
      .then((r) => r.json())
      .then((data: { freeLibraryLive?: boolean }) => {
        if (!cancelled) setFreeLibraryLive(Boolean(data.freeLibraryLive));
      })
      .catch(() => {
        if (!cancelled) setFreeLibraryLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedMusicTrackId && section === "none") setSection("free-worship");
    if (memberAudioUrl && section === "none") {
      setSection("background");
      setBackgroundMode("member-record");
    }
  }, [memberAudioUrl, section, selectedMusicTrackId]);

  function selectSection(next: "youtube" | "background" | "free-worship" | "library") {
    if (next === "library") return;
    if (next === "free-worship" && !freeLibraryLive) {
      onSoundtrackError(
        "Free worship songs are being verified by the church team. Check back soon — your recorded voice still works today.",
      );
      return;
    }
    if (next === "background" && !allowMemberOverlay) {
      onSoundtrackError("Use gospel music videos with video stories — your video keeps its own sound.");
      return;
    }
    setSection(next);
    onSoundtrackError("");
    if (next === "youtube") {
      onMemberAudioUrl(null);
      onMemberRightsAck(false);
    } else if (next === "background") {
      onSelectMusic(null);
      setBackgroundMode("member-record");
    } else if (next === "free-worship") {
      onMemberAudioUrl(null);
      onMemberRightsAck(false);
    }
  }

  function selectBackgroundMode(next: "member-record" | "member-upload") {
    if (!allowMemberOverlay) {
      onSoundtrackError("Use gospel music videos with video stories — your video keeps its own sound.");
      return;
    }
    setSection("background");
    setBackgroundMode(next);
    onSoundtrackError("");
    onSelectMusic(null);
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-600 dark:text-sand-400">
        Story soundtrack (optional)
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SECTION_OPTIONS.map((option) => {
          const disabled =
            option.disabled ||
            (option.id === "background" && !allowMemberOverlay) ||
            (option.id === "free-worship" && !freeLibraryLive);
          const active = section === option.id;
          const subtitle =
            option.id === "free-worship" && !freeLibraryLive
              ? "Coming soon — verification in progress"
              : option.subtitle;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              className={`rounded-xl border px-2.5 py-2 text-left transition ${
                active
                  ? "border-clay-600 bg-clay-500/15 ring-1 ring-clay-600/40"
                  : "border-night-900/10 bg-white/70 dark:border-white/10 dark:bg-night-950/40"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => selectSection(option.id)}
            >
              <span className="block text-[13px] font-semibold text-night-900 dark:text-sand-100">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-night-500 dark:text-sand-400">{subtitle}</span>
            </button>
          );
        })}
      </div>

      {section === "background" ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
              backgroundMode === "member-record"
                ? "border-clay-600 bg-clay-500/15 text-clay-900 dark:text-clay-100"
                : "border-night-900/10 bg-white/70 dark:border-white/10 dark:bg-night-950/40"
            }`}
            onClick={() => selectBackgroundMode("member-record")}
          >
            Record
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
              backgroundMode === "member-upload"
                ? "border-clay-600 bg-clay-500/15 text-clay-900 dark:text-clay-100"
                : "border-night-900/10 bg-white/70 dark:border-white/10 dark:bg-night-950/40"
            }`}
            onClick={() => selectBackgroundMode("member-upload")}
          >
            Upload
          </button>
        </div>
      ) : null}

      {section === "free-worship" && freeLibraryLive ? (
        <CommunityStoryMusicPicker
          selectedTrackId={selectedMusicTrackId}
          heading="Free Worship Music"
          subheading="Native background audio on your photo — preview before attaching."
          onSelect={(track) => {
            onSelectMusic(track);
            if (track) {
              onMemberAudioUrl(null);
              onMemberRightsAck(false);
            }
          }}
        />
      ) : null}

      {section === "youtube" ? (
        <CommunityStoryMusicPicker
          selectedTrackId={selectedMusicTrackId}
          heading="Gospel Music Videos"
          subheading="Tap the sticker in your story to watch the official YouTube video."
          youtubeMode
          onSelect={(track) => {
            onSelectMusic(track);
            if (track) {
              onMemberAudioUrl(null);
              onMemberRightsAck(false);
            }
          }}
        />
      ) : null}

      {section === "background" && backgroundMode === "member-record" ? (
        <CommunityStoryMemberAudioPanel
          mode="record"
          audioUrl={memberAudioUrl}
          rightsAcknowledged={memberRightsAck}
          onAudioUrlChange={onMemberAudioUrl}
          onRightsAckChange={onMemberRightsAck}
          onError={onSoundtrackError}
        />
      ) : null}

      {section === "background" && backgroundMode === "member-upload" ? (
        <CommunityStoryMemberAudioPanel
          mode="upload"
          audioUrl={memberAudioUrl}
          rightsAcknowledged={memberRightsAck}
          onAudioUrlChange={onMemberAudioUrl}
          onRightsAckChange={onMemberRightsAck}
          onError={onSoundtrackError}
        />
      ) : null}
    </div>
  );
}
