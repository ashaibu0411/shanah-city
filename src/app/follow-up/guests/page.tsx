import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GuestQueuePanel } from "@/components/frontliners/GuestQueuePanel";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessFollowUp } from "@/lib/follow-up-access-server";

export default async function FollowUpGuestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/follow-up/guests");
  }

  if (!(await canAccessFollowUp(user))) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Follow-up ministry"
        title="Guest queue"
        description="Contact first-time guests within 48 hours. Updates sync with the church guest system."
      />
      <GuestQueuePanel variant="follow-up" />
    </>
  );
}
