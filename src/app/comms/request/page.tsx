import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CommsRequestSubmitForm } from "@/components/comms/CommsRequestsPanel";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export default async function CommsRequestPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/comms/request");
  }

  return (
    <>
      <PageHeader
        eyebrow="Communications"
        title="Submit a comms request"
        description="Media, worship, and ministry teams can request graphics, copy, email, social posts, app banners, and push notifications."
      />
      <CommsRequestSubmitForm />
    </>
  );
}
