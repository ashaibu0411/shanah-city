import { redirect } from "next/navigation";
import { AdminGivingPanel } from "@/components/admin/AdminGivingPanel";
import { PageHeader } from "@/components/ui";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function AdminGivingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/giving");
  }

  const canManage = await canManageGivingRecords(user);
  if (!canManage) {
    redirect("/admin/finance");
  }

  return (
    <>
      <PageHeader
        eyebrow="Finance & Admin"
        title="Giving records"
        description="Record gifts manually, filter by date or fund, and send personalized thank-yous."
      />
      <AdminGivingPanel />
    </>
  );
}
