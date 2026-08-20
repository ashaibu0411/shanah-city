import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { KidsMinistryPanel } from "@/components/kids/KidsMinistryPanel";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { PageHeader } from "@/components/ui";
import { canAccessKidsMinistry } from "@/lib/kids-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function KidsMinistryPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; service?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/kids-ministry");
  }

  if (!(await canAccessKidsMinistry(user))) {
    redirect("/groups");
  }

  return (
    <>
      <PageHeader
        eyebrow="Kids Ministry"
        title="Teacher dashboard"
        description="Room roster, pickup verification, weekly lessons, and incident logs for Shanah Kids."
      />
      <MarkFeedRead feed="kids" />
      <KidsMinistryPanel initialWeek={params.week} initialService={params.service} />
    </>
  );
}
