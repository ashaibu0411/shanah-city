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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
