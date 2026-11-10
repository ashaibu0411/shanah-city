/** Client-safe finance API errors; log details server-side only. */
export const GIVING_FINANCE_GENERIC_ERROR = "Could not complete the finance request.";

export class GivingFinanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GivingFinanceValidationError";
  }
}

export function logGivingFinanceApiError(scope: string, error: unknown) {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`.slice(0, 240)
      : String(error).slice(0, 240);
  console.error(`[giving-finance:${scope}]`, detail);
}
