import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FrontLinersHub } from "@/components/frontliners/FrontLinersHub";
import { PageHeader } from "@/components/ui";
import { canAccessFrontLiners } from "@/lib/frontliners-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function FrontLinersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/frontliners");
  }

  if (!(await canAccessFrontLiners(user))) {
    redirect("/groups");
  }

  return (
    <>
      <PageHeader
        eyebrow="FrontLiners"
        title="Sunday service teams"
        description="Usher and greeter schedules for each service. Choir uses Worship; media uses Photos & Live."
      />
      <FrontLinersHub initialDate={params.date} initialTime={params.time} />
    </>
  );
}
