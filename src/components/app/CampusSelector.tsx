"use client";

import { useApp } from "@/components/app/AppProvider";
import { campuses } from "@/lib/site";

export function CampusSelector() {
  const { campusId, setCampusId, campus } = useApp();

  return (
    <div className="relative">
      <label htmlFor="campus-select" className="sr-only">
        Select campus
      </label>
      <select
        id="campus-select"
        value={campusId}
        onChange={(event) => setCampusId(event.target.value)}
        className="appearance-none rounded-xl border border-night-900/10 bg-white py-2 pl-3 pr-8 text-sm font-medium text-night-800 shadow-sm outline-none ring-night-900/5 transition focus:ring-2"
      >
        {campuses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.city}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-night-400">
        ▾
      </span>
      <p className="mt-1 hidden text-xs text-night-500 md:block">
        {campus.timezone.replace("_", " ")}
      </p>
    </div>
  );
}
