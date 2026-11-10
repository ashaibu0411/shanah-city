/** Per finance diagnostic request: cap Stripe Event.list calls (avoid Vercel timeouts). */
export const MEMBER_RECONCILE_EVENT_LIST_BUDGET = 24;

export type MemberReconcileEventBudgetStats = {
  budgetMax: number;
  listCallsUsed: number;
  budgetExhausted: boolean;
  cacheHits: number;
  retentionSkipped: number;
  found: number;
  notFound: number;
  paginationLimited: number;
};

let listCallsRemaining = MEMBER_RECONCILE_EVENT_LIST_BUDGET;
let stats: MemberReconcileEventBudgetStats = freshStats();

function freshStats(): MemberReconcileEventBudgetStats {
  return {
    budgetMax: MEMBER_RECONCILE_EVENT_LIST_BUDGET,
    listCallsUsed: 0,
    budgetExhausted: false,
    cacheHits: 0,
    retentionSkipped: 0,
    found: 0,
    notFound: 0,
    paginationLimited: 0,
  };
}

export function resetMemberReconcileEventBudget() {
  listCallsRemaining = MEMBER_RECONCILE_EVENT_LIST_BUDGET;
  stats = freshStats();
}

export function getMemberReconcileEventBudgetStats() {
  return { ...stats };
}

export function tryConsumeMemberReconcileEventListCall() {
  if (listCallsRemaining <= 0) {
    stats.budgetExhausted = true;
    return false;
  }
  listCallsRemaining -= 1;
  stats.listCallsUsed += 1;
  return true;
}

export function recordMemberReconcileEventCacheHit() {
  stats.cacheHits += 1;
}

export function recordMemberReconcileEventRetentionSkipped() {
  stats.retentionSkipped += 1;
}

export function recordMemberReconcileEventFound() {
  stats.found += 1;
}

export function recordMemberReconcileEventNotFound() {
  stats.notFound += 1;
}

export function recordMemberReconcileEventPaginationLimited() {
  stats.paginationLimited += 1;
}
