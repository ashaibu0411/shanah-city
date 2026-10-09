"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { CouplesMarriageFeatureIcon } from "@/components/couples/CouplesMarriageFeatureIcons";
import {
  CouplesLoadingSkeleton,
  CouplesMarriageFeatureCard,
  CouplesPageHeader,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";
import type { CoupleCalendarPlannable } from "@/lib/couple-calendar-types";
import { COUPLES_MARRIAGE_FEATURE_CARDS } from "@/lib/couples-marriage-dashboard-config";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";
import { getPublicDisplayName } from "@/lib/member-display-name";

function pickNextMoment(items: CoupleCalendarPlannable[]): CoupleCalendarPlannable | null {
  const now = Date.now();
  const upcoming = items
    .map((item) => {
      const t = new Date(item.startAt).getTime();
      return { item, t };
    })
    .filter((entry) => !Number.isNaN(entry.t) && entry.t >= now - 60_000)
    .sort((a, b) => a.t - b.t);
  return upcoming[0]?.item ?? null;
}

function formatMomentMeta(item: CoupleCalendarPlannable) {
  const start = new Date(item.startAt);
  if (Number.isNaN(start.getTime())) {
    return item.time ?? item.schedule ?? "Upcoming";
  }
  const datePart = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (item.allDay) return datePart;
  const timePart = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function CoupleAvatarBubble({
  userId,
  name,
  avatarUrl,
  updatedAt,
  className = "",
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  updatedAt?: string | null;
  className?: string;
}) {
  const src = getMemberAvatarApiUrl(userId, avatarUrl ?? undefined, updatedAt ?? undefined);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`relative inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--couples-surface)] ${className}`}
    >
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes="44px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-[var(--couples-mocha)] text-sm font-semibold text-white">
          {initial}
        </span>
      )}
    </span>
  );
}

export function CouplesMarriageDashboard({
  backHref,
  onBack,
  embedded = false,
}: {
  backHref?: string;
  onBack?: () => void;
  /** When true, omits outer page shell (Power Couples group hub). */
  embedded?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  const [partnerUpdatedAt, setPartnerUpdatedAt] = useState<string | null>(null);
  const [nextMoment, setNextMoment] = useState<CoupleCalendarPlannable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedBackHref = backHref ?? powerCouplesGroupHubPath();

  useEffect(() => {
    void fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load.");
        const nextOverview = data.overview ?? null;
        setOverview(nextOverview);
        if (!nextOverview?.hasActiveLink) {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!overview?.hasActiveLink) {
      setLoading(false);
      return;
    }

    void Promise.all([
      fetch("/api/couple-link").then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.link?.partnerId) return;
        setPartnerId(data.link.partnerId);
        setPartnerAvatarUrl(data.link.partnerAvatarUrl ?? null);
        setPartnerUpdatedAt(data.link.partnerUpdatedAt ?? null);
      }),
      fetch("/api/couples/calendar").then(async (response) => {
        const data = await response.json();
        if (!response.ok) return;
        const items = (data.items ?? []) as CoupleCalendarPlannable[];
        setNextMoment(pickNextMoment(items));
      }),
    ])
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [overview?.hasActiveLink]);

  const locked = !overview?.hasActiveLink;
  const partnerName = overview?.partnerName ?? "Spouse";

  const shellClass = embedded
    ? "couples-marriage-dashboard pb-28"
    : `${couplesHubPremium.page} couples-hub-typography min-h-full`;

  const content = (
    <>
      <CouplesPageHeader
        title="Our Marriage"
        backHref={onBack ? undefined : resolvedBackHref}
        onBack={onBack}
        backLabel="Back to Power Couples"
        rightSlot={<MemberAvatarLink user={user} loading={authLoading} size="sm" className="!h-10 !w-10 ring-white/20" />}
      />

      <div className="mx-auto w-full max-w-lg px-[var(--couples-page-padding)] pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2
              className="font-[family-name:var(--font-couples-display)] text-[1.625rem] font-semibold leading-tight text-[var(--couples-text)]"
            >
              Growing Together
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--couples-muted)]">
              Every day is another opportunity to love intentionally.
            </p>
          </div>
          {overview?.hasActiveLink && user && partnerId ? (
            <div className="flex shrink-0 items-center pt-1" aria-label={`You and ${partnerName}`}>
              <CoupleAvatarBubble
                userId={user.id}
                name={getPublicDisplayName(user)}
                avatarUrl={user.avatarUrl}
                updatedAt={user.updatedAt}
                className="z-10"
              />
              <CoupleAvatarBubble
                userId={partnerId}
                name={partnerName}
                avatarUrl={partnerAvatarUrl}
                updatedAt={partnerUpdatedAt}
                className="-ml-3 z-0"
              />
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        {loading && !locked ? (
          <div className="mt-8">
            <CouplesLoadingSkeleton rows={4} />
          </div>
        ) : locked ? (
          <div className="mt-6">
            <CouplesLinkGate tone="sheet" pendingIncoming={overview?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {COUPLES_MARRIAGE_FEATURE_CARDS.map((card) => (
                <CouplesMarriageFeatureCard
                  key={card.id}
                  title={card.title}
                  href={card.href}
                  background={card.background}
                  icon={<CouplesMarriageFeatureIcon variant={card.variant} />}
                />
              ))}
            </div>

            <section className="mt-8">
              <h3 className="font-[family-name:var(--font-couples-display)] text-[1.125rem] font-semibold text-[var(--couples-text)]">
                Our Next Moment
              </h3>
              {nextMoment ? (
                <Link
                  href="/couples/marriage/calendar"
                  className="mt-3 flex items-center gap-3 rounded-[1.25rem] bg-[var(--couples-surface)] px-4 py-3.5 transition active:scale-[0.99] motion-reduce:transition-none"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--couples-blue)] text-center"
                    aria-hidden
                  >
                    <span className="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--couples-mocha)]">
                      {new Date(nextMoment.startAt).toLocaleDateString(undefined, { month: "short" })}
                    </span>
                    <span className="text-lg font-semibold leading-none text-[var(--couples-mocha)]">
                      {new Date(nextMoment.startAt).getDate()}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">
                      {nextMoment.title}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-[var(--couples-muted)]">
                      {formatMomentMeta(nextMoment)}
                    </span>
                  </span>
                  <span className="text-[var(--couples-muted)]" aria-hidden>›</span>
                </Link>
              ) : (
                <div className="mt-3 rounded-[1.25rem] bg-[var(--couples-surface)] px-4 py-5 text-center text-sm text-[var(--couples-muted)]">
                  No shared moments on the calendar yet.
                  <Link
                    href="/couples/marriage/calendar"
                    className="mt-2 block text-sm font-semibold text-[var(--couples-gold)]"
                  >
                    Plan something together
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className={shellClass}>{content}</div>;
  }

  return (
    <div className={shellClass}>
      <div className="mx-auto w-full max-w-lg">{content}</div>
    </div>
  );
}
