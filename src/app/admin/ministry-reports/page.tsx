import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminMinistryReportsPanel } from "@/components/admin/AdminMinistryReportsPanel";
import { PageHeader } from "@/components/ui";
import { canReviewMinistryReports } from "@/lib/ministry-report-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminMinistryReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/ministry-reports");
  }

  if (!(await canReviewMinistryReports(user))) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Ministry accountability"
        description="Review monthly leader reports, spot dormant ministries early, and send clear action steps back to each team."
      />
      <AdminMinistryReportsPanel />
    </>
  );
}
