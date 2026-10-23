"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type AdminRow = {
  access: "administrative";
  journeyId: string;
  coupleNames: string;
  assignedCounselorName: string | null;
  journeyStatus: string;
  programType: string;
  moduleCount: number;
  completedModules: number;
  viewerHasClinicalAccess?: boolean;
};

type DashboardRow = AdminRow | { access: "clinical"; journeyId: string; coupleNames: string; programType: string; completedModules?: number; moduleCount?: number };

export function MarriageCounselorDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marriage/counselor", { cache: "no-store" });
      const data = await readJsonResponse<{ rows: DashboardRow[]; error?: string }>(res);
      if (!res.ok) setError(data.error ?? "Access denied.");
      else setRows(data.rows);
    })();
  }, []);

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Counselor workspace</h1>
      <p className={marriagePremium.cardMuted}>
        Administrative overview for pastoral oversight. Clinical details require counselor assignment.
      </p>

      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.journeyId} className={marriagePremium.card}>
            <p className="font-semibold">{row.coupleNames || "Couple"}</p>
            {row.access === "administrative" ? (
              <>
                <p className={`${marriagePremium.cardMuted} mt-1 capitalize`}>
                  {row.programType} · {row.journeyStatus}
                </p>
                <p className="text-sm text-night-600">
                  Counselor: {row.assignedCounselorName ?? "Unassigned"}
                </p>
                <p className="text-sm">
                  Progress: {row.completedModules}/{row.moduleCount} modules both submitted
                </p>
              </>
            ) : (
              <p className={`${marriagePremium.cardMuted} mt-1 capitalize`}>
                {row.programType} · assigned counselor
              </p>
            )}
            <Link
              href={`/marriage/counselor/journey/${row.journeyId}`}
              className={`${marriagePremium.secondaryCta} mt-3 inline-block text-sm`}
            >
              View journey
            </Link>
          </li>
        ))}
        {rows.length === 0 && <p className={marriagePremium.cardMuted}>No active journeys yet.</p>}
      </ul>
    </div>
  );
}
