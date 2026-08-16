import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fundLabel, summarizeGivingRecords } from "@/lib/giving-types";
import { listGivingRecords } from "@/lib/giving-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view your giving history." }, { status: 401 });
  }

  const records = await listGivingRecords({ userId: user.id });
  const summary = summarizeGivingRecords(records);

  return NextResponse.json({
    records: records.map((record) => ({
      ...record,
      fundLabel: fundLabel(record.fund),
    })),
    summary,
  });
}
