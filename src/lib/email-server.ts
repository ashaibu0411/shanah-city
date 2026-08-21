export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.PASSWORD_RESET_FROM_EMAIL?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Shanah City password",
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your Shanah City password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    return { sent: false as const, reason: "send_failed" as const };
  }

  return { sent: true as const };
}

export async function sendGivingWeeklyReportEmail(input: {
  to: string;
  name: string;
  since: string;
  until: string;
  summary: { totalAmount: number; count: number };
  fundLines: string[];
  methodLines: string[];
  adminUrl: string;
  csv: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.GIVING_REPORT_FROM_EMAIL?.trim() ??
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const total = input.summary.totalAmount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Shanah City giving report (${input.since} – ${input.until})`,
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Weekly giving summary for <strong>${escapeHtml(input.since)}</strong> through <strong>${escapeHtml(input.until)}</strong> (Denver time):</p>
        <ul>
          <li><strong>${total}</strong> across ${input.summary.count} gift${input.summary.count === 1 ? "" : "s"}</li>
        </ul>
        ${
          input.fundLines.length
            ? `<p><strong>By fund</strong><br>${input.fundLines.map((line) => escapeHtml(line)).join("<br>")}</p>`
            : ""
        }
        ${
          input.methodLines.length
            ? `<p><strong>By method</strong><br>${input.methodLines.map((line) => escapeHtml(line)).join("<br>")}</p>`
            : ""
        }
        <p><a href="${input.adminUrl}">Open Admin → Giving</a></p>
        <p>The detailed CSV is attached for Excel or Google Sheets.</p>
      `,
      attachments: [
        {
          filename: `shanah-giving-${input.since}-to-${input.until}.csv`,
          content: Buffer.from(input.csv, "utf8").toString("base64"),
        },
      ],
    }),
  });

  if (!response.ok) {
    return { sent: false as const, reason: "send_failed" as const };
  }

  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
