import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSermonListenPanel } from "@/components/admin/AdminSermonListenPanel";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";

export default async function AdminSermonsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Media"
        title="Sermon Listen"
        description="Pair each YouTube message with one audio upload so members can tap Listen anywhere in the app."
      />
      <AdminSermonListenPanel />
    </>
  );
}
