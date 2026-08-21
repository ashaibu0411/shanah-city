import { getUserByEmail } from "@/lib/auth-server";
import { getPreviousDenverWeekRange } from "@/lib/denver-time";
import { sendGivingWeeklyReportEmail } from "@/lib/email-server";
import {
  fundLabel,
  givingRecordsToCsv,
  methodLabel,
  summarizeGivingRecords,
} from "@/lib/giving-types";
import { listGivingRecords } from "@/lib/giving-server";

function reportRecipients() {
  const emails = new Set<string>();
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const extra = process.env.GIVING_REPORT_EMAIL?.trim().toLowerCase();

  if (bootstrap) emails.add(bootstrap);
  if (extra) emails.add(extra);

  return [...emails];
}

export async function sendWeeklyGivingReport(reference = new Date()) {
  const recipients = reportRecipients();
  if (recipients.length === 0) {
    return { sent: false as const, reason: "no_recipients" as const };
  }

  const { since, until } = getPreviousDenverWeekRange(reference);
  const records = await listGivingRecords({ since, until });
  const summary = summarizeGivingRecords(records);

  const fundLines = Object.entries(summary.byFund)
    .sort((a, b) => b[1] - a[1])
    .map(([fund, amount]) => `${fundLabel(fund)}: $${amount.toFixed(2)}`);

  const methodLines = Object.entries(summary.byMethod)
    .sort((a, b) => b[1] - a[1])
    .map(([method, amount]) => `${methodLabel(method)}: $${amount.toFixed(2)}`);

  const csv = givingRecordsToCsv(records);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://shanah-city.vercel.app";

  let sentCount = 0;
  for (const email of recipients) {
    const user = await getUserByEmail(email);
    const result = await sendGivingWeeklyReportEmail({
      to: email,
      name: user?.name ?? "Finance team",
      since,
      until,
      summary,
      fundLines,
      methodLines,
      adminUrl: `${baseUrl}/admin/giving`,
      csv,
    });
    if (result.sent) sentCount += 1;
  }

  return {
    sent: sentCount > 0,
    sentCount,
    recipientCount: recipients.length,
    since,
    until,
    giftCount: summary.count,
    totalAmount: summary.totalAmount,
  };
}
