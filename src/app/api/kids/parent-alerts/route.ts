import {cookies} from "next/headers";
import {randomInt} from "node:crypto";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {getUserFromSession,SESSION_COOKIE} from "@/lib/auth-server";
import {canAccessKidsMinistry,canManageKidsMinistry} from "@/lib/kids-access-server";
import {canOperateKidsMedia} from "@/lib/kids-parent-alert-access";
import {getKidCheckIns} from "@/lib/member-server";
import {resolveKidsMinistryScope,assertActiveCheckInScope} from "@/lib/kids-ministry-policy-server";
import {getServiceDateLabel} from "@/lib/kids-workspace-server";
import {sendPushToUsers} from "@/lib/push-server";
import {getGroups} from "@/lib/group-server";
import {isMediaGroup} from "@/lib/media-group";
import {enforceRateLimit,getClientIp,rateLimitResponse} from "@/lib/rate-limit-server";
async function viewer(){const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);return {user,kids:await canAccessKidsMinistry(user),leader:await canManageKidsMinistry(user),media:await canOperateKidsMedia(user)}}
const active=["requested","pending_media","approved","displaying"];
export async function GET(){
 const a=await viewer();if(!a.user||(!a.kids&&!a.media))return NextResponse.json({error:"Not authorized"},{status:403});
 await prisma.kidsParentAlert.updateMany({where:{status:{in:active},expiresAt:{lt:new Date()}},data:{status:"expired"}});
 const records=await prisma.kidsParentAlert.findMany({where:{status:{in:active}},orderBy:{requestedAt:"desc"},take:50});
 return NextResponse.json({alerts:records.map(r=>({id:r.id,checkInId:a.kids?r.checkInId:undefined,displayCode:r.displayCode,status:r.status,requestedAt:r.requestedAt,expiresAt:r.expiresAt})),canApprove:a.media,canManage:a.kids});
}
export async function POST(request:Request){
 const a=await viewer();if(!a.user||(!a.kids&&!a.media))return NextResponse.json({error:"Not authorized"},{status:403});
 const limit=await enforceRateLimit("kids:parent-alert:"+a.user.id+":"+getClientIp(request),{limit:20,windowSeconds:900});
 if(!limit.allowed)return rateLimitResponse(limit.retryAfterSeconds);
 const b=await request.json().catch(()=>null);const action=String(b?.action||"");
 if(action==="request"){
  if(!a.kids)return NextResponse.json({error:"Kids access required"},{status:403});
  const checkInId=String(b?.checkInId||"");const checkin=(await getKidCheckIns()).find(x=>x.id===checkInId&&!x.checkedOutAt);
  if(!checkin)return NextResponse.json({error:"Active check-in not found"},{status:404});
  try{const scope=await resolveKidsMinistryScope(a.user,checkin.service,getServiceDateLabel());await assertActiveCheckInScope(a.user,checkin,scope)}catch{return NextResponse.json({error:"Room access denied"},{status:403})}
  const existing=await prisma.kidsParentAlert.findFirst({where:{checkInId,status:{in:active},expiresAt:{gt:new Date()}}});
  if(existing)return NextResponse.json({alert:{id:existing.id,displayCode:existing.displayCode,status:existing.status},existing:true});
  let alert;try{alert=await prisma.kidsParentAlert.create({data:{checkInId,displayCode:"K-"+randomInt(100000,999999),requestedById:a.user.id,expiresAt:new Date(Date.now()+15*60000)}})}catch{return NextResponse.json({error:"Please retry creating the alert"},{status:409})}
  await prisma.kidsParentAlertAudit.create({data:{alertId:alert.id,action:"requested",actorId:a.user.id}});
  if(checkin.parentUserId){await sendPushToUsers([checkin.parentUserId],{title:"Shanah Kids — parent assistance requested",body:"Please come to the Shanah Kids check-in desk or contact the Kids Ministry team.",url:"/profile"},"kids").catch(()=>null)}
  return NextResponse.json({alert:{id:alert.id,displayCode:alert.displayCode,status:alert.status},deliveryNote:checkin.parentUserId?"App alert attempted; delivery and reading are not guaranteed.":"No linked app guardian; contact the verified pickup guardian directly."},{status:201});
 }
 const id=String(b?.id||"");const alert=await prisma.kidsParentAlert.findUnique({where:{id}});
 if(!alert)return NextResponse.json({error:"Alert not found"},{status:404});
 if(!active.includes(alert.status)||alert.expiresAt<new Date())return NextResponse.json({error:"Alert expired or closed"},{status:409});
 const activeCheckin=(await getKidCheckIns()).some(x=>x.id===alert.checkInId&&!x.checkedOutAt);
 if(!activeCheckin&&action!=="resolve"&&action!=="cancel")return NextResponse.json({error:"Child is no longer checked in. Close the alert."},{status:409});
 if(action==="escalate"){
  if(!a.kids)return NextResponse.json({error:"Kids access required"},{status:403});
  if(alert.status!=="requested")return NextResponse.json({error:"Already escalated"},{status:409});
  if(Date.now()-alert.requestedAt.getTime()<120000&&!a.leader)return NextResponse.json({error:"Wait two minutes for routine requests, or ask the Kids leader to escalate."},{status:409});
  const checkin=(await getKidCheckIns()).find(x=>x.id===alert.checkInId&&!x.checkedOutAt);
  if(!checkin)return NextResponse.json({error:"Check-in no longer active"},{status:409});
  try{const scope=await resolveKidsMinistryScope(a.user,checkin.service,getServiceDateLabel());await assertActiveCheckInScope(a.user,checkin,scope)}catch{return NextResponse.json({error:"Room access denied"},{status:403})}
  await prisma.kidsParentAlert.update({where:{id},data:{status:"pending_media",escalatedAt:new Date()}});
  const groups=await getGroups();const ids=[...new Set(groups.filter(isMediaGroup).flatMap(g=>[...g.memberIds,...g.adminIds]))];
  if(ids.length)await sendPushToUsers(ids,{title:"Kids parent screen request",body:"A parent assistance code is awaiting media approval.",url:"/kids-parent-alerts"},"announcements").catch(()=>null);
 }else if(action==="approve"){
  if(!a.media||alert.status!=="pending_media")return NextResponse.json({error:"Media approval unavailable"},{status:403});
  await prisma.kidsParentAlert.update({where:{id},data:{status:"approved",approvedById:a.user.id,approvedAt:new Date()}});
 }else if(action==="display"){
  if(!a.media||alert.status!=="approved")return NextResponse.json({error:"Approval required"},{status:403});
  await prisma.kidsParentAlert.update({where:{id},data:{status:"displaying",displayedAt:new Date()}});
 }else if(action==="resolve"||action==="cancel"){
  if(!a.kids&&!a.media)return NextResponse.json({error:"Not authorized"},{status:403});
  await prisma.kidsParentAlert.update({where:{id},data:{status:action==="resolve"?"resolved":"cancelled",resolvedById:a.user.id,resolvedAt:new Date()}});
 }else return NextResponse.json({error:"Unknown action"},{status:400});
 await prisma.kidsParentAlertAudit.create({data:{alertId:id,action,actorId:a.user.id}});
 return NextResponse.json({ok:true});
}
