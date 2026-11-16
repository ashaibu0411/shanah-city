"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const APP_LINK_HOST = "shanah-city.vercel.app";

/**
 * Only handle authenticated Shanah City story URLs, leaving all other
 * universal/app links to the OS or existing navigation. The server decides
 * whether the member is signed in; the story viewer checks availability.
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

export function NativeStoryLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let lastHandled = "";

    function handleLink(rawUrl: string) {
      const path = nativeStoryPath(rawUrl);
      if (!path || !active || path === lastHandled) return;
      lastHandled = path;
      // A full same-origin navigation guarantees that the existing
      // Community status row reads ?story on both cold and warm app launches.
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
