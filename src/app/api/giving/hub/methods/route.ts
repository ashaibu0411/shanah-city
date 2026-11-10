import { NextResponse } from "next/server";
import { listPublicGivingHubMethods } from "@/lib/giving-hub-server";

export const runtime = "nodejs";

export async function GET() {
  const hub = await listPublicGivingHubMethods();
  return NextResponse.json(hub, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
