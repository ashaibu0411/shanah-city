"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MarriageCounselorClinicalDashboard,
  type MarriageCounselorClinicalDetailView,
} from "@/components/marriage/MarriageCounselorClinicalDashboard";
import { MarriageCounselorPremaritalOperationsPanel } from "@/components/marriage/MarriageCounselorPremaritalOperationsPanel";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type AdminDetail = {
  access: "administrative";
  journeyId: string;
  coupleNames: string;
  assignedCounselorName: string | null;
  journeyStatus: string;
  programType: string;
  moduleCount: number;
  completedModules: number;
  viewerHasClinicalAccess: boolean;
};

type Detail = AdminDetail | MarriageCounselorClinicalDetailView;

export function MarriageCounselorJourneyDetail({ journeyId }: { journeyId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/marriage/counselor/journey/${journeyId}`, { cache: "no-store" });
    const data = await readJsonResponse<Detail & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Unable to load.");
      return;
    }
    setDetail(data);
  }, [journeyId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage/counselor" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  if (!detail) return <p className={marriagePremium.cardMuted}>Loading couple…</p>;

  if (detail.access === "administrative") {
    return (
      <div className="marriage-c3m-dashboard-shell">
        <Link href="/marriage/counselor" className="marriage-c3m-back-link">
          ← Counselor workspace
        </Link>
        <h1 className="marriage-c3m-title mt-3">{detail.coupleNames}</h1>
        <p className="marriage-c3m-subtitle capitalize">
          {detail.programType.replace(/_/g, " ")} · {detail.journeyStatus.replace(/_/g, " ")}
        </p>
        <div className={`${marriagePremium.card} mt-6`}>
          <p className="font-semibold">Administrative overview</p>
          <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
            Clinical answers, comparisons, sessions, and notes are hidden until you are the assigned counselor.
          </p>
          <p className="mt-3 text-sm">Assigned counselor: {detail.assignedCounselorName ?? "Unassigned"}</p>
          <p className="text-sm">
            Progress: {detail.completedModules}/{detail.moduleCount} modules both submitted
          </p>
        </div>
        {detail.programType === "premarital" ? (
          <MarriageCounselorPremaritalOperationsPanel journeyId={journeyId} onError={setError} />
        ) : null}
      </div>
    );
  }

  return (
    <MarriageCounselorClinicalDashboard
      detail={detail}
      journeyId={journeyId}
      onRefresh={loadDetail}
      onError={setError}
    />
  );
}
