import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { isStripeGivingConfigured } from "@/lib/stripe-server";
import type {
  AdminGivingHubMethod,
  GivingHubPaymentAction,
  GivingHubPaymentMethodKey,
  PublicGivingHubMethod,
} from "@/lib/giving-hub-types";

const HUB_METHOD_KEYS = new Set<string>(["zelle", "cashapp", "venmo", "paypal", "zeffy"]);

function cashAppUrl(cashtag: string) {
  const tag = cashtag.replace(/^\$/, "");
  return `https://cash.app/$${tag}`;
}

function publicMethodFromRow(row: {
  id: string;
  methodKey: string;
  displayName: string;
  description: string;
  action: string;
  recipientValue: string | null;
  copyHint: string | null;
  externalUrl: string | null;
  tone: string | null;
}): PublicGivingHubMethod | null {
  if (!HUB_METHOD_KEYS.has(row.methodKey)) return null;
  const methodKey = row.methodKey as GivingHubPaymentMethodKey;
  const action = row.action === "link" ? "link" : "copy";
  const copyValue = row.recipientValue?.trim() || undefined;
  let url = row.externalUrl?.trim() || undefined;
  if (action === "link" && !url && methodKey === "cashapp" && copyValue) {
    url = cashAppUrl(copyValue);
  }
  if (action === "copy" && !copyValue) return null;
  if (action === "link" && !url) return null;
  return {
    id: row.id,
    methodKey,
    displayName: row.displayName,
    description: row.description,
    action,
    copyValue: action === "copy" ? copyValue : undefined,
    copyHint: row.copyHint ?? undefined,
    url: action === "link" ? url : undefined,
    tone: row.tone ?? undefined,
  };
}

export function hubMethodIsPublic(row: {
  enabled: boolean;
  published: boolean;
  verifiedAt: Date | null;
}) {
  return row.enabled && row.published && row.verifiedAt !== null;
}

export async function listPublicGivingHubMethods(): Promise<{
  methods: PublicGivingHubMethod[];
  stripeCheckoutAvailable: boolean;
}> {
  if (!useDatabase()) {
    return { methods: [], stripeCheckoutAvailable: isStripeGivingConfigured() };
  }

  try {
    const rows = await prisma.givingHubPaymentMethod.findMany({
      where: { enabled: true, published: true, verifiedAt: { not: null } },
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });

    const methods = rows
      .map((row) => publicMethodFromRow(row))
      .filter((row): row is PublicGivingHubMethod => Boolean(row));

    return { methods, stripeCheckoutAvailable: isStripeGivingConfigured() };
  } catch {
    return { methods: [], stripeCheckoutAvailable: isStripeGivingConfigured() };
  }
}

export async function listAdminGivingHubMethods(): Promise<AdminGivingHubMethod[]> {
  if (!useDatabase()) return [];

  const rows = await prisma.givingHubPaymentMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
  });

  return rows.map((row) => {
    const pub = publicMethodFromRow(row);
    return {
      id: row.id,
      methodKey: row.methodKey as GivingHubPaymentMethodKey,
      displayName: row.displayName,
      description: row.description,
      action: (row.action === "link" ? "link" : "copy") as GivingHubPaymentAction,
      copyValue: pub?.copyValue,
      copyHint: pub?.copyHint,
      url: pub?.url,
      tone: pub?.tone,
      enabled: row.enabled,
      published: row.published,
      verified: row.verifiedAt !== null,
      verifiedAt: row.verifiedAt?.toISOString() ?? null,
      recipientValue: row.recipientValue,
      sortOrder: row.sortOrder,
    };
  });
}

export async function updateGivingHubPaymentMethod(input: {
  id: string;
  enabled?: boolean;
  published?: boolean;
  description?: string;
  sortOrder?: number;
}) {
  const existing = await prisma.givingHubPaymentMethod.findUnique({ where: { id: input.id } });
  if (!existing) return null;

  const nextPublished = input.published ?? existing.published;
  if (nextPublished && !existing.verifiedAt) {
    throw new Error("Cannot publish until Finance has verified the recipient.");
  }

  return prisma.givingHubPaymentMethod.update({
    where: { id: input.id },
    data: {
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.published !== undefined ? { published: nextPublished } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: new Date(),
    },
  });
}

export async function verifyGivingHubPaymentMethod(input: {
  id: string;
  verifiedByUserId: string;
  publish?: boolean;
}) {
  const existing = await prisma.givingHubPaymentMethod.findUnique({ where: { id: input.id } });
  if (!existing) return null;

  return prisma.givingHubPaymentMethod.update({
    where: { id: input.id },
    data: {
      verifiedAt: new Date(),
      verifiedByUserId: input.verifiedByUserId,
      enabled: true,
      published: input.publish ?? false,
      updatedAt: new Date(),
    },
  });
}
