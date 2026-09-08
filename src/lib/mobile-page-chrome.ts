/** Pages that render their own hero/title below the sticky header on mobile. */
export function mobilePageHasBodyHero(pathname: string) {
  if (!pathname || pathname === "/") return false;
  if (pathname === "/profile") return false;
  if (pathname.startsWith("/groups/") && pathname !== "/groups") return true;

  if (pathname.startsWith("/devotions")) return true;
  if (pathname === "/live") return true;
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/")) return true;

  return true;
}

export function mobileHeaderShowsPageTitle(pathname: string) {
  if (pathname === "/") return false;
  return !mobilePageHasBodyHero(pathname);
}
