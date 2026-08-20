import type { FeedReadKey } from "@/lib/notification-types";
import * as feedReadDb from "@/lib/stores/feed-read-db";
import * as feedReadJson from "@/lib/stores/feed-read-json";
import { useDatabase } from "@/lib/use-database";

const store = () => (useDatabase() ? feedReadDb : feedReadJson);

export const getFeedLastReads = (userId: string) => store().getFeedLastReads(userId);
export const markFeedRead = (userId: string, feedKey: FeedReadKey) =>
  store().markFeedRead(userId, feedKey);
export const markFeedsRead = (userId: string, feedKeys: FeedReadKey[]) =>
  store().markFeedsRead(userId, feedKeys);
