import { choirAcademyHomeHref } from "@/lib/choir-academy-links";
import { choirAvailabilityHref, choirMyScheduleHref } from "@/lib/choir-availability-links";
import { choirConnectHref } from "@/lib/choir-connect-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirResourcesHref } from "@/lib/choir-resource-links";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import { choirLeaderStudioHref } from "@/lib/choir-leader-studio-links";
import { choirSongSuggestionsHref } from "@/lib/choir-song-suggestion-links";
import { choirRecordingsLibraryHref } from "@/lib/choir-recordings-links";

export type ChoirHomeQuickActionLinks = {
  setlists: string;
  mySchedule: string;
  recordings: string;
  worshipTeam: string;
  worshipAcademy: string;
  teamConnect: string;
};

export type ChoirExploreNavItem = {
  id: string;
  title: string;
  description: string;
  href: string | null;
  comingSoon?: boolean;
  leadersOnly?: boolean;
  iconLabel: string;
};

export function choirHomeQuickActionLinks(groupId: string = SHANAH_WORSHIP_GROUP_ID): ChoirHomeQuickActionLinks {
  return {
    setlists: `/groups/${encodeURIComponent(groupId)}/setlists`,
    mySchedule: choirMyScheduleHref(groupId),
    recordings: choirRecordingsLibraryHref(groupId),
    worshipTeam: `/groups/${encodeURIComponent(groupId)}/team`,
    worshipAcademy: choirAcademyHomeHref(groupId),
    teamConnect: choirConnectHref(groupId),
  };
}

export function choirExploreNavItems(
  groupId: string = SHANAH_WORSHIP_GROUP_ID,
  options?: { isLeader?: boolean },
): ChoirExploreNavItem[] {
  const isLeader = options?.isLeader ?? false;

  const items: ChoirExploreNavItem[] = [
    {
      id: "recordings",
      title: "Recordings",
      description: "Rehearsal library — listen, record, and upload.",
      href: choirRecordingsLibraryHref(groupId),
      iconLabel: "🎙️",
    },
    {
      id: "calendar",
      title: "Worship Calendar",
      description: "Services, rehearsals & upcoming dates.",
      href: `/groups/${encodeURIComponent(groupId)}/calendar`,
      iconLabel: "📅",
    },
    {
      id: "availability",
      title: "Availability Center",
      description: "Let leadership know when you can serve.",
      href: choirAvailabilityHref(groupId),
      iconLabel: "✓",
    },
    {
      id: "song-suggestions",
      title: "Song Suggestions",
      description: "Recommend songs and worship ideas.",
      href: choirSongSuggestionsHref(groupId),
      iconLabel: "♫",
    },
    {
      id: "resources",
      title: "Ministry Resource Center",
      description: "Handbooks, guidelines & forms.",
      href: choirResourcesHref(groupId),
      iconLabel: "📖",
    },
    {
      id: "worship-events",
      title: "Worship Events",
      description: "Special worship gatherings, concerts and training.",
      href: choirWorshipEventsHref(groupId),
      iconLabel: "✦",
    },
    {
      id: "leader-studio",
      title: "Worship Leader Studio",
      description: "Leadership planning and management.",
      href: choirLeaderStudioHref(groupId),
      leadersOnly: true,
      iconLabel: "★",
    },
  ];

  return items.filter((item) => !item.leadersOnly || isLeader);
}
