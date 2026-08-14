import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DevotionAdminPanel } from "@/components/admin/DevotionAdminPanel";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";

export default async function DevotionAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canWriteDevotions(user))) {
    redirect("/devotions");
  }

  return (
    <>
      <PageHeader
        eyebrow="Team ZNCF"
        title="Write devotions"
        description="Schedule devotions with a calendar and time picker. They go live automatically at the chosen time."
      />
      <DevotionAdminPanel />
    </>
  );
}
