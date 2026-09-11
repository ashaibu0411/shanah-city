import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminPrayerSchedulePanel } from "@/components/admin/AdminPrayerSchedulePanel";
import { PageHeader } from "@/components/ui";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function AdminPrayerSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/admin/prayer-schedule");
  }

  if (!(await canManageAsAdmin(user))) {
    redirect("/admin");
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Prayer rotations"
        description="Create Shift Your Morning and Shift Your Evening leader schedules, then approve and send them to members in the app."
        sectionIndex={0}
        accentWord="rotations"
      />
      <AdminPrayerSchedulePanel />
    </>
  );
}
