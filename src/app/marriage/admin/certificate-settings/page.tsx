import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MarriageCertificateSettingsPanel } from "@/components/marriage/MarriageCertificateSettingsPanel";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageCertificateSettings } from "@/lib/marriage-certificate-settings-server";

export default async function MarriageCertificateSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageCertificateSettings(user))) {
    redirect("/marriage");
  }

  return (
    <div className={marriagePremium.page}>
      <MarriageCertificateSettingsPanel />
    </div>
  );
}
