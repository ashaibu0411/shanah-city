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

async function fetchOpenGraph(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ShanahCityBot/1.0; +https://shanah-city.vercel.app)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
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
  const normalized = url.trim();
  let hostname = "";
  try {
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
      const og = await fetchOpenGraph(normalized);
      return {
        kind: "card",
        platform: "instagram",
        url: normalized,
        title: og?.title ?? "Instagram story",
        description:
          og?.description ??
          "Instagram stories can't play inside the church app. Save the clip to your phone and post it as a photo/video moment for everyone to watch here.",
        imageUrl: og?.imageUrl,
        note: "story_no_embed",
      };
    }
  }

  const og = await fetchOpenGraph(normalized);
  return {
    kind: "card",
    platform,
    url: normalized,
    title: og?.title ?? `${storySocialPlatformLabel(platform)} link`,
    description: og?.description,
    imageUrl: og?.imageUrl,
  };
}
