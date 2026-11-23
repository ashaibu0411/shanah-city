import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import SmsNotificationsWorkspace from "./workspace";

export default async function SmsNotificationsPage() {
  const user = await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user || !(await canManageAsAdmin(user))) redirect("/");
  return <SmsNotificationsWorkspace />;
}
