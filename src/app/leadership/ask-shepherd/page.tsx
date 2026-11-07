import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getAskShepherdNavPermission } from "@/lib/ask-shepherd-access-server";
import { isAskShepherdUiPublicEnabled } from "@/lib/ask-shepherd-feature";
import { AskShepherdClient } from "@/components/leadership/AskShepherdClient";

export default async function AskShepherdPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect("/sign-in?next=/leadership/ask-shepherd");
  }
  if (!isAskShepherdUiPublicEnabled()) {
    redirect("/");
  }
  if (!(await getAskShepherdNavPermission(user))) {
    redirect("/");
  }

  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Ask Shepherd"
        description="A private assistant for biblical, practical ministry leadership — not a substitute for pastoral judgment or licensed counseling."
        sectionIndex={0}
        accentWord="shepherd"
      />
      <AskShepherdClient />
    </>
  );
}
