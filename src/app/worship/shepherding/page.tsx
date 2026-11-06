import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessWorshipPlanner } from "@/lib/worship-access-server";
import { isTemperamentShepherdingHubEnabled } from "@/lib/temperament-shepherding-feature";
import { getTemperamentShepherdingHubNav } from "@/lib/temperament-shepherding-access-server";
import { WorshipShepherdingHubClient } from "@/components/worship/WorshipShepherdingHubClient";

export default async function WorshipShepherdingHubPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/worship/shepherding");
  }
  if (!(await canAccessWorshipPlanner(user))) {
    redirect("/groups");
  }
  if (!isTemperamentShepherdingHubEnabled()) {
    redirect("/worship");
  }
  if (!(await getTemperamentShepherdingHubNav(user))) {
    redirect("/worship");
  }

  return (
    <>
      <PageHeader
        eyebrow="Shanah City Worship"
        title="Temperament &amp; Shepherding Hub"
        description="Private reflections for teamwork and communication. Optional participation — your answers stay private unless you choose to share a summary with worship leadership."
        sectionIndex={0}
        accentWord="shepherding"
      />
      <WorshipShepherdingHubClient />
    </>
  );
}
