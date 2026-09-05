import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CommsHub } from "@/components/comms/CommsHub";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminCommsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/comms");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Communications"
        title="Comms calendar"
        description="Plan church announcements by channel, track ministry requests, and promote finished items to the app."
      />
      <CommsHub />
    </>
  );
}
