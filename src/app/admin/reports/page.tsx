import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AdminReportsHub } from "@/components/admin/AdminReportsHub";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/reports");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/admin");
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin Group"
        title="Reports"
        description="Shift Your Morning and Evening join clicks, plus monthly leader accountability."
      />
      <Suspense fallback={<p className="text-sm text-night-600">Loading reports…</p>}>
        <AdminReportsHub />
      </Suspense>
    </>
  );
}
