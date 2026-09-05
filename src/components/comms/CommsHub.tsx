"use client";

import { useState } from "react";
import { CommsCalendarWeek } from "@/components/comms/CommsCalendarWeek";
import { CommsRequestSubmitForm, CommsRequestsAdminPanel } from "@/components/comms/CommsRequestsPanel";

type CommsHubTab = "calendar" | "requests" | "submit";

export function CommsHub({ showSubmitTab = false }: { showSubmitTab?: boolean }) {
  const [tab, setTab] = useState<CommsHubTab>(showSubmitTab ? "submit" : "calendar");

  const tabs: { id: CommsHubTab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "requests", label: "Requests" },
  ];
  if (showSubmitTab) {
    tabs.unshift({ id: "submit", label: "Submit request" });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === entry.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "calendar" ? <CommsCalendarWeek /> : null}
      {tab === "requests" ? <CommsRequestsAdminPanel /> : null}
      {tab === "submit" ? <CommsRequestSubmitForm /> : null}
    </div>
  );
}
