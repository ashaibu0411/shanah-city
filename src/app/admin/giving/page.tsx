import { redirect } from "next/navigation";
import { AdminGivingPanel } from "@/components/admin/AdminGivingPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function AdminGivingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/giving");
  }

  const isAdmin = await canManageAsAdmin(user);
  if (!isAdmin) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin Group"
        title="Giving records"
        description="Record gifts manually, filter by date or fund, and export a spreadsheet report."
      />
      <AdminGivingPanel />
    </>
  );
}
