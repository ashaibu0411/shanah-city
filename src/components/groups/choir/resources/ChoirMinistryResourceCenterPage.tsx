"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirResourceTabs } from "@/components/groups/choir/resources/ChoirResourceTabs";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  choirBuiltinHelpfulLinks,
  choirOnboardingLinks,
} from "@/lib/choir-resource-onboarding";
import { choirResourcesHref, choirResourcesLibraryHref } from "@/lib/choir-resource-links";
import type { ChoirResourceCardView, ChoirResourceHomePayload, ChoirResourceTabId } from "@/lib/choir-resource-types";
import "../choir-premium.css";

type ChoirMinistryResourceCenterPageProps = {
  groupId: string;
};

function parseTab(value: string | null): ChoirResourceTabId {
  if (value === "guides" || value === "onboarding" || value === "forms" || value === "links") return value;
  return "resources";
}

function ResourceOpenLink({
  resource,
  className,
  children,
}: {
  resource: ChoirResourceCardView;
  className?: string;
  children: React.ReactNode;
}) {
  if (!resource.url || resource.href.startsWith("#")) {
    return <span className={className}>{children}</span>;
  }
  if (resource.url.startsWith("/")) {
    return (
      <Link href={resource.url} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={resource.url} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function ChoirMinistryResourceCenterPage({ groupId }: ChoirMinistryResourceCenterPageProps) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const libraryView = searchParams.get("view") === "library";

  const [payload, setPayload] = useState<ChoirResourceHomePayload | null>(null);
  const [tabResources, setTabResources] = useState<ChoirResourceCardView[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestCategory, setRequestCategory] = useState("General");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  const loadHome = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-resources?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load resources.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load resources.");
        setLoading(false);
      });
  }, [groupId]);

  const loadTabResources = useCallback(() => {
    if (tab === "resources" && !libraryView) return;
    const listTab = tab === "resources" && libraryView ? "resources" : tab;
    const params = new URLSearchParams({
      groupId,
      view: "list",
      tab: listTab,
    });
    if (search.trim()) params.set("q", search.trim());
    fetch(`/api/groups/choir-resources?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.resources) setTabResources(data.resources);
      })
      .catch(() => undefined);
  }, [groupId, tab, search, libraryView]);

  useEffect(() => {
    loadHome();
    window.scrollTo(0, 0);
  }, [loadHome]);

  useEffect(() => {
    loadTabResources();
  }, [loadTabResources]);

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setRequestBusy(true);
    setRequestMessage(null);
    const response = await fetch("/api/groups/choir-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_resource",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        category: requestCategory,
        title: requestTitle,
        description: requestDescription,
      }),
    });
    const data = await response.json();
    setRequestBusy(false);
    if (!response.ok) {
      setRequestMessage(data.error ?? "Could not submit request.");
      return;
    }
    setRequestMessage("Request submitted. Worship leadership will follow up.");
    setRequestTitle("");
    setRequestDescription("");
    setTimeout(() => setRequestOpen(false), 1200);
  }

  if (loading && !payload) {
    return (
      <div className="choir-group-home choir-resources-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading resource center…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-resources-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  const quickCards = [
    { title: "Ministry Guides", sub: "Policies & standards", href: choirResourcesHref(groupId, "guides"), icon: "📖" },
    { title: "Team Onboarding", sub: "New team members", href: choirResourcesHref(groupId, "onboarding"), icon: "👥" },
    { title: "Forms & Templates", sub: "Downloads & tools", href: choirResourcesHref(groupId, "forms"), icon: "📄" },
    {
      title: "Reading & Videos",
      sub: "Grow in your calling",
      href: choirResourcesHref(groupId, "links"),
      icon: "▶",
    },
    { title: "Helpful Links", sub: "Quick access", href: choirResourcesHref(groupId, "links"), icon: "🔗" },
  ];

  return (
    <div className="choir-group-home choir-resources-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={payload.groupChatHref} />
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Ministry resources</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Guides, forms, and tools for Shanah Worship.</p>
      </div>
      <ChoirResourceTabs groupId={groupId} active={tab} />

      {tab === "resources" && !libraryView ? (
        <ResourcesHomeTab
          groupId={groupId}
          payload={payload}
          quickCards={quickCards}
          onRequest={() => setRequestOpen(true)}
        />
      ) : null}

      {tab === "resources" && libraryView ? (
        <ResourceListTab
          title="Resource library"
          resources={tabResources}
          search={search}
          onSearch={setSearch}
          emptyMessage="No published resources match your search."
        />
      ) : null}

      {tab === "guides" ? (
        <ResourceListTab
          title="Ministry Guides & Standards"
          subtitle="Everything we need to serve with excellence, unity, and accountability."
          resources={tabResources}
          search={search}
          onSearch={setSearch}
          emptyMessage="No ministry guides have been published yet."
        />
      ) : null}

      {tab === "forms" ? (
        <ResourceListTab
          title="Forms & Templates"
          subtitle="Useful documents and requests for serving in ministry."
          resources={tabResources}
          search={search}
          onSearch={setSearch}
          emptyMessage="No forms or templates are available yet."
        />
      ) : null}

      {tab === "links" ? (
        <HelpfulLinksTab groupId={groupId} published={tabResources.length > 0 ? tabResources : payload.helpfulLinks} />
      ) : null}

      {tab === "onboarding" ? <OnboardingTab groupId={groupId} resources={tabResources} /> : null}

      {payload.canManage ? (
        <Link href={payload.manageHref} className="choir-setlist-manage-link block text-center">
          Manage resources →
        </Link>
      ) : null}

      {requestOpen ? (
        <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={() => setRequestOpen(false)}>
          <div className="choir-setlist-sheet" role="dialog" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Request a resource</h2>
            <form className="mt-4 space-y-3" onSubmit={submitRequest}>
              <input
                className="choir-setlist-search w-full"
                placeholder="Category"
                value={requestCategory}
                onChange={(event) => setRequestCategory(event.target.value)}
              />
              <input
                className="choir-setlist-search w-full"
                placeholder="Resource title or topic"
                value={requestTitle}
                onChange={(event) => setRequestTitle(event.target.value)}
                required
              />
              <textarea
                className="choir-announcement-textarea w-full min-h-[96px]"
                placeholder="What do you need?"
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                required
              />
              {requestMessage ? <p className="text-sm text-[var(--choir-body)]">{requestMessage}</p> : null}
              <button type="submit" className="choir-btn-primary w-full" disabled={requestBusy}>
                Submit request
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResourcesHomeTab({
  groupId,
  payload,
  quickCards,
  onRequest,
}: {
  groupId: string;
  payload: ChoirResourceHomePayload;
  quickCards: { title: string; sub: string; href: string; icon: string }[];
  onRequest: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="choir-calendar-hero choir-page-bleed">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover object-center" sizes="100vw" priority />
        <div className="choir-calendar-hero-overlay" />
        <div className="choir-calendar-hero-copy">
          <p className="choir-calendar-hero-kicker">Ministry Resource Center</p>
          <h2 className="choir-calendar-hero-title font-display">Equipped for the Assignment.</h2>
          <p className="choir-calendar-hero-sub">
            Guides, training materials, policies and tools to help our worship team serve with excellence.
          </p>
        </div>
      </div>

      <div className="choir-resource-quick-row">
        {quickCards.map((card) => (
          <Link key={card.title} href={card.href} className="choir-resource-quick-card">
            <span className="choir-resource-quick-icon" aria-hidden>{card.icon}</span>
            <p className="choir-resource-quick-title">{card.title}</p>
            <p className="choir-resource-quick-sub">{card.sub}</p>
            <span className="choir-resource-quick-chevron" aria-hidden>›</span>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="choir-section-heading text-base">Featured resources</h2>
          <Link href={choirResourcesLibraryHref(groupId)} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        {payload.featured.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No featured resources yet.</p>
        ) : (
          <div className="choir-resource-featured-row">
            {payload.featured.slice(0, 3).map((resource) => (
              <FeaturedCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="choir-section-heading text-base">Resource library</h2>
          <Link href={choirResourcesLibraryHref(groupId)} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        {payload.library.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No documents published yet.</p>
        ) : (
          <ul className="space-y-2">
            {payload.library.slice(0, 4).map((resource) => (
              <li key={resource.id}>
                <ResourceRow resource={resource} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="choir-section-heading text-base">Helpful links</h2>
          <Link href={choirResourcesHref(groupId, "links")} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        <div className="choir-resource-links-row">
          {(payload.helpfulLinks.length > 0
            ? payload.helpfulLinks.slice(0, 4)
            : choirBuiltinHelpfulLinks(groupId).map((link) => ({
                id: link.title,
                title: link.title,
                description: link.description,
                href: link.href,
              }))
          ).map((item) => (
            <Link key={item.id ?? item.title} href={item.href} className="choir-resource-link-card">
              <p className="font-bold text-[var(--choir-heading)]">{item.title}</p>
              <p className="text-xs text-[var(--choir-muted)]">{item.description}</p>
              <span aria-hidden>›</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="choir-resource-request-panel">
        <span className="choir-resource-request-icon" aria-hidden>💡</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--choir-heading)]">Can&apos;t find a resource?</p>
          <p className="text-sm text-[var(--choir-muted)]">
            Let the worship leadership team know. We&apos;ll help you find what you need.
          </p>
        </div>
        <button type="button" className="choir-resource-request-btn" onClick={onRequest}>
          Request a Resource <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  );
}

function FeaturedCard({ resource }: { resource: ChoirResourceCardView }) {
  return (
    <ResourceOpenLink resource={resource} className="choir-resource-featured-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resource.coverImagePath} alt="" className="choir-resource-featured-img" />
      {resource.featuredBadge ? (
        <span className="choir-resource-featured-badge">{resource.featuredBadge}</span>
      ) : null}
      <p className="choir-resource-featured-title">{resource.title}</p>
      <p className="choir-resource-featured-desc">{resource.description}</p>
      <p className="choir-resource-featured-meta">
        {resource.kindLabel}
        {resource.fileSizeLabel ? ` · ${resource.fileSizeLabel}` : ""}
      </p>
    </ResourceOpenLink>
  );
}

function ResourceRow({ resource }: { resource: ChoirResourceCardView }) {
  return (
    <ResourceOpenLink resource={resource} className="choir-resource-library-row">
      <span className="choir-resource-file-icon" aria-hidden>📄</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[var(--choir-heading)]">{resource.title}</p>
        <p className="text-xs text-[var(--choir-muted)]">{resource.description}</p>
      </div>
      <div className="text-right text-xs text-[var(--choir-muted)]">
        <p>{resource.kindLabel}</p>
        {resource.fileSizeLabel ? <p>{resource.fileSizeLabel}</p> : null}
      </div>
      <span aria-hidden>↓</span>
    </ResourceOpenLink>
  );
}

function ResourceListTab({
  title,
  subtitle,
  resources,
  search,
  onSearch,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  resources: ChoirResourceCardView[];
  search: string;
  onSearch: (value: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--choir-muted)]">{subtitle}</p> : null}
      </div>
      <input
        type="search"
        className="choir-setlist-search w-full"
        placeholder="Search resources…"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {resources.length === 0 ? (
        <p className="text-sm text-[var(--choir-muted)]">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {resources.map((resource) => (
            <li key={resource.id}>
              <ResourceRow resource={resource} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OnboardingTab({
  groupId,
  resources,
}: {
  groupId: string;
  resources: ChoirResourceCardView[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Welcome to Shanah Worship</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Everything you need to get started. Before You Serve remains the official readiness workflow.
        </p>
      </div>
      <ul className="space-y-2">
        {choirOnboardingLinks(groupId).map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="choir-resource-library-row">
              <span className="choir-resource-file-icon" aria-hidden>✓</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[var(--choir-heading)]">{item.title}</p>
                <p className="text-xs text-[var(--choir-muted)]">{item.description}</p>
              </div>
              <span aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
      {resources.length > 0 ? (
        <div>
          <h3 className="choir-section-heading text-base">Onboarding documents</h3>
          <ul className="mt-2 space-y-2">
            {resources.map((resource) => (
              <li key={resource.id}>
                <ResourceRow resource={resource} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function HelpfulLinksTab({
  groupId,
  published,
}: {
  groupId: string;
  published: ChoirResourceCardView[];
}) {
  const builtin = choirBuiltinHelpfulLinks(groupId);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Helpful links</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Quick access to resources and ministry tools.</p>
      </div>
      <div className="choir-resource-links-row">
        {builtin.map((link) => (
          <Link key={link.title} href={link.href} className="choir-resource-link-card">
            <p className="font-bold text-[var(--choir-heading)]">{link.title}</p>
            <p className="text-xs text-[var(--choir-muted)]">{link.description}</p>
            <span aria-hidden>›</span>
          </Link>
        ))}
      </div>
      {published.length > 0 ? (
        <ul className="space-y-2">
          {published.map((resource) => (
            <li key={resource.id}>
              <ResourceRow resource={resource} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--choir-muted)]">Leaders can publish additional recommended links.</p>
      )}
    </div>
  );
}
