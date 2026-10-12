import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import {
  SHANAH_WORSHIP_GROUP_ID,
  choirPlanKey,
} from "@/lib/choir-group-constants";
import type { ChoirSetlistPagePayload, ChoirSetlistServiceSummary } from "@/lib/choir-setlist-types";
import { getChoirSetlistFavoriteIds } from "@/lib/stores/choir-setlist-favorites-json";
import { listWorshipPlans } from "@/lib/worship-server";
import {
  canManageWorshipPlan,
  canViewWorshipServicePlan,
} from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  type WorshipServicePlan,
} from "@/lib/worship-types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function comparePlan(a: WorshipServicePlan, b: WorshipServicePlan) {
  return (
    combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
    combinePlanDateTime(b.serviceDate, b.serviceTime).getTime()
  );
}

function toServiceSummary(plan: WorshipServicePlan): ChoirSetlistServiceSummary {
  return {
    planKey: choirPlanKey(plan.serviceDate, plan.serviceTime),
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    title: plan.title?.trim() || "Sunday Service",
    dateTimeLabel: serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    songCount: plan.songs.length,
    status: plan.status,
  };
}

export async function buildChoirSetlistPagePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirSetlistPagePayload | null> {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }

  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return null;
  }

  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }

  const canManage = await canManageWorshipPlan(user);
  const since = todayIso();
  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => canViewWorshipServicePlan(canManage, plan))
    .sort(comparePlan);

  const favoriteSongIds = await getChoirSetlistFavoriteIds(user.id);

  return {
    services: plans.map(toServiceSummary),
    favoriteSongIds,
    canManage,
    groupChatHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?chat=1`,
  };
}
