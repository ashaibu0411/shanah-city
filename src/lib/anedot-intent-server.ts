import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import {
  buildAnedotHostedCheckoutUrl,
} from "@/lib/anedot-checkout-url";
import { anedotActionPageUrl, anedotIntentSigningSecret } from "@/lib/anedot-env";
import { resolveIntentFundOrNull } from "@/lib/anedot-fund-map";
import {
  mintAnedotIntentToken,
  signAnedotIntentPayload,
} from "@/lib/anedot-intent-token";
import type { GivingCheckoutFrequency, GivingFund } from "@/lib/giving-types";

const INTENT_TTL_MS = 30 * 60 * 1000;

export async function createAnedotGivingIntent(input: {
  userId?: string;
  amount: number;
  fund: GivingFund;
  frequency: GivingCheckoutFrequency;
  coverFees: boolean;
  fundAnedotIdentifier?: string;
}): Promise<
  | { ok: true; redirectUrl: string; intentId: string; expiresAt: string }
  | { ok: false; error: string; status: number }
> {
  if (!useDatabase()) {
    return { ok: false, error: "Online giving database is not available.", status: 503 };
  }
  const pageUrl = anedotActionPageUrl();
  const signingSecret = anedotIntentSigningSecret();
  if (!pageUrl || !signingSecret) {
    return { ok: false, error: "Anedot giving is not configured.", status: 503 };
  }
  if (!resolveIntentFundOrNull(input.fund)) {
    return { ok: false, error: "Choose a valid fund.", status: 400 };
  }
  if (!Number.isFinite(input.amount) || input.amount < 1) {
    return { ok: false, error: "Enter a valid amount.", status: 400 };
  }

  const intentToken = mintAnedotIntentToken();
  const id = `anedot-intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS);
  const intentReference = `${id}.${signAnedotIntentPayload(`${id}:${intentToken}`, signingSecret)}`;

  await prisma.givingAnedotIntent.create({
    data: {
      id,
      intentToken,
      userId: input.userId ?? null,
      amount: input.amount,
      fund: input.fund,
      frequency: input.frequency,
      coverFees: input.coverFees,
      expiresAt,
    },
  });

  const redirectUrl = buildAnedotHostedCheckoutUrl({
    actionPageUrl: pageUrl,
    amount: input.amount,
    frequency: input.frequency,
    intentReference,
    fundAnedotIdentifier: input.fundAnedotIdentifier,
  });

  return { ok: true, redirectUrl, intentId: id, expiresAt: expiresAt.toISOString() };
}

export async function findAnedotIntentByReference(reference: string) {
  if (!useDatabase()) return null;
  const intentId = reference.split(".")[0]?.trim();
  if (!intentId) return null;
  const row = await prisma.givingAnedotIntent.findUnique({ where: { id: intentId } });
  if (!row) return null;
  const signingSecret = anedotIntentSigningSecret();
  if (!signingSecret) return null;
  const expectedRef = `${row.id}.${signAnedotIntentPayload(`${row.id}:${row.intentToken}`, signingSecret)}`;
  if (expectedRef !== reference) return null;
  return row;
}
