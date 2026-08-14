import { NextResponse } from "next/server";
import { getSignupGroupOptions } from "@/lib/group-server";

export async function GET() {
  const groups = await getSignupGroupOptions();
  return NextResponse.json({ groups });
}
