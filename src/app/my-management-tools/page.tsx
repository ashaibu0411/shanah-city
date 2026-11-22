import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canUseDelegatedPermission } from "@/lib/delegated-permissions-server";
export default async function MyManagementTools(){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if(!user)redirect("/sign-in?next=/my-management-tools");
 const announcements=await canUseDelegatedPermission(user,"announcements.manage");
 return <main className="mx-auto max-w-3xl space-y-5 p-5"><h1 className="text-2xl font-bold">My Management Tools</h1><p className="text-sm text-slate-600">Only the responsibilities assigned to you appear here.</p>{announcements?<Link href="/calendar?view=announcements" className="block rounded-xl border bg-white p-5 font-semibold text-blue-700">Weekly announcements — create and publish</Link>:<p className="rounded-xl border p-5 text-sm">No management tools have been assigned to your account yet.</p>}</main>;
}
