"use client";

import { useCallback, useEffect, useState } from "react";
import type { MyEventRsvpsResponse } from "@/lib/event-rsvp-types";

const empty: MyEventRsvpsResponse = {
  pending: [],
  responded: [],
  pendingCount: 0,
};

export function useMyEventRsvps(enabled = true) {
  const [data, setData] = useState<MyEventRsvpsResponse>(empty);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData(empty);
      setLoading(false);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/events/rsvp/mine");
    const payload = await response.json();
    setLoading(false);

    if (response.ok) {
      setData({
        pending: payload.pending ?? [],
        responded: payload.responded ?? [],
        pendingCount: payload.pendingCount ?? 0,
      });
    } else {
      setData(empty);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingEventIds = new Set(data.pending.map((item) => item.eventId));

  return {
    ...data,
    pendingEventIds,
    loading,
    refresh,
  };
}
