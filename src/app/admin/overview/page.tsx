import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminOverviewPanel } from "@/components/admin/AdminOverviewPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canReviewMinistryReports } from "@/lib/ministry-report-access-server";

export default async function AdminOverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/overview");
  }

  const [isAdmin, isPastoral] = await Promise.all([
    canManageAsAdmin(user),
    canReviewMinistryReports(user),
  ]);

  if (!isAdmin && !isPastoral) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Overview"
        description="Guests, giving, volunteers, kids, ministry reports, and comms at a glance."
      />
      <AdminOverviewPanel />
    </>
  );
}
