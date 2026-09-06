import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminPortalHome } from "@/components/admin/AdminPortalHome";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessFinance } from "@/lib/finance-access-server";
import { canReviewMinistryReports } from "@/lib/ministry-report-access-server";
import { canAccessAdminPortal } from "@/lib/admin-portal-links";

export default async function AdminPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin");
  }

  const [isAdmin, isPastoral, canFinance] = await Promise.all([
    canManageAsAdmin(user),
    canReviewMinistryReports(user),
    canAccessFinance(user),
  ]);

  if (
    !canAccessAdminPortal({
      canManageAdmin: isAdmin,
      canReviewMinistryReports: isPastoral,
      canAccessFinance: canFinance,
    })
  ) {
    redirect("/");
  }

  return <AdminPortalHome />;
}
