"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  COUPLES_COMMUNITY_GROUP_ID,
  type CouplesCommunityFeedMode,
} from "@/lib/couples-community-constants";
import { couplesCommunityFeedPath, couplesCommunityHubBackPath } from "@/lib/couples-community-paths";
import { powerCouplesGroupSectionPath } from "@/lib/couples-hub-paths";
import type { CommunityPost } from "@/lib/member-types";
import type { CommunityFeedFilter } from "@/lib/community-ui-utils";

const FEED_NAV: { id: CouplesCommunityFeedMode; label: string }[] = [
  { id: "discussions", label: "Discussions" },
  { id: "prayer", label: "Prayer" },
  { id: "announcements", label: "Announcements" },
];

const MODE_COPY: Record<
  CouplesCommunityFeedMode,
  { title: string; subtitle: string }
> = {
  discussions: {
    title: "Discussions",
    subtitle: "Marriage conversations with other Power Couples — share ideas and learn together.",
  },
  prayer: {
    title: "Prayer community",
    subtitle: "Prayer and praise for your group on the Community wall (members only).",
  },
  announcements: {
    title: "Announcements",
    subtitle: "Updates from Power Couples leaders and ministry team.",
  },
};

export function CouplesCommunityFeedLayout({
  mode,
  initialPosts,
  initialFilter,
  groupName,
  embedded = false,
  onBack,
}: {
  mode: CouplesCommunityFeedMode;
  initialPosts: CommunityPost[];
  initialFilter: CommunityFeedFilter;
  groupName: string;
  embedded?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const copy = MODE_COPY[mode];

  const hubTabs = [
    { id: "discussions" as const, label: "Discussions" },
    { id: "events" as const, label: "Events" },
    { id: "resources" as const, label: "Resources" },
  ];

  function onHubTabChange(id: string) {
    if (id === "discussions") {
      router.push(couplesCommunityFeedPath("discussions"));
      return;
    }
    if (id === "events") {
      router.push(powerCouplesGroupSectionPath("calendar"));
      return;
    }
    if (id === "resources") {
      router.push(powerCouplesGroupSectionPath("resources"));
    }
  }

  const feedNav = (
    <CouplesHubTabRow
      variant="sheet"
      tabs={FEED_NAV}
      active={mode}
      onChange={(id) => {
        if (id !== mode) router.push(couplesCommunityFeedPath(id));
      }}
    />
  );

  const body = (
    <>
      <p className={couplesHubPremium.sheetSubtitle}>{copy.subtitle}</p>
      <div className="mt-4">{feedNav}</div>
      <div className="couples-community-feed mt-5 min-w-0">
        <CommunityFeed
          initialPosts={initialPosts}
          initialFilter={initialFilter}
          initialGroupId={COUPLES_COMMUNITY_GROUP_ID}
          groupFilterLabel={groupName}
          hideFilterTabs
          lockedFilter={mode === "announcements" ? "announcement" : mode === "discussions" ? "all" : undefined}
          excludePostTypes={mode === "discussions" ? ["announcement"] : undefined}
          includePostTypes={mode === "prayer" ? ["prayer", "praise"] : undefined}
        />
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="px-4 pb-8">
        <button type="button" className={couplesHubPremium.backLink} onClick={onBack}>
          <span aria-hidden>←</span> Couples Hub
        </button>
        <h2 className={`${couplesHubPremium.screenTitle} mt-3`}>Couples community</h2>
        <div className="mt-4">
          <CouplesHubTabRow variant="dark" tabs={hubTabs} active="discussions" onChange={onHubTabChange} />
        </div>
        <div className={`${couplesHubPremium.menuPanel} mt-4`}>{body}</div>
      </div>
    );
  }

  return (
    <CouplesHubScreen
      title="Couples Community"
      backHref={onBack ? undefined : couplesCommunityHubBackPath()}
      backLabel={onBack ? undefined : "Couples Hub"}
      sheetClassName="!pb-32"
      fab={{
        label: "Start a post",
        onClick: () => {
          document.querySelector<HTMLButtonElement>(".community-composer-trigger")?.click();
        },
      }}
    >
      <CouplesHubTabRow
        variant="sheet"
        tabs={hubTabs}
        active="discussions"
        onChange={onHubTabChange}
      />
      <h2 className="mt-5 font-display text-xl font-semibold text-stone-900">{copy.title}</h2>
      {body}
      <p className="mt-6 text-center text-xs text-[var(--couples-sheet-muted)]">
        <Link href={couplesCommunityFeedPath("prayer")} className="font-semibold underline">
          Prayer
        </Link>
        {" · "}
        <Link href={couplesCommunityFeedPath("announcements")} className="font-semibold underline">
          Announcements
        </Link>
      </p>
    </CouplesHubScreen>
  );
}
