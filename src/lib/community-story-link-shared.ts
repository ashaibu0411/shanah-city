export type StorySocialPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "x"
  | "threads"
  | "linkedin"
  | "other";

const ALLOWED_SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.watch",
  "m.facebook.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "threads.net",
  "linkedin.com",
];

function isAllowedSocialHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_SOCIAL_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function detectStorySocialPlatform(hostname: string): StorySocialPlatform {
  const host = hostname.toLowerCase();
  if (host.includes("instagram")) return "instagram";
  if (host.includes("facebook") || host.includes("fb.")) return "facebook";
  if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("twitter") || host === "x.com" || host.endsWith(".x.com")) return "x";
  if (host.includes("threads")) return "threads";
  if (host.includes("linkedin")) return "linkedin";
  return "other";
}

export function storySocialPlatformLabel(platform: StorySocialPlatform) {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "x":
      return "X";
    case "threads":
      return "Threads";
    case "linkedin":
      return "LinkedIn";
    default:
      return "Social";
  }
}

export function storySocialOpenLabel(platform: StorySocialPlatform) {
  return `Open on ${storySocialPlatformLabel(platform)}`;
}

/** Normalize and validate https share links from Instagram and other social apps. */
export function normalizeStorySocialLink(raw: string) {
  let trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a link from Instagram or another social app.");
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid link.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Links must start with https://");
  }

  if (!isAllowedSocialHost(url.hostname)) {
    throw new Error(
      "Use a share link from Instagram, Facebook, YouTube, TikTok, X, Threads, or LinkedIn.",
    );
  }

  url.hash = "";
  const platform = detectStorySocialPlatform(url.hostname);

  return {
    url: url.toString(),
    platform,
    label: storySocialPlatformLabel(platform),
  };
}

export function parseStoryLinkFromStatus(mediaType: string, mediaUrl: string) {
  if (mediaType !== "link" || !mediaUrl.trim()) return null;
  try {
    const url = new URL(mediaUrl);
    const platform = detectStorySocialPlatform(url.hostname);
    return {
      url: mediaUrl,
      platform,
      label: storySocialPlatformLabel(platform),
      openLabel: storySocialOpenLabel(platform),
    };
  } catch {
    return null;
  }
}
