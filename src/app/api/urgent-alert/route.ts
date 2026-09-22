import { NextResponse } from "next/server";
import { listUrgentAlertsForHomeCarousel } from "@/lib/urgent-alert-server";

export async function GET() {
  const alerts = await listUrgentAlertsForHomeCarousel();
  const alert = alerts[0] ?? null;
  return NextResponse.json({ alert, alerts });
}
