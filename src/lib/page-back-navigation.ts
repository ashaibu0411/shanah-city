import { WORSHIP_GROUP_ID } from "@/lib/worship-types";

export type PageBackLink = {
  href: string;
  label: string;
};

const choirGroupPath = `/groups/${encodeURIComponent(WORSHIP_GROUP_ID)}`;

/** Top-level routes that already have bottom nav / hub entry — no back chip. */
const ROOT_PATHS = new Set([
  "/",
  "/community",
  "/devotions",
  "/live",
  "/groups",
  "/messages",
  "/profile",
  "/give",
  "/sign-in",
  "/sign-up",
  "/meetings",
  "/about",
  "/privacy",
  "/training",
  "/shop",
  "/sermons",
  "/photos",
  "/guest",
  "/couples",
]);

export function resolvePageBackLink(
  pathname: string,
  searchParams?: URLSearchParams | null,
): PageBackLink | null {
  const path = pathname.replace(/\/$/, "") || "/";
  if (ROOT_PATHS.has(path)) {
    return null;
  }

  if (path === "/worship") {
    return { href: choirGroupPath, label: "Back to choir" };
  }

  if (path === "/worship/service") {
    return { href: "/worship", label: "Back to worship hub" };
  }

  if (path === "/worship/run-sheet") {
    const date = searchParams?.get("date")?.trim();
    const time = searchParams?.get("time")?.trim();
    if (date && time) {
      const query = new URLSearchParams({ date, time });
      return {
        href: `/worship?${query.toString()}`,
        label: "Back to worship planner",
      };
    }
    return { href: "/worship", label: "Back to worship hub" };
  }

  if (path.startsWith("/worship/")) {
    return { href: choirGroupPath, label: "Back to choir" };
  }

  if (path.startsWith("/groups/")) {
    return { href: "/groups", label: "Back to groups" };
  }

  if (path.startsWith("/couples/")) {
    if (path === "/couples/marriage") {
      return { href: "/couples", label: "Back to Couples Hub" };
    }
    if (path.startsWith("/couples/marriage/")) {
      return { href: "/couples/marriage", label: "Back to our marriage" };
    }
    if (path === "/couples/community") {
      return { href: "/couples", label: "Back to Couples Hub" };
    }
    return { href: "/couples", label: "Back to Couples Hub" };
  }

  if (path.startsWith("/admin")) {
    if (path === "/admin") return null;
    return { href: "/admin", label: "Back to admin" };
  }

  if (path.startsWith("/devotions/")) {
    return null;
  }

  if (path.startsWith("/training/handout/")) {
    return { href: "/training", label: "Back to training" };
  }

  if (path.startsWith("/alerts/")) {
    return { href: "/", label: "Back to home" };
  }

  if (path.startsWith("/comms/")) {
    return { href: "/groups", label: "Back to groups" };
  }

  if (path.startsWith("/follow-up/")) {
    return { href: "/groups", label: "Back to groups" };
  }

  if (path.startsWith("/ministry-reports")) {
    return { href: "/groups", label: "Back to groups" };
  }

  if (path.startsWith("/kids-ministry")) {
    return { href: "/", label: "Back to home" };
  }

  if (path.startsWith("/give/")) {
    return { href: "/give", label: "Back to giving" };
  }

  if (path.startsWith("/shop/")) {
    return { href: "/shop", label: "Back to shop" };
  }

  const depth = path.split("/").filter(Boolean).length;
  if (depth >= 2) {
    return { href: "/", label: "Back to home" };
  }

  return null;
}
