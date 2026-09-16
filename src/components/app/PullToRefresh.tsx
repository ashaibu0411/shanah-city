"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import { runAppRefresh } from "@/lib/app-refresh";

const PULL_THRESHOLD = 72;
const MAX_PULL = 112;

function isRefreshBlocked() {
  if (typeof document === "undefined") return true;
  if (document.body.dataset.storyViewerOpen === "true") return true;
  if (document.body.dataset.pullRefreshDisabled === "true") return true;
  return false;
}

function scrollTop() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

type PullToRefreshProps = {
  children: ReactNode;
};

export function PullToRefresh({ children }: PullToRefreshProps) {
  const { isMobileApp, messagesImmersive } = useAppShell();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const enabled = isMobileApp && !messagesImmersive;

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
      await runAppRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(event: TouchEvent) {
      if (refreshingRef.current || isRefreshBlocked()) return;
      if (scrollTop() > 2) return;
      const target = event.target;
      if (target instanceof Element && target.closest("[data-no-pull-refresh]")) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullingRef.current = false;
    }

    function onTouchMove(event: TouchEvent) {
      if (refreshingRef.current || startYRef.current == null || isRefreshBlocked()) return;
      if (scrollTop() > 2) {
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
      const next = Math.min(MAX_PULL, delta * 0.55);
      setPull(next);
      if (next > 8) {
        event.preventDefault();
      }
    }

    function onTouchEnd() {
      if (refreshingRef.current) return;
      const shouldRefresh = pullingRef.current && pullRef.current >= PULL_THRESHOLD;
      startYRef.current = null;
      pullingRef.current = false;
      if (shouldRefresh) {
        void triggerRefresh();
        return;
      }
      setPull(0);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
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
