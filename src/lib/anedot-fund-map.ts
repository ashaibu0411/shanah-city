import { GIVING_FUND_OPTIONS, type GivingFund } from "@/lib/giving-types";

const ALLOWED_FUNDS = new Set<string>(GIVING_FUND_OPTIONS.map((option) => option.value));

export function resolveAnedotFundToGivingFund(
  fund: { id?: string; name?: string; identifier?: string } | null | undefined,
  allowlist: Record<string, string>,
): GivingFund | null {
  if (!fund) return null;
  const keys = [fund.identifier, fund.id, fund.name].filter(Boolean) as string[];
  for (const key of keys) {
    const mapped = allowlist[key];
    if (mapped && ALLOWED_FUNDS.has(mapped)) {
      return mapped as GivingFund;
    }
  }
  return null;
}

export function resolveIntentFundOrNull(fund: string): GivingFund | null {
  return ALLOWED_FUNDS.has(fund) ? (fund as GivingFund) : null;
}
