import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  readGroupServiceSchedule,
  writeGroupServiceSchedule,
} from "@/lib/group-service-schedule-handlers";

export async function GET(request: Request) {
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim() ?? "";
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const result = await readGroupServiceSchedule(user, groupId);
  if ("error" in result && result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.body);
}

export async function POST(request: Request) {
  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const result = await writeGroupServiceSchedule(user, groupId, body);
  if ("error" in result && result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.body);
}
