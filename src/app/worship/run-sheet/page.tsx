import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { WorshipRunSheetView } from "@/components/worship/WorshipRunSheetView";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
} from "@/lib/worship-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getWorshipPlan } from "@/lib/worship-server";

export const metadata: Metadata = {
  title: "Run sheet",
};

function canViewPlan(
  userId: string,
  canManage: boolean,
  plan: { status: string; team: Array<{ userId: string }> },
) {
  if (canManage) return true;
  if (plan.status !== "published") return false;
  return plan.team.some((member) => member.userId === userId);
}

export default async function WorshipRunSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; print?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/worship/run-sheet");
  }

  if (!(await canAccessWorshipPlanner(user))) {
    redirect("/groups");
  }

  const serviceDate = params.date?.trim();
  const serviceTime = params.time?.trim() ?? "10:00";

  if (!serviceDate) {
    redirect("/worship");
  }

  const plan = await getWorshipPlan(serviceDate, serviceTime);
  const canManage = await canManageWorshipPlan(user);

  if (!plan) {
    redirect(`/worship?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`);
  }

  if (!canViewPlan(user.id, canManage, plan)) {
    redirect("/worship");
  }

  return <WorshipRunSheetView plan={plan} autoPrint={params.print === "1"} />;
}
