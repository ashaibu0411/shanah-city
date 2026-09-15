import type { CommunityStatusStoryKind } from "@/lib/member-types";

export type StoryReplyPreset = {
  id: string;
  label: string;
  message: string;
};

const DEFAULT_STORY_REPLY_PRESETS: StoryReplyPreset[] = [
  { id: "amen", label: "Amen 🙌", message: "Amen 🙌" },
  { id: "pray", label: "Praying for you 🙏", message: "Praying for you 🙏" },
  { id: "love", label: "Love this ❤️", message: "Love this ❤️" },
  { id: "fire", label: "So good! 🔥", message: "So good! 🔥" },
];

const SERVICE_INVITE_REPLY_PRESETS: StoryReplyPreset[] = [
  { id: "on-way", label: "On my way!", message: "On my way!" },
  { id: "see-you", label: "See you there!", message: "See you there!" },
  { id: "amen", label: "Amen 🙌", message: "Amen 🙌" },
  { id: "pray", label: "Praying for you 🙏", message: "Praying for you 🙏" },
];

export function storyReplyPresetsForKind(
  storyKind: CommunityStatusStoryKind | undefined,
): StoryReplyPreset[] {
  return storyKind === "service_invite"
    ? SERVICE_INVITE_REPLY_PRESETS
    : DEFAULT_STORY_REPLY_PRESETS;
}
