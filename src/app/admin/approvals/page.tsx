import { redirect } from "next/navigation";
import { AdminApprovalsPanel } from "@/components/admin/AdminApprovalsPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function AdminApprovalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/approvals");
  }

  const isAdmin = await canManageAsAdmin(user);

  return (
    <>
      <PageHeader
        eyebrow="Admin Group"
        title="Approvals & access"
        description={
          isAdmin
            ? "Approve ministry memberships and privileged group requests."
            : "Track your pending ministry requests. Admin Group members can approve others."
        }
      />
      <AdminApprovalsPanel />
    </>
  );
}
