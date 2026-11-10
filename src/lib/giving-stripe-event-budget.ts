/** Per finance diagnostic request: cap Stripe Event.list calls (avoid Vercel timeouts). */
export const MEMBER_RECONCILE_EVENT_LIST_BUDGET = 24;

export type MemberReconcileEventBudgetStats = {
  budgetMax: number;
  listCallsUsed: number;
  budgetExhausted: boolean;
  cacheHits: number;
  found: number;
  notFound: number;
  paginationLimited: number;
};

export function freshMemberReconcileEventBudgetStats(
  budgetMax = MEMBER_RECONCILE_EVENT_LIST_BUDGET,
): MemberReconcileEventBudgetStats {
  return {
    budgetMax,
    listCallsUsed: 0,
    budgetExhausted: false,
    cacheHits: 0,
    found: 0,
    notFound: 0,
    paginationLimited: 0,
  };
}
