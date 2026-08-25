import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminGuestsPanel } from "@/components/admin/AdminGuestsPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminGuestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/guests");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Frontliners"
        title="First-time guests"
        description="Visitor connect forms from /guest. Follow up, mark contacted, and archive."
      />
      <AdminGuestsPanel />
    </>
  );
}
