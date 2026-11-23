import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {SESSION_COOKIE,getUserFromSession} from "@/lib/auth-server";
import {canAccessFollowUp,canManageFollowUp} from "@/lib/follow-up-access-server";
const steps=["welcome_team_ready","qr_code_visible","new_visitors_reviewed","guest_assignments_complete","follow_up_deadlines_checked","pastoral_requests_escalated","weekly_summary_reviewed"] as const;
async function auth(){const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);return user && await canAccessFollowUp(user)?user:null;}
export async function GET(request:Request){
 const user=await auth();if(!user)return NextResponse.json({error:"Access denied"},{status:403});
 const date=new URL(request.url).searchParams.get("date")||"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return NextResponse.json({error:"Invalid date"},{status:400});
 const record=await prisma.guestCareChecklist.findUnique({where:{serviceDate:date}});
 return NextResponse.json({date,steps,completedSteps:record?.completedSteps??[],updatedAt:record?.updatedAt??null});
}
export async function PUT(request:Request){
 const user=await auth();if(!user || !(await canManageFollowUp(user)))return NextResponse.json({error:"Leader access required"},{status:403});
 const body=await request.json().catch(()=>null);
 const date=typeof body?.date==="string"?body.date:"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(body?.completedSteps)||body.completedSteps.some((s:unknown)=>!steps.includes(s as typeof steps[number])))return NextResponse.json({error:"Invalid checklist"},{status:400});
 const completedSteps=[...new Set(body.completedSteps as string[])];
 const record=await prisma.guestCareChecklist.upsert({where:{serviceDate:date},create:{serviceDate:date,completedSteps,updatedById:user.id},update:{completedSteps,updatedById:user.id}});
 return NextResponse.json({completedSteps:record.completedSteps,updatedAt:record.updatedAt});
}
