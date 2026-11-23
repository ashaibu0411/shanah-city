import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {SESSION_COOKIE,getUserFromSession} from "@/lib/auth-server";
import {canManageFollowUp} from "@/lib/follow-up-access-server";
export async function GET(request:Request){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if(!user || !(await canManageFollowUp(user)))return NextResponse.json({error:"Leader access required"},{status:403});
 const month=new URL(request.url).searchParams.get("month")||new Date().toISOString().slice(0,7);
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return NextResponse.json({error:"Invalid month"},{status:400});
 const start=new Date(month+"-01T00:00:00Z");
 const end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,1));
 const [guests,assignments,activities,returnVisits]=await Promise.all([
 prisma.guestSubmission.findMany({where:{submittedAt:{gte:start,lt:end}},select:{id:true,status:true,isFirstVisit:true}}),
 prisma.guestFollowUpAssignment.findMany({select:{guestId:true,workerId:true,journeyStage:true,completedAt:true,dueAt:true,nextContactAt:true}}),
 prisma.guestFollowUpActivity.findMany({where:{createdAt:{gte:start,lt:end}},select:{guestId:true,actorId:true,outcome:true}}),
 prisma.guestReturnVisit.findMany({where:{visitDate:{gte:month+"-01",lt:end.toISOString().slice(0,10)}},select:{guestId:true}})
 ]);
 const ids=new Set(guests.map(g=>g.id));
 const scoped=assignments.filter(a=>ids.has(a.guestId));
 const contacted=new Set(activities.filter(a=>a.outcome==="connected").map(a=>a.guestId));
 const connected=guests.filter(g=>g.status==="contacted"||contacted.has(g.id)).length;
 const returned=new Set(returnVisits.map(v=>v.guestId)).size;
 const members=scoped.filter(a=>a.journeyStage==="connected_member").length;
 const now=Date.now();
 const overdue=assignments.filter(a=>!a.completedAt&&(a.nextContactAt??a.dueAt).getTime()<now).length;
 const byWorker=Object.entries(activities.reduce<Record<string,number>>((acc,a)=>{acc[a.actorId]=(acc[a.actorId]||0)+1;return acc},{})).map(([workerId,contacts])=>({workerId,contacts}));
 return NextResponse.json({month,guests:guests.length,firstTime:guests.filter(g=>g.isFirstVisit).length,contacted:connected,contactRate:guests.length?Math.round(connected/guests.length*100):0,returned,returnRate:guests.length?Math.round(returnVisits.filter(v=>ids.has(v.guestId)).length/guests.length*100):0,connectedMembers:members,overdue,activities:activities.length,byWorker});
}
