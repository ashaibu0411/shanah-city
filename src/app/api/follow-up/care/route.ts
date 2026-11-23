import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {SESSION_COOKIE,getUserFromSession} from "@/lib/auth-server";
import {canAccessFollowUp,canManageFollowUp} from "@/lib/follow-up-access-server";
const steps=["welcomed","met_leader","introduced_ministry","invited_back","welcome_completed"];
const ministries=["Men of Legacy","Transformed Women","Young Adults","Shanah Worship","Shanah Kids","Prayer Ministry"];
async function auth(){const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);if(!user||!(await canAccessFollowUp(user)))return null;return {user,leader:await canManageFollowUp(user)}}
async function allowed(guestId:string,actor:NonNullable<Awaited<ReturnType<typeof auth>>>){if(actor.leader)return true;const a=await prisma.guestFollowUpAssignment.findUnique({where:{guestId},select:{workerId:true}});return a?.workerId===actor.user.id}
export async function GET(request:Request){
 const actor=await auth();if(!actor)return NextResponse.json({error:"Access denied"},{status:403});
 const guestId=new URL(request.url).searchParams.get("guestId")?.trim()||"";
 if(!guestId||guestId.length>120||!(await allowed(guestId,actor)))return NextResponse.json({error:"Guest access denied"},{status:403});
 const profile=await prisma.guestCareProfile.findUnique({where:{guestId}});
 if(!profile)return NextResponse.json({profile:null});
 const {wantsPrayer,wantsPastoralContact,referralNote,...general}=profile;
 return NextResponse.json({profile:actor.leader?profile:general});
}
export async function PATCH(request:Request){
 const actor=await auth();if(!actor)return NextResponse.json({error:"Access denied"},{status:403});
 const body=await request.json().catch(()=>null);
 const guestId=typeof body?.guestId==="string"?body.guestId.trim():"";
 if(!guestId||guestId.length>120||!(await allowed(guestId,actor)))return NextResponse.json({error:"Guest access denied"},{status:403});
 const guest=await prisma.guestSubmission.findUnique({where:{id:guestId},select:{id:true}});
 if(!guest)return NextResponse.json({error:"Guest not found"},{status:404});
 const existing=await prisma.guestCareProfile.findUnique({where:{guestId}});
 const data:{hospitalitySteps?:string[];referralStatus?:string;referralMinistry?:string|null;referralNote?:string|null;updatedById:string}={updatedById:actor.user.id};
 if(body.hospitalitySteps!==undefined){if(!Array.isArray(body.hospitalitySteps)||body.hospitalitySteps.some((x:unknown)=>typeof x!=="string"||!steps.includes(x)))return NextResponse.json({error:"Invalid checklist"},{status:400});data.hospitalitySteps=[...new Set(body.hospitalitySteps as string[])]}
 if(body.referralStatus!==undefined||body.referralMinistry!==undefined||body.referralNote!==undefined){
  if(!actor.leader)return NextResponse.json({error:"Leader access required for referrals"},{status:403});
  if(body.referralStatus!==undefined){if(!["none","pending","introduced","completed","declined"].includes(body.referralStatus))return NextResponse.json({error:"Invalid referral status"},{status:400});data.referralStatus=body.referralStatus}
  if(body.referralMinistry!==undefined){if(body.referralMinistry!==null&&!ministries.includes(body.referralMinistry))return NextResponse.json({error:"Invalid ministry"},{status:400});data.referralMinistry=body.referralMinistry}
  if(body.referralNote!==undefined){if(typeof body.referralNote!=="string"||body.referralNote.length>1000)return NextResponse.json({error:"Invalid note"},{status:400});data.referralNote=body.referralNote}
 }
 const profile=await prisma.guestCareProfile.upsert({where:{guestId},create:{guestId,...data},update:data});
 const {wantsPrayer,wantsPastoralContact,referralNote,...general}=profile;
 return NextResponse.json({profile:actor.leader?profile:general});
}
