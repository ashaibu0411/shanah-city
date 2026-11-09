import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fundLabel, summarizeGivingRecords } from "@/lib/giving-types";
import { listGivingRecordsForMember } from "@/lib/giving-member-history-server";
import { afterHistoryVerifiedStripeMemberSync } from "@/lib/giving-history-after";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view your giving history." }, { status: 401 });
  }

  const { records, lastStripeSync } = await listGivingRecordsForMember(user);
  const summary = summarizeGivingRecords(records);

  afterHistoryVerifiedStripeMemberSync(user);

  return NextResponse.json(
    {
      records: records.map((record) => ({
        ...record,
        fundLabel: fundLabel(record.fund),
      })),
      summary,
      stripeSync: {
        mode: "deferred",
        lastRun: lastStripeSync,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
