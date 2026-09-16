"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import { runAppRefresh } from "@/lib/app-refresh";

const PULL_THRESHOLD = 64;
const MAX_PULL = 108;

function isRefreshBlocked() {
  if (typeof document === "undefined") return true;
  if (document.body.dataset.storyViewerOpen === "true") return true;
  if (document.body.dataset.pullRefreshDisabled === "true") return true;
  return false;
}

function pageScrollTop() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function findScrollableAncestor(start: EventTarget | null): Element | null {
  if (!(start instanceof Element)) return null;

  let node: Element | null = start;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

function isAtScrollTop(scroller: Element | null) {
  if (scroller) {
    return scroller.scrollTop <= 2;
  }
  return pageScrollTop() <= 2;
}

type PullToRefreshProps = {
  children: ReactNode;
};

export function PullToRefresh({ children }: PullToRefreshProps) {
  const { isMobileApp, isNativeApp, messagesImmersive } = useAppShell();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const scrollRootRef = useRef<Element | null>(null);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const enabled = (isMobileApp || isNativeApp) && !messagesImmersive;

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const triggerRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    setRefreshing(true);
    setPull(PULL_THRESHOLD);
    try {
      if (isNativeApp) {
        window.location.reload();
        return;
      }
      await runAppRefresh();
    } finally {
      if (!isNativeApp) {
        setRefreshing(false);
        setPull(0);
      }
    }
  }, [isNativeApp]);

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(event: TouchEvent) {
      if (refreshingRef.current || isRefreshBlocked()) return;
      scrollRootRef.current = findScrollableAncestor(event.target);
      if (!isAtScrollTop(scrollRootRef.current)) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-no-pull-refresh]")) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullingRef.current = false;
    }

    function onTouchMove(event: TouchEvent) {
      if (refreshingRef.current || startYRef.current == null || isRefreshBlocked()) return;
      if (!isAtScrollTop(scrollRootRef.current)) {
        startYRef.current = null;
        setPull(0);
        return;
      }

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }

      pullingRef.current = true;
      const next = Math.min(MAX_PULL, delta * 0.5);
      setPull(next);
      if (next > 0) {
        event.preventDefault();
      }
    }

    function onTouchEnd() {
      if (refreshingRef.current) return;
      const shouldRefresh = pullingRef.current && pullRef.current >= PULL_THRESHOLD;
      startYRef.current = null;
      scrollRootRef.current = null;
      pullingRef.current = false;
      if (shouldRefresh) {
        void triggerRefresh();
        return;
      }
      setPull(0);
    }

    const opts = { capture: true };
    document.addEventListener("touchstart", onTouchStart, { ...opts, passive: true });
    document.addEventListener("touchmove", onTouchMove, { ...opts, passive: false });
    document.addEventListener("touchend", onTouchEnd, opts);
    document.addEventListener("touchcancel", onTouchEnd, opts);

    return () => {
      document.removeEventListener("touchstart", onTouchStart, opts);
      document.removeEventListener("touchmove", onTouchMove, opts);
      document.removeEventListener("touchend", onTouchEnd, opts);
      document.removeEventListener("touchcancel", onTouchEnd, opts);
    };
  }, [enabled, triggerRefresh]);

  const showIndicator = enabled && (pull > 0 || refreshing);
  const progress = refreshing ? 1 : Math.min(1, pull / PULL_THRESHOLD);

  return (
    <>
      {showIndicator ? (
        <div
          className="app-pull-refresh-indicator"
          style={{
            transform: `translateY(${refreshing ? 0 : Math.min(pull, PULL_THRESHOLD) - PULL_THRESHOLD}px)`,
            opacity: refreshing ? 1 : progress,
          }}
          aria-live="polite"
        >
          <span
            className={`app-pull-refresh-spinner ${refreshing ? "app-pull-refresh-spinner-active" : ""}`}
            style={{ transform: refreshing ? undefined : `rotate(${progress * 320}deg)` }}
          />
          <span className="app-pull-refresh-label">
            {refreshing ? "Refreshing…" : progress >= 1 ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      ) : null}
      {children}
    </>
  );
}
