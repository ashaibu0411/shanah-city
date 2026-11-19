import { NextRequest, NextResponse } from "next/server";

/**
 * Public church pages use their own visitor-facing layout on the custom
 * church domain. All routes on the original app domain remain unchanged.
 */
const publicPages = new Set(["/", "/visit", "/about", "/ministries", "/messages", "/events", "/contact", "/giving"]);
export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  if ((host === "shanahcity.org" || host === "www.shanahcity.org") && publicPages.has(path)) {
    const headers = new Headers(request.headers);
    headers.set("x-shanah-public-home", "1");
    const url = request.nextUrl.clone();
    url.pathname = path === "/" ? "/church-site" : `/church-site${path}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/visit", "/about", "/ministries", "/messages", "/events", "/contact", "/giving"] };
