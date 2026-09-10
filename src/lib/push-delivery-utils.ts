import type { NotificationPrefs, NotificationTopic } from "@/lib/auth-types";

export type PushDeliveryResult = {
  sent: number;
  skipped: number;
  webSent: number;
  nativeSent: number;
  errors: string[];
  configured: boolean;
  eligibleUsers: number;
  deliveredUsers: number;
  failedUsers: number;
  skippedPrefUsers: number;
  skippedNoDeviceUsers: number;
};

export function emptyPushDeliveryResult(configured = false): PushDeliveryResult {
  return {
    sent: 0,
    skipped: 0,
    webSent: 0,
    nativeSent: 0,
    errors: [],
    configured,
    eligibleUsers: 0,
    deliveredUsers: 0,
    failedUsers: 0,
    skippedPrefUsers: 0,
    skippedNoDeviceUsers: 0,
  };
}

export function resolveNotificationPrefs(
  prefs?: Partial<NotificationPrefs> | null,
): NotificationPrefs {
  return {
    pushEnabled: prefs?.pushEnabled ?? true,
    devotions: prefs?.devotions ?? true,
    messages: prefs?.messages ?? true,
    announcements: prefs?.announcements ?? true,
    worship: prefs?.worship ?? true,
    kids: prefs?.kids ?? true,
  };
}

export function getScheduledPushEligibility(prefs: NotificationPrefs) {
  return {
    devotions: prefs.pushEnabled && prefs.devotions,
    prayer:
      prefs.pushEnabled &&
      (prefs.devotions || prefs.announcements || prefs.worship),
  };
}

/** Only mark a scheduled broadcast complete when delivery succeeded or nobody was eligible. */
export function shouldMarkScheduledPushComplete(result: PushDeliveryResult) {
  if (!result.configured) return false;
  if (result.failedUsers > 0) return false;
  if (result.deliveredUsers > 0) return true;
  return result.eligibleUsers === 0;
}

export function preferenceMatchesTopic(
  prefs: NotificationPrefs,
  preferenceKey: NotificationTopic,
) {
  return prefs.pushEnabled && prefs[preferenceKey];
}

export function preferenceMatchesAnyTopic(
  prefs: NotificationPrefs,
  preferenceKeys: NotificationTopic[],
) {
  return prefs.pushEnabled && preferenceKeys.some((key) => prefs[key]);
}
