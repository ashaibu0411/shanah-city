import { redirect } from "next/navigation";
import { AdminPeoplePanel } from "@/components/admin/AdminPeoplePanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function AdminPeoplePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/people");
  }

  const isAdmin = await canManageAsAdmin(user);
  if (!isAdmin) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Member directory"
        description="Search by name, then open a profile to edit details or manage household members."
      />
      <AdminPeoplePanel />
    </>
  );
}
