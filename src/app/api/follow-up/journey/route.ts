import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, getUserFromSession } from "@/lib/auth-server";
import { canAccessFollowUp, canManageFollowUp } from "@/lib/follow-up-access-server";

const stages = ["first_visit", "contacted", "second_visit", "regular_attendee", "membership_interest", "connected_member"] as const;
async function access() {
 const user = await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if (!user || !(await canAccessFollowUp(user))) return null;
 return { user, leader: await canManageFollowUp(user) };
}
export async function GET() {
 const auth = await access();
 if (!auth) return NextResponse.json({error:"Access denied"}, {status:403});
 const where = auth.leader ? {} : {workerId:auth.user.id};
 const assignments = await prisma.guestFollowUpAssignment.findMany({where, orderBy:{dueAt:"asc"},take:500});
 const ids = assignments.map(a=>a.guestId);
 const messages = auth.leader ? await prisma.guestFollowUpMessage.findMany({orderBy:{createdAt:"desc"},take:100}) : await prisma.guestFollowUpMessage.findMany({where:{guestId:{in:ids}},orderBy:{createdAt:"desc"},take:100});
 const open = assignments.filter(a=>!a.completedAt);
 const now = Date.now();
 return NextResponse.json({assignments,messages,summary:{open:open.length,overdue:open.filter(a=>a.dueAt.getTime()<now).length,callbacks:open.filter(a=>a.nextContactAt && a.nextContactAt.getTime()<=now).length,connected:assignments.filter(a=>a.journeyStage==="connected_member").length}});
}
export async function PATCH(request:Request) {
 const auth = await access();
 if (!auth) return NextResponse.json({error:"Access denied"}, {status:403});
 const body = await request.json().catch(()=>null);
 const guestId = typeof body?.guestId==="string" ? body.guestId.trim() : "";
 const stage = typeof body?.journeyStage==="string" ? body.journeyStage : undefined;
 if (!guestId || (stage && !stages.includes(stage as typeof stages[number]))) return NextResponse.json({error:"Invalid guest or stage"}, {status:400});
 const existing = await prisma.guestFollowUpAssignment.findUnique({where:{guestId}});
 if (!existing) return NextResponse.json({error:"Assign this guest first"}, {status:404});
 if (!auth.leader && existing.workerId!==auth.user.id) return NextResponse.json({error:"Not your assignment"}, {status:403});
 let nextContactAt:Date|null|undefined;
 if (body.nextContactAt === null || body.nextContactAt === "") nextContactAt=null;
 else if (typeof body.nextContactAt==="string") {
  const d=new Date(body.nextContactAt);
  if (!Number.isFinite(d.getTime()) || d.getTime()<Date.now()-60000 || d.getTime()>Date.now()+180*86400000) return NextResponse.json({error:"Choose a valid future date within 180 days"}, {status:400});
  nextContactAt=d;
 }
 const assignment=await prisma.guestFollowUpAssignment.update({where:{guestId},data:{...(stage?{journeyStage:stage}:{}),...(nextContactAt!==undefined?{nextContactAt}:{}),...(nextContactAt?{completedAt:null}:{} )}});
 return NextResponse.json({assignment});
}
