"use client";

import { useState } from "react";
import { KidsCheckInPanel } from "@/components/checkin/KidsCheckInPanel";
import { VolunteerCheckInPanel } from "@/components/checkin/VolunteerCheckInPanel";
import { PageHeader } from "@/components/ui";

export default function CheckInPage() {
  const [tab, setTab] = useState<"volunteer" | "kids">("volunteer");

  return (
    <>
      <PageHeader
        eyebrow="Serve & family"
        title="Check-in"
        description="Volunteers clock in at the church address. Parents check kids into children's ministry."
      />

      <div className="mb-6 flex gap-2">
        {([
          { id: "volunteer", label: "Volunteers" },
          { id: "kids", label: "Kids" },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "volunteer" ? <VolunteerCheckInPanel /> : <KidsCheckInPanel />}
    </>
  );
}
