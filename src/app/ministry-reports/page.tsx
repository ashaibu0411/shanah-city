import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, PageHeader } from "@/components/ui";
import { getLeaderMinistryGroups } from "@/lib/ministry-report-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function MinistryReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/ministry-reports");
  }

  const leaderGroups = await getLeaderMinistryGroups(user.id);

  if (leaderGroups.length === 0) {
    redirect("/groups");
  }

  if (leaderGroups.length === 1) {
    redirect(`/groups/${leaderGroups[0].id}?report=1`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Monthly ministry reports"
        description="Open your group and use the Monthly report tab to submit accountability to pastoral staff."
      />
      <div className="space-y-3">
        {leaderGroups.map((group) => (
          <Card key={group.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-night-900">{group.name}</p>
              <p className="text-sm text-night-500">{group.template.title}</p>
            </div>
            <Link
              href={`/groups/${group.id}?report=1`}
              className="rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-sand-50"
            >
              Open report
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
