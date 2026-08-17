import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { WorshipPlannerPanel } from "@/components/worship/WorshipPlannerPanel";
import { PageHeader } from "@/components/ui";
import { canAccessWorshipPlanner } from "@/lib/worship-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function WorshipPlannerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/worship");
  }

  if (!(await canAccessWorshipPlanner(user))) {
    redirect("/groups");
  }

  return (
    <>
      <PageHeader
        eyebrow="Shanah City Worship"
        title="Worship planner"
        description="Plan setlists, track team readiness, and share rehearsal notes for each service."
      />
      <WorshipPlannerPanel />
    </>
  );
}
