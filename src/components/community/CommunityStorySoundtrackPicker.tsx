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
  musicClipStartSeconds: number;
  onMusicClipStartSeconds: (seconds: number) => void;
  musicClipDurationSec: 30 | 60;
  onMusicClipDurationSec: (seconds: 30 | 60) => void;
  onMusicTrackDurationSec?: (seconds: number | null) => void;
  memberAudioUrl: string | null;
  onMemberAudioUrl: (url: string | null) => void;
  memberRightsAck: boolean;
  onMemberRightsAck: (value: boolean) => void;
  onSoundtrackError: (message: string) => void;
};

const SECTION_OPTIONS: Array<{
  id: "free-worship" | "background";
  label: string;
  subtitle: string;
}> = [
  { id: "free-worship", label: "Free Worship Music", subtitle: "Music behind your story photo" },
  { id: "background", label: "Record Your Voice", subtitle: "Record or upload your own audio" },
];

export function CommunityStorySoundtrackPicker({
  allowMemberOverlay,
  selectedMusicTrackId,
  onSelectMusic,
  musicClipStartSeconds,
  onMusicClipStartSeconds,
  musicClipDurationSec,
  onMusicClipDurationSec,
  onMusicTrackDurationSec,
  memberAudioUrl,
  onMemberAudioUrl,
  memberRightsAck,
  onMemberRightsAck,
  onSoundtrackError,
}: CommunityStorySoundtrackPickerProps) {
  const [section, setSection] = useState<"none" | "background" | "free-worship">("none");
  const [backgroundMode, setBackgroundMode] = useState<"member-record" | "member-upload">(
    "member-record",
  );
  const [freeLibraryLive, setFreeLibraryLive] = useState(false);
  const [freeLibraryChecked, setFreeLibraryChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/community/story-music?genre=all&q=")
      .then((r) => r.json())
      .then((data: { freeLibraryLive?: boolean }) => {
        if (!cancelled) setFreeLibraryLive(Boolean(data.freeLibraryLive));
      })
      .catch(() => {
        if (!cancelled) setFreeLibraryLive(false);
      })
      .finally(() => {
        if (!cancelled) setFreeLibraryChecked(true);
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

  function selectSection(next: "background" | "free-worship") {
    if (!allowMemberOverlay) {
      onSoundtrackError("Background sound is for photo or text stories. Videos keep their own sound.");
      return;
    }

    setSection(next);
    onSoundtrackError("");
    if (next === "background") {
      onSelectMusic(null);
      setBackgroundMode("member-record");
    } else {
      onMemberAudioUrl(null);
      onMemberRightsAck(false);
    }
  }

  function selectBackgroundMode(next: "member-record" | "member-upload") {
    if (!allowMemberOverlay) {
      onSoundtrackError("Background sound is for photo or text stories. Videos keep their own sound.");
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
          const disabled = !allowMemberOverlay;
          const active = section === option.id;
          const subtitle =
            option.id === "free-worship" && !freeLibraryLive
              ? freeLibraryChecked
                ? "Songs awaiting approval"
                : "Checking available songs…"
              : option.subtitle;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
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

      {section === "free-worship" ? (
        freeLibraryLive ? (
          <CommunityStoryMusicPicker
            selectedTrackId={selectedMusicTrackId}
            clipStartSeconds={musicClipStartSeconds}
            onClipStartSeconds={onMusicClipStartSeconds}
            clipDurationSec={musicClipDurationSec}
            onClipDurationSec={onMusicClipDurationSec}
            onTrackDurationSec={onMusicTrackDurationSec}
            heading="Free Worship Music"
            subheading="Choose a licensed track to play behind your photo story."
            onSelect={(track) => {
              onSelectMusic(track);
              if (track) {
                onMemberAudioUrl(null);
                onMemberRightsAck(false);
              }
            }}
          />
        ) : (
          <p role="status" className="rounded-xl border border-night-900/10 bg-white/70 px-3 py-3 text-xs text-night-600 dark:border-white/10 dark:bg-night-950/40 dark:text-sand-300">
            {freeLibraryChecked
              ? "The church has not published any approved free worship songs yet. You can still record or upload your own audio."
              : "Checking the free worship music library…"}
          </p>
        )
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
