"use client";

import { useEffect, useRef } from "react";
import type { FeedReadKey } from "@/lib/notification-types";
import { notifyNotificationsChanged } from "@/lib/use-notifications";

type MarkFeedReadProps = {
  feed: FeedReadKey | FeedReadKey[];
};

export function MarkFeedRead({ feed }: MarkFeedReadProps) {
  const markedRef = useRef<string>("");

  useEffect(() => {
    const feeds = Array.isArray(feed) ? feed : [feed];
    const key = feeds.join(",");
    if (markedRef.current === key) return;
    markedRef.current = key;

    void fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markFeedRead", feeds }),
    })
      .then(() => notifyNotificationsChanged())
      .catch(() => undefined);
  }, [feed]);

  return null;
}
