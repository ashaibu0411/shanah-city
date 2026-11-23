import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import {getUserFromSession,SESSION_COOKIE} from "@/lib/auth-server";
import {canOperateKidsMedia} from "@/lib/kids-parent-alert-access";
import {KidsParentAlerts} from "@/components/kids/KidsParentAlerts";
export default async function KidsParentAlertsPage(){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if(!user)redirect("/sign-in?next=/kids-parent-alerts");
 if(!(await canOperateKidsMedia(user)))redirect("/groups");
 return <main className="mx-auto max-w-5xl space-y-4 px-4 py-8"><h1 className="text-3xl font-bold">Media Team · Kids Parent Alerts</h1><p className="text-sm text-night-600">Keep this screen open during service. Approve requests before showing the public code on the projector.</p><KidsParentAlerts media/></main>;
}
