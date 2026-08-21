import { redirect } from "next/navigation";
import { AdminFinancePanel } from "@/components/admin/AdminFinancePanel";
import { FinanceGivingEntryPanel } from "@/components/admin/FinanceGivingEntryPanel";
import { PageHeader } from "@/components/ui";
import { canAccessFinance } from "@/lib/finance-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { cookies } from "next/headers";

export default async function AdminFinancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/finance");
  }

  if (!(await canAccessFinance(user))) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Finance Team"
        title="Weekly count"
        description="Enter Sunday offering totals and record Zelle, Cash App, Venmo, cash, and check gifts matched to each member."
      />
      <FinanceGivingEntryPanel />
      <AdminFinancePanel />
    </>
  );
}
