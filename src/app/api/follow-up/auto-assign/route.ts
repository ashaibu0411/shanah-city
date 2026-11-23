import {cookies} from "next/headers";import {NextResponse} from "next/server";import {prisma} from "@/lib/db";import {SESSION_COOKIE,getUserFromSession} from "@/lib/auth-server";import {canManageFollowUp} from "@/lib/follow-up-access-server";import {getGroups,getGroupDetail} from "@/lib/group-server";import {getConfiguredFollowUpGroupId} from "@/lib/follow-up-access-server";import {memberHasFullGroupAccess} from "@/lib/ministry-readiness-server";
export async function POST(request:Request){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);if(!user||!(await canManageFollowUp(user)))return NextResponse.json({error:"Leader access required"},{status:403});
 const body=await request.json().catch(()=>null);if(body?.confirm!==true)return NextResponse.json({error:"Confirmation required"},{status:400});
 const groupId=getConfiguredFollowUpGroupId();const groups=await getGroups();if(!groups.some(g=>g.id===groupId))return NextResponse.json({error:"Follow-Up group not found"},{status:400});
 const detail=await getGroupDetail(groupId);const candidates=detail?.members??[];const allowed=await Promise.all(candidates.map(async m=>({id:m.id,name:m.name,ok:(await memberHasFullGroupAccess(m.id,groupId)).allowed})));
 const eligible=allowed.filter(w=>w.ok);const unavailable=await prisma.followUpWorkerAvailability.findMany({where:{userId:{in:eligible.map(w=>w.id)},available:false}});
 const blocked=new Set(unavailable.map(x=>x.userId));const workers=eligible.filter(w=>!blocked.has(w.id));
 if(!workers.length)return NextResponse.json({error:"No available approved workers"},{status:400});
 const guests=await prisma.guestSubmission.findMany({where:{status:"new"},orderBy:{submittedAt:"asc"},take:200});
 const existing=await prisma.guestFollowUpAssignment.findMany({where:{guestId:{in:guests.map(g=>g.id)}}});
 const assigned=new Set(existing.map(a=>a.guestId));const open=await prisma.guestFollowUpAssignment.groupBy({by:["workerId"],where:{completedAt:null},_count:{_all:true}});
 const counts=new Map(workers.map(w=>[w.id,open.find(x=>x.workerId===w.id)?._count._all??0]));let created=0;
 for(const guest of guests.filter(g=>!assigned.has(g.id)).slice(0,50)){
  const worker=[...workers].sort((a,b)=>(counts.get(a.id)??0)-(counts.get(b.id)??0)||a.id.localeCompare(b.id))[0];
  const dueAt=new Date(Date.now()+24*3600000);
  const result=await prisma.guestFollowUpAssignment.createMany({data:[{guestId:guest.id,workerId:worker.id,workerName:worker.name,assignedById:user.id,dueAt}],skipDuplicates:true});
  if(result.count){created++;counts.set(worker.id,(counts.get(worker.id)??0)+1);await prisma.pushInboxItem.upsert({where:{userId_dedupeKey:{userId:worker.id,dedupeKey:"follow-up-auto:"+guest.id}},create:{userId:worker.id,dedupeKey:"follow-up-auto:"+guest.id,title:"New guest follow-up assigned",body:"A guest needs a welcome contact within 24 hours.",href:"/follow-up/guests"},update:{}})}
 }
 return NextResponse.json({created,availableWorkers:workers.length});
}
