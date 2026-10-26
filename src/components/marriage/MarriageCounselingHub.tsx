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
import {
  fetchMarriageHubSummaryClient,
  marriageHubLoadErrorMessage,
  resolveMarriageHubPageGate,
} from "@/lib/marriage-hub-client";
import { MarriageStage2HubPromo } from "@/components/marriage/MarriageStage2HubPromo";
import { MarriageCounselorAssignmentParticipantPanel } from "@/components/marriage/MarriageCounselorAssignmentParticipantPanel";
import { isMarriageStage2ClientEnabled } from "@/lib/marriage-stage2-feature";
import { marriageHubShowsCounselorAssignmentsNav } from "@/lib/marriage-counselor-assignment-ui";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { MarriageCoupleHubDashboard } from "@/components/marriage/MarriageCoupleHubDashboard";
import { MarriageCoupleOnboardingSteps } from "@/components/marriage/MarriageCoupleOnboardingSteps";

function statusLabel(mod: MarriageHubSummary["modules"][0]) {
  if (mod.comparisonReady) return "Compare ready";
  if (mod.myStatus === "submitted" && mod.partnerStatus !== "submitted") return "Waiting for partner";
  if (mod.myStatus === "draft") return "In progress";
  if (mod.myStatus === "submitted") return "Submitted";
  return "Not started";
}

export function MarriageCounselingHub() {
  const router = useRouter();
  const { user, loading: authLoading, permissions } = useAuth();
  const [hub, setHub] = useState<MarriageHubSummary | null>(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [hubLoadError, setHubLoadError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState<MarriageProgramType | null>(null);
  const load = useCallback(async () => {
    setError("");
    setNotice("");
    setHubLoadError(null);
    setHubLoading(true);
    try {
      const result = await fetchMarriageHubSummaryClient();
      if (result.ok) {
        setHub(result.data);
        setHubLoadError(null);
      } else {
        setHub(null);
        setHubLoadError(marriageHubLoadErrorMessage(result));
      }
    } finally {
      setHubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHubLoading(false);
      setHub(null);
      setHubLoadError(null);
      setError("");
      return;
    }
    void load();
  }, [load, authLoading, user]);

  const pageGate = resolveMarriageHubPageGate({
    authLoading,
    hubLoading,
    userId: user?.id,
    hubLoadError,
  });

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
      router.push("/marriage/consent");
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

  if (pageGate === "loading") {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className={marriagePremium.cardMuted} aria-busy="true">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (pageGate === "guest") {
    return <MarriageCounselingGuestIntro />;
  }

  if (pageGate === "sign_in_required") {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <div className={marriagePremium.card} role="alert">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              Your session expired
            </p>
            <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
              Sign in again to open Marriage Prep. In the installed app, use the same account you use
              on the website so your journey stays in sync.
            </p>
            <Link href="/sign-in?next=/marriage" className={`${marriagePremium.primaryCta} mt-4 inline-block`}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageGate === "error" && hubLoadError) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <div className={marriagePremium.card} role="alert">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              Could not load Marriage Prep
            </p>
            <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>{hubLoadError}</p>
            <button type="button" className={`${marriagePremium.primaryCta} mt-4`} onClick={() => void load()}>
              Try again
            </button>
            <Link href="/" className={`${marriagePremium.secondaryCta} mt-3 inline-block`}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <div className={marriagePremium.card} role="alert">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              Marriage Prep did not finish loading
            </p>
            <button type="button" className={`${marriagePremium.primaryCta} mt-4`} onClick={() => void load()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const journey = hub.journey;
  const needsConsent = journey && !hub.myConsent;
  const inProgressModule = hub?.modules.find(
    (m) => m.myStatus === "draft" || (m.myStatus !== "submitted" && m.partnerStatus === "submitted"),
  );
  const continueModule =
    inProgressModule ?? hub?.modules.find((m) => m.myStatus !== "submitted");

  const showCounselorAssignmentsNav =
    permissions.canAccessMarriageCounselorAssignments ||
    (hub ? marriageHubShowsCounselorAssignmentsNav(hub) : false);

  const showMarriagePrepStaffNav =
    hub &&
    (hub.isCounselor ||
      hub.isCurriculumAdmin ||
      showCounselorAssignmentsNav ||
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

        {!showMarriagePrepStaffNav && showCounselorAssignmentsNav && (
          <div className="mt-6 grid gap-2">
            <Link
              href="/marriage/admin/counselor-assignments"
              className={marriagePremium.secondaryCta}
            >
              Counselor assignments
            </Link>
          </div>
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
            {showCounselorAssignmentsNav && (
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

        {hub?.coupleOnboarding && !journey ? (
          <MarriageCoupleOnboardingSteps onboarding={hub.coupleOnboarding} />
        ) : null}

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

        {journey && needsConsent && hub?.coupleOnboarding ? (
          <MarriageCoupleOnboardingSteps onboarding={hub.coupleOnboarding} />
        ) : null}

        {journey && needsConsent && hub.journey ? (
          <div className="mt-6">
            <Link href="/marriage/consent" className={`${marriagePremium.primaryCta} inline-block`}>
              Review &amp; record your consent
            </Link>
            <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
              Consent is recorded separately for each partner — not when you create or accept an invitation.
            </p>
          </div>
        ) : null}

        {journey && hub.myConsent && (
          <>
            <MarriageCoupleHubDashboard
              hub={hub}
              continueModuleHref={continueModule ? `/marriage/module/${continueModule.moduleId}` : null}
            />

            {hub.counselorSummary && hub.counselorSummary.status !== "none" && hub.counselorSummary.status !== "assigned" ? (
              <p className={`${marriagePremium.cardMuted} mt-2 px-1 text-sm`}>
                {hub.counselorSummary.status === "pending_approval" && hub.counselorSummary.displayName
                  ? `Proposed counselor ${hub.counselorSummary.displayName} — awaiting Senior Pastor approval`
                  : hub.counselorSummary.status === "awaiting_restoration" && hub.counselorSummary.displayName
                    ? `Counselor ${hub.counselorSummary.displayName} — acknowledgment required before access`
                    : null}
              </p>
            ) : null}

            {isMarriageStage2ClientEnabled() && hub.stage2?.enabled && (
              <MarriageStage2HubPromo
                resumeModuleId={hub.stage2.resumeModuleId}
                activitiesCompleted={hub.stage2.modulesCompleted}
                activitiesTotal={hub.stage2.activitiesTotal}
              />
            )}

            {hub.upcomingSessions.length === 0 ? (
              <p className={`${marriagePremium.cardMuted} mt-4 text-sm`}>
                No counseling sessions scheduled yet. Your counselor will add appointments when ready.
              </p>
            ) : null}

            <div className="mt-6 min-w-0">
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
