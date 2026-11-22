import { prisma } from "@/lib/db";
import type { AppNotificationItem } from "@/lib/notification-types";
export async function recordPushInboxItem(userId: string, payload: {title:string;body:string;url:string}) {
  const date = new Date().toISOString().slice(0,10);
  const dedupeKey = `${date}:${payload.url}:${payload.title}`;
  await prisma.pushInboxItem.upsert({
    where: {userId_dedupeKey:{userId,dedupeKey}},
    update: {},
    create: {userId,title:payload.title,body:payload.body,href:payload.url,dedupeKey},
  });
}
export async function getPushInboxItems(userId: string): Promise<AppNotificationItem[]> {
  const records = await prisma.pushInboxItem.findMany({where:{userId,readAt:null},orderBy:{createdAt:"desc"},take:50});
  return records.map(record=>({id:`push-${record.id}`,type:"push" as const,title:record.title,body:record.body,href:record.href,count:1,at:record.createdAt.toISOString()}));
}
export async function markPushInboxRead(userId:string, ids?:string[]) {
  return prisma.pushInboxItem.updateMany({where:{userId,readAt:null,...(ids?{id:{in:ids}}:{})},data:{readAt:new Date()}});
}
