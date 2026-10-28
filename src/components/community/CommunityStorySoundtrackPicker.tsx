"use client";

import { useEffect, useState } from "react";
import type { CommunityStoryMusicTrack } from "@/lib/community-story-music";
import { storyMusicHybridClientEnabled } from "@/lib/story-music/story-music-config";
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

const MODE_OPTIONS: Array<{
  id: StorySoundtrackMode;
  label: string;
  subtitle: string;
  disabled?: boolean;
}> = [
  { id: "youtube", label: "YouTube Gospel", subtitle: "Search licensed previews via YouTube" },
  { id: "member-record", label: "Record My Audio", subtitle: "Microphone" },
  { id: "member-upload", label: "Upload My Audio", subtitle: "Your file" },
  {
    id: "library",
    label: "Shanah Worship Library",
    subtitle: "Coming soon",
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
  const [mode, setMode] = useState<StorySoundtrackMode>("none");
  const hybridLibrarySoon = storyMusicHybridClientEnabled();

  useEffect(() => {
    if (selectedMusicTrackId && mode === "none") setMode("youtube");
    if (memberAudioUrl && mode === "none") {
      setMode("member-record");
    }
  }, [memberAudioUrl, mode, selectedMusicTrackId]);

  function selectMode(next: StorySoundtrackMode) {
    if (next === "library") return;
    if ((next === "member-record" || next === "member-upload") && !allowMemberOverlay) {
      onSoundtrackError("Use YouTube music with video stories — your video keeps its own sound.");
      return;
    }
    setMode(next);
    onSoundtrackError("");
    if (next === "youtube") {
      onMemberAudioUrl(null);
      onMemberRightsAck(false);
    } else if (next === "member-record" || next === "member-upload") {
      onSelectMusic(null);
    } else {
      onSelectMusic(null);
      onMemberAudioUrl(null);
      onMemberRightsAck(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-night-600 dark:text-sand-400">
        Story soundtrack (optional)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MODE_OPTIONS.map((option) => {
          const disabled =
            option.disabled ||
            ((option.id === "member-record" || option.id === "member-upload") && !allowMemberOverlay);
          const active = mode === option.id;
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
              onClick={() => selectMode(option.id)}
            >
              <span className="block text-[13px] font-semibold text-night-900 dark:text-sand-100">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-night-500 dark:text-sand-400">
                {option.id === "library" && hybridLibrarySoon
                  ? "Authorized recordings — coming soon"
                  : option.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "youtube" ? (
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

      {mode === "member-record" ? (
        <CommunityStoryMemberAudioPanel
          mode="record"
          audioUrl={memberAudioUrl}
          rightsAcknowledged={memberRightsAck}
          onAudioUrlChange={onMemberAudioUrl}
          onRightsAckChange={onMemberRightsAck}
          onError={onSoundtrackError}
        />
      ) : null}

      {mode === "member-upload" ? (
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
