import type { GivingPlatform } from "./types";
import { site } from "./site";

function cashAppUrl(cashtag: string) {
  const tag = cashtag.replace(/^\$/, "");
  return `https://cash.app/$${tag}`;
}

function paypalUrl(username: string) {
  const handle = username.replace(/^@/, "");
  return `https://paypal.me/${handle}`;
}

function venmoUrl(username: string) {
  const handle = username.replace(/^@/, "");
  return `https://venmo.com/${handle}`;
}

/** Defaults when env vars are not set — update in .env.local for production. */
const defaults = {
  zeffyUrl: "",
  paypalUsername: "ShanahCity",
  cashAppTag: "ShanahCity",
  venmoUsername: "ShanahCity",
};

function envValue(key: string, fallback = "") {
  const value = process.env[key]?.trim();
  return value || fallback;
}

const zeffyUrl = envValue("NEXT_PUBLIC_GIVE_ZEFFY_URL", defaults.zeffyUrl);
const paypalUsername = envValue(
  "NEXT_PUBLIC_GIVE_PAYPAL_USERNAME",
  defaults.paypalUsername,
);
const paypalUrlDirect = envValue("NEXT_PUBLIC_GIVE_PAYPAL_URL");
const cashAppTag = envValue("NEXT_PUBLIC_GIVE_CASHAPP_TAG", defaults.cashAppTag);
const zelleEmail = site.giving.financeEmail;
const venmoUsername = envValue(
  "NEXT_PUBLIC_GIVE_VENMO_USERNAME",
  defaults.venmoUsername,
);

const configured: GivingPlatform[] = [
  {
    id: "zeffy",
    name: "Zeffy",
    description: "Give online with card or bank — Zeffy covers platform fees for nonprofits.",
    action: "link",
    url: zeffyUrl || undefined,
    tone: "from-emerald-600 to-teal-700",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Send a one-time gift through PayPal.",
    action: "link",
    url: paypalUrlDirect || (paypalUsername ? paypalUrl(paypalUsername) : undefined),
    tone: "from-blue-600 to-indigo-700",
  },
  {
    id: "cashapp",
    name: "Cash App",
    description: "Tap to open Cash App and give to Shanah City.",
    action: "link",
    url: cashAppTag ? cashAppUrl(cashAppTag) : undefined,
    tone: "from-green-500 to-emerald-700",
  },
  {
    id: "zelle",
    name: "Zelle",
    description: "Send from your bank app using the church Zelle contact below.",
    action: "copy",
    copyValue: zelleEmail,
    copyHint: "Zelle email",
    tone: "from-violet-600 to-purple-700",
  },
  {
    id: "venmo",
    name: "Venmo",
    description: "Give through Venmo on your phone.",
    action: "link",
    url: venmoUsername ? venmoUrl(venmoUsername) : undefined,
    tone: "from-sky-500 to-blue-700",
  },
  {
    id: "website",
    name: "shanahcity.org",
    description: "Give securely on the church website — one-time or recurring.",
    action: "link",
    url: `${site.website}/give`,
    tone: "from-night-800 to-night-950",
  },
];

export const givingPlatforms = configured.filter((platform) => {
  if (platform.action === "copy") {
    return Boolean(platform.copyValue);
  }
  return Boolean(platform.url);
});

export function getGivingPlatform(id: string) {
  return givingPlatforms.find((platform) => platform.id === id);
}
