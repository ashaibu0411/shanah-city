import { getAdminPermissions } from "@/lib/admin-access-server";
import { getDevotionWritePermissions } from "@/lib/devotion-access-server";
import { getFinancePermissions } from "@/lib/finance-access-server";
import { getFrontLinersPermissions } from "@/lib/frontliners-access-server";
import { getGalleryUploadPermissions } from "@/lib/gallery-access-server";
import { getWorshipPermissions } from "@/lib/worship-access-server";
import { getKidsMinistryPermissions } from "@/lib/kids-access-server";
import { getMinistryReportPermissions } from "@/lib/ministry-report-access-server";
import type { PublicMember } from "@/lib/auth-types";

const defaultPermissions = {
  canUploadGallery: false,
  canWriteDevotions: false,
  canManageAdmin: false,
  canAccessFinance: false,
  canAccessWorshipPlanner: false,
  canManageWorshipPlan: false,
  canAccessFrontLiners: false,
  canManageFrontLiners: false,
  canAccessKidsMinistry: false,
  canManageKidsMinistry: false,
  canSubmitMinistryReports: false,
  canReviewMinistryReports: false,
};

export async function getSessionPermissions(user: PublicMember | null) {
  if (!user) {
    return defaultPermissions;
  }

  const [gallery, devotion, admin, finance, worship, frontliners, kids, ministryReports] =
    await Promise.all([
      getGalleryUploadPermissions(user),
      getDevotionWritePermissions(user),
      getAdminPermissions(user),
      getFinancePermissions(user),
      getWorshipPermissions(user),
      getFrontLinersPermissions(user),
      getKidsMinistryPermissions(user),
      getMinistryReportPermissions(user),
    ]);

  return {
    ...gallery,
    ...devotion,
    ...admin,
    ...finance,
    ...worship,
    ...frontliners,
    ...kids,
    canSubmitMinistryReports: ministryReports.canSubmitMinistryReports,
    canReviewMinistryReports: ministryReports.canReviewMinistryReports,
  };
}
