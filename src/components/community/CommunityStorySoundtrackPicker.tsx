"use client";

import { useEffect, useState } from "react";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";
import { CommunityStoryMusicPicker } from "@/components/community/CommunityStoryMusicPicker";
import { CommunityStoryMemberAudioPanel } from "@/components/community/CommunityStoryMemberAudioPanel";

export type StorySoundtrackMode = "none" | "youtube" | "member-record" | "member-upload" | "library";

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
  id: "youtube" | "background" | "library";
  label: string;
  subtitle: string;
  disabled?: boolean;
}> = [
  { id: "youtube", label: "Gospel Music Videos", subtitle: "YouTube" },
  { id: "background", label: "Background Audio", subtitle: "Record or Upload" },
  {
    id: "library",
    label: "Shanah Worship Music",
    subtitle: "Coming Soon",
    disabled: true,
  },
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
  const [section, setSection] = useState<"none" | "youtube" | "background" | "library">("none");
  const [backgroundMode, setBackgroundMode] = useState<"member-record" | "member-upload">(
    "member-record",
  );

  useEffect(() => {
    if (selectedMusicTrackId && section === "none") setSection("youtube");
    if (memberAudioUrl && section === "none") {
      setSection("background");
      setBackgroundMode("member-record");
    }
  }, [memberAudioUrl, section, selectedMusicTrackId]);

  function selectSection(next: "youtube" | "background" | "library") {
    if (next === "library") return;
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SECTION_OPTIONS.map((option) => {
          const disabled =
            option.disabled || (option.id === "background" && !allowMemberOverlay);
          const active =
            option.id === "background"
              ? section === "background"
              : section === option.id;
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
              <span className="mt-0.5 block text-[10px] text-night-500 dark:text-sand-400">
                {option.subtitle}
              </span>
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

      {section === "youtube" ? (
        <CommunityStoryMusicPicker
          selectedTrackId={selectedMusicTrackId}
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
