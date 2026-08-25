import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminUrgentAlertPanel } from "@/components/admin/AdminUrgentAlertPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminAlertsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/alerts");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Communications"
        title="Urgent alerts"
        description="Publish a red-hot home page banner when the whole church needs the same critical update right away."
      />
      <AdminUrgentAlertPanel />
    </>
  );
}
