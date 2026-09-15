import {
  detectStorySocialPlatform,
  type StorySocialPlatform,
  storySocialPlatformLabel,
} from "@/lib/community-story-link-shared";

export type StoryLinkPreview =
  | {
      kind: "youtube";
      platform: "youtube";
      url: string;
      videoId: string;
      embedUrl: string;
      title?: string;
    }
  | {
      kind: "instagram_embed";
      platform: "instagram";
      url: string;
      embedUrl: string;
      title?: string;
    }
  | {
      kind: "tiktok_embed";
      platform: "tiktok";
      url: string;
      embedUrl: string;
      title?: string;
    }
  | {
      kind: "facebook_embed";
      platform: "facebook";
      url: string;
      embedUrl: string;
      title?: string;
    }
  | {
      kind: "card";
      platform: StorySocialPlatform;
      url: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      note?: string;
    };

function extractYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const shorts = parsed.pathname.match(/\/shorts\/([^/]+)/);
      if (shorts) return shorts[1];
      const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

function instagramEmbedPath(url: string) {
  try {
    const path = new URL(url).pathname;
    const reel = path.match(/\/reel\/([^/]+)/i);
    if (reel) return `/reel/${reel[1]}/embed`;
    const post = path.match(/\/p\/([^/]+)/i);
    if (post) return `/p/${post[1]}/embed`;
    const tv = path.match(/\/tv\/([^/]+)/i);
    if (tv) return `/tv/${tv[1]}/embed`;
  } catch {
    return null;
  }
  return null;
}

function isInstagramStoryUrl(url: string) {
  try {
    return /\/stories\//i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

async function resolveCanonicalSocialUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("vm.tiktok.com") || host.includes("vt.tiktok.com")) {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ShanahCityBot/1.0; +https://shanah-city.vercel.app)",
        },
      });
      if (response.url && response.url.startsWith("http")) {
        return response.url;
      }
    }
  } catch {
    return url;
  }
  return url;
}

function extractTikTokVideoId(url: string) {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\/video\/(\d+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isFacebookVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host.includes("fb.watch")) return true;
    if (path.includes("/reel/")) return true;
    if (path.includes("/watch")) return true;
    if (path.includes("/videos/")) return true;
    if (parsed.searchParams.has("v")) return true;
    return false;
  } catch {
    return false;
  }
}

function facebookVideoEmbedUrl(url: string) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500`;
}

async function fetchOpenGraph(url: string, timeoutMs = 8000) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ShanahCityBot/1.0; +https://shanah-city.vercel.app)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const pick = (property: string) => {
      const match =
        html.match(
          new RegExp(
            `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
            "i",
          ),
        ) ??
        html.match(
          new RegExp(
            `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
            "i",
          ),
        );
      return match?.[1]?.trim();
    };
    const title = pick("og:title") ?? pick("twitter:title");
    const description = pick("og:description") ?? pick("twitter:description");
    const imageUrl = pick("og:image") ?? pick("twitter:image");
    if (!title && !description && !imageUrl) return null;
    return { title, description, imageUrl };
  } catch {
    return null;
  }
}

export async function resolveStoryLinkPreview(url: string): Promise<StoryLinkPreview> {
  let normalized = url.trim();
  let hostname = "";
  try {
    normalized = await resolveCanonicalSocialUrl(normalized);
    hostname = new URL(normalized).hostname;
  } catch {
    return {
      kind: "card",
      platform: "other",
      url: normalized,
      note: "Invalid link.",
    };
  }

  const platform = detectStorySocialPlatform(hostname);

  if (platform === "youtube") {
    const videoId = extractYouTubeVideoId(normalized);
    if (videoId) {
      return {
        kind: "youtube",
        platform: "youtube",
        url: normalized,
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`,
      };
    }
  }

  if (platform === "tiktok") {
    const videoId = extractTikTokVideoId(normalized);
    if (videoId) {
      return {
        kind: "tiktok_embed",
        platform: "tiktok",
        url: normalized,
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      };
    }
  }

  if (platform === "facebook" && isFacebookVideoUrl(normalized)) {
    return {
      kind: "facebook_embed",
      platform: "facebook",
      url: normalized,
      embedUrl: facebookVideoEmbedUrl(normalized),
    };
  }

  if (platform === "instagram") {
    const embedPath = instagramEmbedPath(normalized);
    if (embedPath) {
      return {
        kind: "instagram_embed",
        platform: "instagram",
        url: normalized,
        embedUrl: `https://www.instagram.com${embedPath}`,
      };
    }
    if (isInstagramStoryUrl(normalized)) {
      return {
        kind: "card",
        platform: "instagram",
        url: normalized,
        title: "Instagram story",
        description: "Tap below to open this story in Instagram.",
        note: "external_only",
      };
    }

    const og = await fetchOpenGraph(normalized, 4500);
    return {
      kind: "card",
      platform: "instagram",
      url: normalized,
      title: og?.title ?? `${storySocialPlatformLabel(platform)} link`,
      description:
        og?.description ??
        "Tap below to open on Instagram. Reels and posts may play here when Instagram allows embeds.",
      imageUrl: og?.imageUrl,
    };
  }

  const og = await fetchOpenGraph(normalized, 6000);
  return {
    kind: "card",
    platform,
    url: normalized,
    title: og?.title ?? `${storySocialPlatformLabel(platform)} link`,
    description:
      og?.description ??
      `Tap below to open on ${storySocialPlatformLabel(platform)}.`,
    imageUrl: og?.imageUrl,
  };
}
