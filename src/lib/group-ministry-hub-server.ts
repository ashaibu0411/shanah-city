import type { PublicMember } from "@/lib/auth-types";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import { getGroupDetail } from "@/lib/group-server";
import { getEvents } from "@/lib/event-server";
import { getTodayDevotion, getDevotions } from "@/lib/devotion-server";
import {
  groupHasMinistryHub,
  type MinistryHubDevotionPreview,
  type MinistryHubEventPreview,
} from "@/lib/group-ministry-hub-types";
import { useDatabase } from "@/lib/use-database";
import * as hubDb from "@/lib/stores/group-ministry-hub-db";
import * as hubJson from "@/lib/stores/group-ministry-hub-json";

const hubStore = () => (useDatabase() ? hubDb : hubJson);

async function assertHubGroup(groupId: string) {
  if (!groupHasMinistryHub(groupId)) {
    throw new Error("This group does not use the ministry hub yet.");
  }
}

async function assertMember(user: PublicMember, groupId: string) {
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) {
    throw new Error("Join this group under Groups to view the hub.");
  }
  return group;
}

export async function canManageMinistryHub(user: PublicMember, groupId: string) {
  await assertHubGroup(groupId);
  const group = await getGroupDetail(groupId, user.id);
  if (!group) return false;
  return isGroupLeaderOrAssistant(group, user.id);
}

async function nextEventPreview(groupId: string): Promise<MinistryHubEventPreview | null> {
  const today = new Date().toISOString().slice(0, 10);
  const events = await getEvents({ groupId });
  const upcoming = events
    .filter((event) => {
      const day = event.startsOn?.trim() || event.date?.trim();
      return !day || day >= today;
    })
    .sort((a, b) => String(a.startsOn ?? a.date).localeCompare(String(b.startsOn ?? b.date)))[0];

  if (!upcoming) return null;

  const day = upcoming.startsOn?.trim();
  const subtitle = day
    ? new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : upcoming.date || "Upcoming";

  return {
    title: upcoming.title,
    subtitle: upcoming.time ? `${subtitle} · ${upcoming.time}` : subtitle,
    href: `/groups/${groupId}?calendar=1`,
  };
}

async function devotionPreview(): Promise<MinistryHubDevotionPreview | null> {
  const devotion = (await getTodayDevotion()) ?? (await getDevotions())[0] ?? null;
  if (!devotion) return null;

  return {
    id: devotion.id,
    title: devotion.title,
    verse: devotion.verse?.trim() || "",
    href: `/devotions/${devotion.id}`,
  };
}

export async function getMinistryHubForUser(user: PublicMember | null, groupId: string) {
  await assertHubGroup(groupId);

  if (!user) {
    throw new Error("Sign in required.");
  }

  await assertMember(user, groupId);

  const [announcement, nextEvent, devotionPreviewData] = await Promise.all([
    hubStore().getGroupPinnedAnnouncement(groupId),
    nextEventPreview(groupId),
    devotionPreview(),
  ]);

  const canManageAnnouncement = await canManageMinistryHub(user, groupId);

  return {
    announcement,
    nextEvent,
    devotion: devotionPreviewData,
    canManageAnnouncement,
  };
}

export async function saveMinistryHubAnnouncement(
  user: PublicMember,
  input: { groupId: string; title: string; body: string },
) {
  await assertHubGroup(input.groupId);
  if (!(await canManageMinistryHub(user, input.groupId))) {
    throw new Error("Only group leaders and assistants can update announcements.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new Error("Add a title and message for the announcement.");
  }

  const announcement = await hubStore().saveGroupPinnedAnnouncement({
    groupId: input.groupId,
    title,
    body,
    actor: { id: user.id, name: user.name },
  });

  const hub = await getMinistryHubForUser(user, input.groupId);
  return { ...hub, announcement };
}
