import { prisma } from "@/lib/db";
import { getGroups } from "@/lib/group-server";
import { getConfiguredFollowUpGroupId } from "@/lib/follow-up-access-server";
import { getUserById } from "@/lib/auth-server";
import { sendPushToUsers } from "@/lib/push-server";

const DAY = 86400000;
export async function processFollowUpReminders(now = new Date()) {
 const assignments = await prisma.guestFollowUpAssignment.findMany({where:{completedAt:null},take:500});
 const groups = await getGroups();
 const leaders = groups.find(g=>g.id===getConfiguredFollowUpGroupId())?.adminIds ?? [];
 let workerAlerts=0,leaderAlerts=0,skipped=0;
 for (const task of assignments) {
  const due = task.nextContactAt ?? task.dueAt;
  const hours=(due.getTime()-now.getTime())/3600000;
  if (hours>24) continue;
  const period=hours<0?"overdue":hours<=2?"due":"upcoming";
  const day=now.toISOString().slice(0,10);
  const dedupeKey=`follow-up:${period}:${task.guestId}:${day}`;
  const existing=await prisma.pushInboxItem.findUnique({where:{userId_dedupeKey:{userId:task.workerId,dedupeKey}}});
  if(existing){skipped++;continue;}
  const title=period==="overdue"?"Follow-up overdue":period==="due"?"Follow-up due soon":"Upcoming guest follow-up";
  await prisma.pushInboxItem.create({data:{userId:task.workerId,dedupeKey,title,body:"A guest follow-up task needs your attention. Open your assigned guest list.",href:"/follow-up/guests"}});
  workerAlerts++;
  await sendPushToUsers([task.workerId],{title,body:"Please review your guest follow-up task.",url:"/follow-up/guests"},"announcements").catch(()=>null);
  if(period==="overdue") {
   for(const leaderId of leaders.filter(id=>id!==task.workerId)) {
    const key=`follow-up:leader-overdue:${task.guestId}:${day}`;
    await prisma.pushInboxItem.upsert({where:{userId_dedupeKey:{userId:leaderId,dedupeKey:key}},create:{userId:leaderId,dedupeKey:key,title:"Guest follow-up needs attention",body:"An assigned guest follow-up is overdue. Review the ministry dashboard.",href:"/follow-up/guests"},update:{}});
    leaderAlerts++;
   }
  }
 }
 return {ok:true,workerAlerts,leaderAlerts,skipped,checked:assignments.length};
}
