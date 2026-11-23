import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {SESSION_COOKIE,getUserFromSession} from "@/lib/auth-server";
import {canAccessFollowUp,canManageFollowUp} from "@/lib/follow-up-access-server";
async function access(){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 if(!user||!(await canAccessFollowUp(user)))return null;
 return {user,leader:await canManageFollowUp(user)};
}
async function authorizedGuest(guestId:string,viewer:NonNullable<Awaited<ReturnType<typeof access>>>){
 if(viewer.leader)return true;
 const a=await prisma.guestFollowUpAssignment.findUnique({where:{guestId},select:{workerId:true}});
 return a?.workerId===viewer.user.id;
}
export async function GET(request:Request){
 const viewer=await access();if(!viewer)return NextResponse.json({error:"Follow-up access required"},{status:403});
 const guestId=new URL(request.url).searchParams.get("guestId")?.trim()||"";
 if(!guestId||guestId.length>120)return NextResponse.json({error:"Guest required"},{status:400});
 if(!(await authorizedGuest(guestId,viewer)))return NextResponse.json({error:"Not assigned to this guest"},{status:403});
 const visits=await prisma.guestReturnVisit.findMany({where:{guestId},orderBy:{visitDate:"desc"},take:100});
 return NextResponse.json({visits});
}
export async function POST(request:Request){
 const viewer=await access();if(!viewer)return NextResponse.json({error:"Follow-up access required"},{status:403});
 const body=await request.json().catch(()=>null);
 const guestId=typeof body?.guestId==="string"?body.guestId.trim():"";
 const visitDate=typeof body?.visitDate==="string"?body.visitDate.trim():"";
 if(!guestId||guestId.length>120||!/^\d{4}-\d{2}-\d{2}$/.test(visitDate))return NextResponse.json({error:"Guest and visit date required"},{status:400});
 const parsed=new Date(visitDate+"T12:00:00Z");
 if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==visitDate||parsed.getTime()>Date.now()+86400000)return NextResponse.json({error:"Choose a valid visit date"},{status:400});
 if(!(await authorizedGuest(guestId,viewer)))return NextResponse.json({error:"Not assigned to this guest"},{status:403});
 const guest=await prisma.guestSubmission.findUnique({where:{id:guestId},select:{id:true,visitDate:true,submittedAt:true}});
 if(!guest)return NextResponse.json({error:"Guest not found"},{status:404});
 const first=guest.visitDate||guest.submittedAt.toISOString().slice(0,10);
 if(visitDate<=first)return NextResponse.json({error:"Return visit must be after the first recorded visit"},{status:400});
 const visit=await prisma.guestReturnVisit.upsert({where:{guestId_visitDate:{guestId,visitDate}},create:{guestId,visitDate,recordedById:viewer.user.id},update:{}});
 await prisma.guestFollowUpAssignment.updateMany({where:{guestId,journeyStage:{in:["first_visit","contacted"]}},data:{journeyStage:"second_visit"}});
 return NextResponse.json({visit},{status:201});
}
