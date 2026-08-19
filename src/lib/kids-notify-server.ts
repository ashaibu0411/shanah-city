import { sendPushToUsers } from "@/lib/push-server";
import type { KidsIncident, KidsLesson } from "@/lib/kids-types";
import { getConfiguredKidsGroupId } from "@/lib/kids-access-server";
import { getGroups } from "@/lib/group-server";
import { isKidsMinistryGroup } from "@/lib/kids-types";

async function getKidsTeamUserIds() {
  const configuredId = getConfiguredKidsGroupId();
  const groups = await getGroups();
  const ids = new Set<string>();

  for (const group of groups) {
    if (group.id === configuredId || isKidsMinistryGroup(group)) {
      for (const memberId of group.memberIds) {
        ids.add(memberId);
      }
    }
  }

  return [...ids];
}

export async function notifyKidsLessonPublished(lesson: KidsLesson) {
  const userIds = await getKidsTeamUserIds();
  return sendPushToUsers(
    userIds.filter((id) => id !== lesson.createdBy),
    {
      title: "Kids lesson published",
      body: `${lesson.ageGroup}: ${lesson.title}`,
      url: `/kids-ministry?week=${encodeURIComponent(lesson.weekStarting)}`,
    },
    "kids",
  );
}

export async function notifyKidsIncident(incident: KidsIncident) {
  if (!incident.parentUserId) {
    return { sent: 0, skipped: 1, configured: false };
  }

  return sendPushToUsers(
    [incident.parentUserId],
    {
      title: "Kids ministry update",
      body: `${incident.childName}: ${incident.summary}`,
      url: "/profile",
    },
    "kids",
  );
}
