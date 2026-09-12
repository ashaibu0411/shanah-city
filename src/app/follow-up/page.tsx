import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { FollowUpHub } from "@/components/follow-up/FollowUpHub";
import { PageHeader } from "@/components/ui";
import { canAccessFollowUp } from "@/lib/follow-up-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function FollowUpPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/follow-up");
  }

  if (!(await canAccessFollowUp(user))) {
    redirect("/groups");
  }

  return (
    <>
      <PageHeader
        eyebrow="Follow-Up Team"
        title="Guest care & follow-up"
        description="Work the guest queue, contact visitors within 48 hours, and submit your monthly Follow-Up & Care report."
        sectionIndex={0}
        accentWord="follow-up"
      />
      <FollowUpHub />
    </>
  );
}
