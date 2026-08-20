import { NextResponse } from "next/server";
import { getActiveUrgentAlert } from "@/lib/urgent-alert-server";

export async function GET() {
  const alert = await getActiveUrgentAlert();
  return NextResponse.json({ alert });
}
