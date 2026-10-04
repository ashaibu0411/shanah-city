import { promises as fs } from "fs";
import path from "path";
import { getConfiguredFrontLinersGroupId } from "@/lib/frontliners-access-server";
import { getZonedDateParts } from "@/lib/denver-time";
import { getGroups } from "@/lib/group-server";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";

const STATE_FILE = path.join(process.cwd(), "data", "frontliners-checkin-reminder.json");

const CHECK_IN_URL = "/check-in";

type ReminderState = {
  lastSentDateKey?: string;
};

async function readReminderState(): Promise<ReminderState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw) as ReminderState;
  } catch {
    return {};
  }
}

async function writeReminderState(state: ReminderState) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function minutesSinceMidnight(parts: ReturnType<typeof getZonedDateParts>) {
  return parts.hour * 60 + parts.minute;
}

/** Sunday 8:30 AM America/Denver (MST/MDT), with a window for 5-minute cron ticks. */
export function isFrontLinersCheckInReminderDue(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  if (denver.weekday !== 0) return false;

  const notifyAt = 8 * 60 + 30;
  const now = minutesSinceMidnight(denver);
  return now >= notifyAt - 5 && now < notifyAt + 25;
}

async function eligibleFrontLinersMemberIds() {
  const groupId = getConfiguredFrontLinersGroupId();
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  return [...group.memberIds];
}

export async function processFrontLinersCheckInReminder(reference = new Date()) {
  const denver = getZonedDateParts(reference);

  if (!isFrontLinersCheckInReminderDue(reference)) {
    return {
      sent: 0,
      skipped: true,
      reason: "outside_reminder_window",
      denverDate: denver.dateKey,
      denverHour: denver.hour,
      denverMinute: denver.minute,
      denverWeekday: denver.weekday,
    };
  }

  const state = await readReminderState();
  if (state.lastSentDateKey === denver.dateKey) {
    return {
      sent: 0,
      skipped: true,
      reason: "already_sent_today",
      denverDate: denver.dateKey,
    };
  }

  const userIds = await eligibleFrontLinersMemberIds();
  if (userIds.length === 0) {
    return {
      sent: 0,
      skipped: true,
      reason: "no_frontliners",
      denverDate: denver.dateKey,
    };
  }

  const result = await sendPushToUsersWithPushEnabled(userIds, {
    title: "FrontLiners check-in",
    body: "Good morning — tap to check in when you arrive for Sunday service.",
    url: CHECK_IN_URL,
  });

  if (result.sent > 0) {
    await writeReminderState({ lastSentDateKey: denver.dateKey });
  }

  return {
    ...result,
    skipped: false,
    recipients: userIds.length,
    denverDate: denver.dateKey,
    url: CHECK_IN_URL,
  };
}
