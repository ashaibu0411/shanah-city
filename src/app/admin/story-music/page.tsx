import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminStoryMusicPanel } from "@/components/admin/AdminStoryMusicPanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminStoryMusicPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/story-music");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/admin/approvals");
  }

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Story music — rights & catalog"
        description="Document rights, verify intake, and publish authorized gospel recordings. Pilot tooling — hybrid flags remain off in production."
      />
      <AdminStoryMusicPanel />
    </>
  );
}
