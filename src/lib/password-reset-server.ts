import { getUserByEmail, updateUserPassword } from "@/lib/auth-server";
import { sendPasswordResetEmail } from "@/lib/email-server";
import { useDatabase } from "@/lib/use-database";
import * as passwordResetDb from "@/lib/stores/password-reset-db";
import * as passwordResetJson from "@/lib/stores/password-reset-json";

const store = () => (useDatabase() ? passwordResetDb : passwordResetJson);

export function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Enter the email on your member account.");
  }

  const user = await getUserByEmail(normalized);
  if (!user) {
    return { sent: false as const, message: genericSuccessMessage() };
  }

  const record = await store().createPasswordResetToken(user.id);
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(record.token)}`;
  const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);

  return {
    sent: emailResult.sent,
    message: emailResult.sent
      ? genericSuccessMessage()
      : emailResult.reason === "not_configured"
        ? "Password reset email is not configured yet. Ask a leader to help reset your account, or contact admin@shanahcity.org."
        : genericSuccessMessage(),
    ...(process.env.NODE_ENV !== "production" && !emailResult.sent
      ? { devResetUrl: resetUrl }
      : {}),
  };
}

export async function completePasswordReset(token: string, password: string) {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    throw new Error("Use a password with at least 8 characters.");
  }

  const record = await store().consumePasswordResetToken(token.trim());
  if (!record) {
    throw new Error("This reset link is invalid or has expired.");
  }

  const updated = await updateUserPassword(record.userId, trimmed);
  if (!updated) {
    throw new Error("Could not update password.");
  }

  await store().deletePasswordResetTokensForUser(record.userId);
  return updated;
}

function genericSuccessMessage() {
  return "If an account exists for that email, we sent password reset instructions.";
}
