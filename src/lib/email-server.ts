export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = resendFromAddress();

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

export async function sendGivingCustomThankYouEmail(input: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = givingEmailFromAddress();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const html = input.message
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<br>"))
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html,
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

function resendFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ??
    process.env.PASSWORD_RESET_FROM_EMAIL?.trim()
  );
}

function givingEmailFromAddress() {
  return (
    process.env.GIVING_REPORT_FROM_EMAIL?.trim() ?? resendFromAddress()
  );
}

function formatGivingMoney(amount: number, currency = "USD") {
  return amount.toLocaleString(undefined, { style: "currency", currency });
}

function givingReceiptRows(
  records: Array<{
    givenOn: string;
    amount: number;
    currency?: string;
    fund: string;
    method: string;
  }>,
  labels: { fundLabel: (fund: string) => string; methodLabel: (method: string) => string },
) {
  return records
    .map(
      (record) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(record.givenOn)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(labels.fundLabel(record.fund))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(labels.methodLabel(record.method))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(formatGivingMoney(record.amount, record.currency))}</td>
        </tr>
      `,
    )
    .join("");
}

export async function sendGivingGuestReceiptEmail(input: {
  to: string;
  name: string;
  record: {
    givenOn: string;
    amount: number;
    currency?: string;
    fund: string;
    method: string;
  };
  fundLabel: (fund: string) => string;
  methodLabel: (method: string) => string;
  signUpUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = givingEmailFromAddress();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const amount = formatGivingMoney(input.record.amount, input.record.currency);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Thank you for your gift to Shanah City",
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thank you for your generous gift to Shanah City. Here is your receipt:</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px;margin:16px 0;">
          <thead>
            <tr>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Date</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Fund</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Method</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${givingReceiptRows([input.record], input)}
          </tbody>
        </table>
        <p><strong>Total:</strong> ${escapeHtml(amount)}</p>
        <p>Create a free Shanah City account with this email to track your giving in the app: <a href="${input.signUpUrl}">Sign up</a></p>
        <p>We are grateful for your support and partnership in ministry!</p>
      `,
    }),
  });

  if (!response.ok) {
    return { sent: false as const, reason: "send_failed" as const };
  }

  return { sent: true as const };
}

export async function sendGivingGuestStatementEmail(input: {
  to: string;
  name: string;
  since?: string;
  until?: string;
  records: Array<{
    givenOn: string;
    amount: number;
    currency?: string;
    fund: string;
    method: string;
  }>;
  totalAmount: number;
  fundLabel: (fund: string) => string;
  methodLabel: (method: string) => string;
  signUpUrl: string;
  csv: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = givingEmailFromAddress();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const rangeLabel =
    input.since && input.until
      ? `${input.since} through ${input.until}`
      : "your selected date range";
  const total = formatGivingMoney(input.totalAmount);
  const filenameSuffix =
    input.since && input.until ? `${input.since}-to-${input.until}` : "statement";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Your Shanah City giving statement (${rangeLabel})`,
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Here is your Shanah City giving statement for <strong>${escapeHtml(rangeLabel)}</strong>.</p>
        <p><strong>Total:</strong> ${escapeHtml(total)} across ${input.records.length} gift${input.records.length === 1 ? "" : "s"}</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px;margin:16px 0;">
          <thead>
            <tr>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Date</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Fund</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Method</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${givingReceiptRows(input.records, input)}
          </tbody>
        </table>
        <p>Create a free Shanah City account with this email to view your giving history in the app: <a href="${input.signUpUrl}">Sign up</a></p>
        <p>Thank you for supporting Shanah City!</p>
      `,
      attachments: [
        {
          filename: `shanah-giving-${filenameSuffix}.csv`,
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
