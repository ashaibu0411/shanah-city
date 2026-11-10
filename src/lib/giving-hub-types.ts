export type GivingHubPaymentMethodKey = "zelle" | "cashapp" | "venmo" | "paypal" | "zeffy";

export type GivingHubPaymentAction = "copy" | "link";

export type PublicGivingHubMethod = {
  id: string;
  methodKey: GivingHubPaymentMethodKey;
  displayName: string;
  description: string;
  action: GivingHubPaymentAction;
  copyValue?: string;
  copyHint?: string;
  url?: string;
  tone?: string;
};

export type AdminGivingHubMethod = PublicGivingHubMethod & {
  enabled: boolean;
  published: boolean;
  verified: boolean;
  verifiedAt: string | null;
  recipientValue: string | null;
  sortOrder: number;
};

export type GivingHubOffPlatformIntentStatus =
  | "pending_finance"
  | "acknowledged"
  | "matched"
  | "dismissed";
