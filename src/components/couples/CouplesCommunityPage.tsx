"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CouplesCommunityDiscussionsTab } from "@/components/couples/CouplesCommunityDiscussionsTab";
import { CouplesCommunityEventsTab } from "@/components/couples/CouplesCommunityEventsTab";
import { CouplesCommunityHeader } from "@/components/couples/CouplesCommunityHeader";
import { CouplesCommunityResourcesTab } from "@/components/couples/CouplesCommunityResourcesTab";
import { CouplesHubSheet } from "@/components/couples/CouplesHubSheet";
import { CouplesLoadingSkeleton } from "@/components/couples/design-system";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import type { CommunityFeedFilter } from "@/lib/community-ui-utils";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import type { CommunityPost } from "@/lib/member-types";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";

export type CouplesCommunityTab = "discussions" | "events" | "resources";

export function CouplesCommunityPage({
  initialPosts,
  initialFilter,
  groupName,
}: {
  initialPosts: CommunityPost[];
  initialFilter: CommunityFeedFilter;
  groupName: string;
}) {
  const [tab, setTab] = useState<CouplesCommunityTab>("discussions");
  const [overview, setOverview] = useState<CouplesHubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const designPreview = searchParams.get("designPreview") === "1";

  const isMember = designPreview || Boolean(overview?.isPowerCouplesMember);
  const showBody = designPreview || !loading;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setOverview(data.overview ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  return (
    <div
      className={`${couplesHubPremium.page} couples-hub-typography couples-community-page -mx-4 w-[calc(100%+2rem)] min-h-full bg-[var(--couples-midnight)] sm:mx-0 sm:w-full`}
    >
      <div className="mx-auto w-full max-w-lg">
        <CouplesCommunityHeader />

        <CouplesHubSheet overlap className="couples-community-sheet !px-[var(--couples-page-padding)] !pb-28 !pt-4">
          <CouplesHubTabRow
            variant="community"
            tabs={[
              { id: "discussions", label: "Discussions" },
              { id: "events", label: "Events" },
              { id: "resources", label: "Resources" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-5">
            {!showBody ? (
              <CouplesLoadingSkeleton rows={4} />
            ) : !isMember ? (
              <div className="rounded-[1.125rem] bg-white p-6 text-center shadow-sm ring-1 ring-[var(--couples-border)]">
                <p className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                  Join Power Couples
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--couples-muted)]">
                  Discussions, events, and resources are for Shanah Power Couples members. Your private
                  marriage space stays separate.
                </p>
                <Link
                  href={`/groups/${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`}
                  className="couples-btn-primary mt-5 inline-flex min-h-[2.75rem] items-center justify-center rounded-[var(--couples-radius-button)] px-5 py-3 text-sm font-semibold text-white"
                >
                  View group & join
                </Link>
              </div>
            ) : tab === "discussions" ? (
              <CouplesCommunityDiscussionsTab
                initialPosts={initialPosts}
                initialFilter={initialFilter}
                groupName={groupName}
                composeOpen={composeOpen}
                onComposeOpenChange={setComposeOpen}
              />
            ) : tab === "events" ? (
              <CouplesCommunityEventsTab />
            ) : (
              <CouplesCommunityResourcesTab />
            )}
          </div>
        </CouplesHubSheet>
      </div>

      {isMember && user && tab === "discussions" ? (
        <button
          type="button"
          aria-label="Create post"
          onClick={() => setComposeOpen(true)}
          className={couplesHubPremium.sheetFab}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
