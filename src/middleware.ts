import { NextRequest, NextResponse } from "next/server";

/**
 * Keep the member app and its existing deep links on shanah-city.vercel.app.
 * Only the public church domain's homepage is rewritten to the visitor site.
 */
export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  if ((host === "shanahcity.org" || host === "www.shanahcity.org") && request.nextUrl.pathname === "/") {
    const headers = new Headers(request.headers);
    headers.set("x-shanah-public-home", "1");
    const url = request.nextUrl.clone();
    url.pathname = "/church-site";
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
