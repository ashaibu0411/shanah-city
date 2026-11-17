"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const APP_LINK_HOST = "shanah-city.vercel.app";

/**
 * Route verified Story and Vision Center URLs into the installed app.
 * The server still enforces sign-in and Vision Center assignments.
 */
export function nativeStoryPath(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== APP_LINK_HOST ||
      url.port || url.pathname !== "/community") return null;
  const storyId = url.searchParams.get("story");
  if (!storyId || storyId.length > 120 || !/^[A-Za-z0-9_-]+$/.test(storyId)) return null;
  return "/community?story=" + encodeURIComponent(storyId);
}

/** A plan ID is an opaque server identifier; never accept arbitrary target paths. */
export function nativeVisionPath(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== APP_LINK_HOST || url.port || url.search || url.hash) return null;
  const match = /^\/leadership\/vision\/([A-Za-z0-9_-]{1,120})\/?$/.exec(url.pathname);
  return match ? "/leadership/vision/" + match[1] : null;
}

export function NativeStoryLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let lastHandled = "";

    function handleLink(rawUrl: string) {
      const path = nativeStoryPath(rawUrl) ?? nativeVisionPath(rawUrl);
      if (!path || !active || path === lastHandled) return;
      lastHandled = path;
      // Navigate inside the Capacitor WebView, preserving app-session auth.
      // For signed-out recipients, the existing page redirects to sign-in?next=plan.
      if (window.location.pathname + window.location.search === path) return;
      window.location.assign(path);
    }

    const subscription = App.addListener("appUrlOpen", event => {
      handleLink(event.url);
    });
    void App.getLaunchUrl().then(result => {
      if (result?.url) handleLink(result.url);
    }).catch(() => undefined);

    return () => {
      active = false;
      void subscription.then(listener => listener.remove());
    };
  }, []);

  return null;
}
