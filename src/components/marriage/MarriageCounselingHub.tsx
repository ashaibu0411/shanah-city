"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { MarriageCounselingGuestIntro } from "@/components/marriage/MarriageCounselingGuestIntro";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageHubSummary, MarriageProgramType } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";
import { MarriageStage2HubPromo } from "@/components/marriage/MarriageStage2HubPromo";
import { MarriageCounselorAssignmentParticipantPanel } from "@/components/marriage/MarriageCounselorAssignmentParticipantPanel";
import { isMarriageStage2ClientEnabled } from "@/lib/marriage-stage2-feature";
import { marriageHubShowsCounselorAssignmentsNav } from "@/lib/marriage-counselor-assignment-ui";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

function statusLabel(mod: MarriageHubSummary["modules"][0]) {
  if (mod.comparisonReady) return "Compare ready";
  if (mod.myStatus === "submitted" && mod.partnerStatus !== "submitted") return "Waiting for partner";
  if (mod.myStatus === "draft") return "In progress";
  if (mod.myStatus === "submitted") return "Submitted";
  return "Not started";
}

export function MarriageCounselingHub() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hub, setHub] = useState<MarriageHubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState<MarriageProgramType | null>(null);
  const load = useCallback(async () => {
    setError("");
    setNotice("");
    const res = await fetch("/api/marriage/hub", { cache: "no-store" });
    const data = await readJsonResponse<MarriageHubSummary & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load hub.");
      setHub(null);
    } else {
      setHub(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setHub(null);
      setError("");
      return;
    }
    void load();
  }, [load, authLoading, user]);

  async function startInviteProgram(programType: MarriageProgramType) {
    setStarting(programType);
    setError("");
    try {
      const res = await fetch("/api/marriage/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", programType }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not start journey.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start.");
    } finally {
      setStarting(null);
    }
  }

  async function startProgram(programType: MarriageProgramType) {
    setStarting(programType);
    setError("");
    try {
      const res = await fetch("/api/marriage/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", programType }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not start journey.");
      await load();
      router.push("/marriage/consent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start.");
    } finally {
      setStarting(null);
    }
  }

  async function recordConsent() {
    if (!hub?.journey) return;
    setError("");
    const res = await fetch("/api/marriage/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consent", journeyId: hub.journey.id }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Consent failed.");
    else await load();
  }

  if (authLoading || loading) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className={marriagePremium.cardMuted}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <MarriageCounselingGuestIntro />;
  }

  const journey = hub?.journey;
  const needsConsent = journey && !hub?.myConsent;
  const inProgressModule = hub?.modules.find(
    (m) => m.myStatus === "draft" || (m.myStatus !== "submitted" && m.partnerStatus === "submitted"),
  );
  const continueModule =
    inProgressModule ?? hub?.modules.find((m) => m.myStatus !== "submitted");

  const showMarriagePrepStaffNav =
    hub &&
    (hub.isCounselor ||
      hub.isCurriculumAdmin ||
      marriageHubShowsCounselorAssignmentsNav(hub));

  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <div className={marriagePremium.hero}>
          <p className={marriagePremium.sectionLabel}>Marriage &amp; Relationships</p>
          <h1 className={marriagePremium.heroTitle}>Before We Say &ldquo;I Do&rdquo;</h1>
          <p className={marriagePremium.heroLead}>
            A private, self-guided journey for you and your partner — with shared comparisons unlocked
            only after you both submit.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl bg-stone-100 px-3 py-2 text-sm text-night-800 dark:bg-white/10 dark:text-sand-100">
            {notice}
          </p>
        )}

        {showMarriagePrepStaffNav && (
          <div className="mt-6 grid gap-2">
            {hub.isCounselor && (
              <Link href="/marriage/counselor" className={marriagePremium.secondaryCta}>
                Counselor workspace
              </Link>
            )}
            {hub.isCurriculumAdmin && (
              <Link href="/marriage/admin/curriculum" className={marriagePremium.secondaryCta}>
                Curriculum administration
              </Link>
            )}
            {marriageHubShowsCounselorAssignmentsNav(hub) && (
              <Link
                href="/marriage/admin/counselor-assignments"
                className={marriagePremium.secondaryCta}
              >
                Counselor assignments
              </Link>
            )}
            {hub.canReviewDeletionRequests && (
              <Link href="/marriage/admin/deletion-requests" className={marriagePremium.secondaryCta}>
                Deletion requests
              </Link>
            )}
          </div>
        )}

        {!hub?.coupleLinkActive && !journey && (
          <div className="mt-6 space-y-4">
            <CouplesLinkGate pendingIncoming={hub?.pendingPartnerLink} tone="sheet" />
            <div className={marriagePremium.card}>
              <p className="font-semibold">Premarital without spouse link</p>
              <p className={`${marriagePremium.cardMuted} mt-2`}>
                Start a journey and share an invitation code — your partner joins with their own login.
                This does not mark you as married in Power Couples.
              </p>
              <button
                type="button"
                className={`${marriagePremium.primaryCta} mt-3`}
                disabled={starting !== null}
                onClick={() => startInviteProgram("premarital")}
              >
                {starting === "premarital" ? "Creating…" : "Start with invitation code"}
              </button>
              <Link href="/marriage/join" className={`${marriagePremium.secondaryCta} mt-2`}>
                Join with a code
              </Link>
            </div>
          </div>
        )}

        {hub?.coupleLinkActive && !journey && (
          <div className="mt-6 space-y-3">
            <p className={marriagePremium.cardMuted}>
              Choose a program. Power Couples membership is not required.
            </p>
            <button
              type="button"
              className={marriagePremium.primaryCta}
              disabled={starting !== null}
              onClick={() => startProgram("premarital")}
            >
              {starting === "premarital" ? "Starting…" : "Start premarital journey"}
            </button>
            <button
              type="button"
              className={marriagePremium.secondaryCta}
              disabled={starting !== null}
              onClick={() => startProgram("enrichment")}
            >
              {starting === "enrichment" ? "Starting…" : "Start marriage enrichment"}
            </button>
            <Link href="/marriage/about" className={`${marriagePremium.secondaryCta} mt-2`}>
              Learn about the program
            </Link>
          </div>
        )}

        {journey && needsConsent && (
          <div className={`${marriagePremium.card} mt-6`}>
            <p className="font-display text-base font-semibold">Consent &amp; privacy</p>
            <p className={`${marriagePremium.cardMuted} mt-2`}>
              Answers marked shared appear to your partner only after you both submit. Private and
              counselor-only responses are never shown to your partner without consent. This tool
              supports pastoral preparation — not emergency or clinical care.
            </p>
            <button type="button" className={`${marriagePremium.primaryCta} mt-4`} onClick={() => recordConsent()}>
              I understand — continue
            </button>
          </div>
        )}

        {journey && hub.myConsent && (
          <>
            <div className={`${marriagePremium.card} mt-6`}>
              <p className={marriagePremium.sectionLabel}>My journey</p>
              <p className="mt-1 font-display text-lg font-semibold capitalize">
                {hub.programType?.replace("_", " ")}
              </p>
              {hub.partnerName && (
                <p className={`${marriagePremium.cardMuted} mt-1`}>With {hub.partnerName}</p>
              )}
              {!hub.partnerJoined && hub.pendingInviteCode && (
                <div className="mt-3 rounded-xl bg-clay-50 px-3 py-2 dark:bg-clay-950/40">
                  <p className="text-xs font-bold uppercase text-clay-800 dark:text-clay-200">Partner invite code</p>
                  <p className="font-mono text-lg font-bold tracking-widest">{hub.pendingInviteCode}</p>
                  <p className={`${marriagePremium.cardMuted} mt-1`}>Share privately; expires in 14 days.</p>
                </div>
              )}
              {hub.partnerJoined && !hub.partnerConsent && (
                <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                  Waiting for your partner to accept consent on their device.
                </p>
              )}
              {hub.counselorSummary && hub.counselorSummary.status !== "none" && (
                <p className={`${marriagePremium.cardMuted} mt-2`}>
                  {hub.counselorSummary.status === "assigned" && hub.counselorSummary.displayName
                    ? `Premarital counselor: ${hub.counselorSummary.displayName}`
                    : hub.counselorSummary.status === "pending_approval" &&
                        hub.counselorSummary.displayName
                      ? `Proposed counselor ${hub.counselorSummary.displayName} — awaiting Senior Pastor approval`
                      : hub.counselorSummary.status === "awaiting_restoration" &&
                          hub.counselorSummary.displayName
                        ? `Counselor ${hub.counselorSummary.displayName} — acknowledgment required before access`
                        : null}
                </p>
              )}
            </div>

            {isMarriageStage2ClientEnabled() && hub.stage2?.enabled && (
              <MarriageStage2HubPromo
                resumeModuleId={hub.stage2.resumeModuleId}
                activitiesCompleted={hub.stage2.modulesCompleted}
                activitiesTotal={hub.stage2.activitiesTotal}
              />
            )}

            {continueModule && (
              <div className="mt-4">
                <Link
                  href={`/marriage/module/${continueModule.moduleId}`}
                  className={marriagePremium.primaryCta}
                >
                  Continue assessment
                </Link>
              </div>
            )}

            {(hub.sessionHomework?.length ?? 0) > 0 && (
              <div className={`${marriagePremium.card} mt-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={marriagePremium.sectionLabel}>My homework</p>
                  <Link href="/marriage/homework" className="text-xs font-bold text-clay-700 underline dark:text-clay-300">
                    View all
                  </Link>
                </div>
                <ul className="mt-2 space-y-2">
                  {hub.sessionHomework.map((item) => (
                    <li key={item.id} className="text-sm">
                      <Link href={`/marriage/homework/${item.id}`} className="font-semibold text-clay-900 dark:text-sand-100">
                        {item.title}
                      </Link>
                      <p className="text-xs capitalize text-night-500">{item.status.replace(/_/g, " ")}</p>
                      {item.dueAt ? (
                        <p className="text-xs text-night-500">
                          Due {formatMarriageSessionScheduledAt(item.dueAt, item.dueAtTimeZone)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hub.upcomingHomework.length > 0 && (
              <div className={`${marriagePremium.card} mt-4`}>
                <p className={marriagePremium.sectionLabel}>Homework</p>
                <ul className="mt-2 space-y-2">
                  {hub.upcomingHomework.map((item) => (
                    <li key={item.id} className="text-sm">
                      <p className="font-semibold">{item.title}</p>
                      {item.dueAt && (
                        <p className="text-xs text-night-500">
                          Due {formatMarriageSessionScheduledAt(item.dueAt, item.dueAtTimeZone)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="mt-1 text-xs font-bold text-clay-700 underline"
                        onClick={async () => {
                          await fetch("/api/marriage/assignments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ assignmentId: item.id }),
                          });
                          await load();
                        }}
                      >
                        Mark complete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`${marriagePremium.card} mt-4`}>
              <p className={marriagePremium.sectionLabel}>Upcoming counseling</p>
              {hub.upcomingSessions.length === 0 ? (
                <p className="mt-2 text-sm text-night-500">
                  No counseling sessions scheduled yet. Your counselor will add appointments here.
                </p>
              ) : (
                <ul className="mt-3 space-y-3" aria-label="Upcoming counseling sessions">
                  {hub.upcomingSessions.map((session, index) => (
                    <li
                      key={session.id}
                      className={`rounded-xl border px-3 py-3 text-sm ${
                        index === 0
                          ? "border-clay-400 bg-stone-50 dark:border-clay-600 dark:bg-white/5"
                          : "border-stone-200 dark:border-white/10"
                      }`}
                    >
                      {index === 0 ? (
                        <p className="text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-300">
                          Next session
                        </p>
                      ) : null}
                      <p className="mt-0.5 font-semibold text-night-900 dark:text-sand-100">
                        {session.topic?.trim() || "Counseling session"}
                      </p>
                      <p className="mt-1 font-medium">
                        {formatMarriageSessionScheduledAt(
                          session.scheduledAt,
                          session.schedulingTimeZone,
                        )}
                      </p>
                      {session.zoomUrl ? (
                        <a
                          href={session.zoomUrl}
                          className="mt-2 inline-block text-sm font-semibold text-clay-700 underline dark:text-clay-300"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Zoom link
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <p className={`${marriagePremium.sectionLabel} mb-3`}>Learning modules</p>
              <ul className="space-y-2">
                {hub.modules.map((mod) => (
                  <li key={mod.moduleId} className={marriagePremium.moduleRow}>
                    <Link href={`/marriage/module/${mod.moduleId}`} className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{mod.title}</span>
                      <span className="block text-xs text-night-500 dark:text-sand-400">
                        {statusLabel(mod)}
                      </span>
                    </Link>
                    {mod.comparisonReady && (
                      <Link
                        href={`/marriage/module/${mod.moduleId}/compare`}
                        className="shrink-0 rounded-full bg-clay-100 px-3 py-1 text-xs font-bold text-clay-900 dark:bg-clay-800 dark:text-clay-50"
                      >
                        Compare
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-2">
              <Link href="/marriage/homework" className={marriagePremium.secondaryCta}>
                My homework
              </Link>
              <Link href="/marriage/journal" className={marriagePremium.secondaryCta}>
                Couple journal
              </Link>
              <Link href="/couples" className={marriagePremium.secondaryCta}>
                Power Couples resources (optional)
              </Link>
              {journey && hub.viewerId && (
                <MarriageCounselorAssignmentParticipantPanel
                  journeyId={journey.id}
                  viewerUserId={hub.viewerId}
                />
              )}
              {journey?.deletionRequestedAt && journey.status === "active" && (
                <div className={`${marriagePremium.card} mt-4 border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20`}>
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                    Pastoral review requested
                  </p>
                  <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90">
                    You asked staff to review this journey for possible archival. Records are not permanently
                    erased by this request. Both partners see this status until staff archive or dismiss the
                    request.
                  </p>
                </div>
              )}

              {journey && (
                <>
                  <button
                    type="button"
                    className={marriagePremium.secondaryCta}
                    onClick={async () => {
                      const res = await fetch(`/api/marriage/privacy?journeyId=${journey.id}`);
                      const data = await res.json();
                      if (res.ok) {
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `marriage-journey-${journey.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } else setError(data.error ?? "Export failed.");
                    }}
                  >
                    Export my journey data
                  </button>
                  <button
                    type="button"
                    className={marriagePremium.secondaryCta}
                    disabled={Boolean(journey.deletionRequestedAt && journey.status === "active")}
                    onClick={async () => {
                      setError("");
                      setNotice("");
                      const res = await fetch("/api/marriage/privacy", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "request_deletion", journeyId: journey.id }),
                      });
                      const data = await readJsonResponse<{ error?: string; message?: string }>(res);
                      if (!res.ok) setError(data.error ?? "Request failed.");
                      else {
                        setNotice(data.message ?? "Request recorded.");
                        await load();
                      }
                    }}
                  >
                    Request pastoral review (archive)
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
