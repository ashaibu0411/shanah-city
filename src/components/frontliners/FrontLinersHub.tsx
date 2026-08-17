"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GuestQueuePanel } from "@/components/frontliners/GuestQueuePanel";
import { UsherSchedulePanel } from "@/components/frontliners/UsherSchedulePanel";

export function FrontLinersHub({
  initialDate,
  initialTime,
}: {
  initialDate?: string;
  initialTime?: string;
}) {
  const { permissions } = useAuth();
  const [tab, setTab] = useState<"schedule" | "guests">("schedule");

  const tabs = [
    { id: "schedule" as const, label: "Usher schedule" },
    ...(permissions.canManageFrontLiners
      ? [{ id: "guests" as const, label: "Guest queue" }]
      : []),
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <UsherSchedulePanel initialDate={initialDate} initialTime={initialTime} />
      ) : (
        <GuestQueuePanel />
      )}
    </>
  );
}
