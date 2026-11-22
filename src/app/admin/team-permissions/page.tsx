import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { DelegatedPermissionsPanel } from "@/components/admin/DelegatedPermissionsPanel";
export default async function TeamPermissionsPage(){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if(!user)redirect("/sign-in?next=/admin/team-permissions");
 if(!(await canManageAsAdmin(user)))redirect("/");
 return <main className="mx-auto max-w-3xl space-y-5 p-4"><h1 className="text-2xl font-bold">Team permissions</h1><DelegatedPermissionsPanel/></main>;
}
