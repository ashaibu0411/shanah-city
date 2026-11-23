import {cookies} from "next/headers";import {NextResponse} from "next/server";import {prisma} from "@/lib/db";import {getUserFromSession,SESSION_COOKIE} from "@/lib/auth-server";import {canAccessKidsMinistry,canManageKidsMinistry} from "@/lib/kids-access-server";import {enforceRateLimit,getClientIp,rateLimitResponse} from "@/lib/rate-limit-server";
export async function GET(){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);if(!user||!(await canAccessKidsMinistry(user)))return NextResponse.json({error:"Access denied"},{status:403});
 const arrivals=await prisma.kidsArrivalRequest.findMany({where:{status:"pending"},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({arrivals});
}
export async function POST(request:Request){
 const limit=await enforceRateLimit("kids:arrival:"+getClientIp(request),{limit:8,windowSeconds:3600});if(!limit.allowed)return rateLimitResponse(limit.retryAfterSeconds);
 const body=await request.json().catch(()=>null);if(!body||body.website)return NextResponse.json({error:"Invalid submission"},{status:400});
 const guardianName=String(body.guardianName||"").trim().slice(0,100),phone=String(body.phone||"").replace(/[^+0-9]/g,"").slice(0,20),email=String(body.email||"").trim().slice(0,150);
 if(guardianName.length<2||phone.replace(/\D/g,"").length<10||email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Enter a valid guardian name and phone number."},{status:400});
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 const family=user?.family?.filter(x=>x.relationship==="child")??[];
 if(!Array.isArray(body.children)||body.children.length<1||body.children.length>6)return NextResponse.json({error:"Add at least one child (maximum six)."},{status:400});
 const children=[];for(const raw of body.children){
  if(!raw||typeof raw!=="object")return NextResponse.json({error:"Invalid child information"},{status:400});
  const familyMemberId=String(raw.familyMemberId||"");
  const known=familyMemberId?family.find(x=>x.id===familyMemberId):null;
  if(familyMemberId&&!known)return NextResponse.json({error:"Please sign in as the child's guardian."},{status:403});
  const name=known?.name||String(raw.name||"").trim().slice(0,100);
  const age=String(raw.age||"").trim().slice(0,20);
  const allergies=String(raw.allergies||"").trim().slice(0,300);
  const careNotes=String(raw.careNotes||"").trim().slice(0,300);
  if(name.length<2||!known&&!age)return NextResponse.json({error:"Each new child needs a name and age."},{status:400});
  children.push({name,age,allergies,careNotes,familyMemberId:known?.id||null});
 }
 const arrival=await prisma.kidsArrivalRequest.create({data:{guardianName,phone,email:email||null,parentUserId:user?.id||null,children}});
 return NextResponse.json({reference:arrival.id.slice(-8).toUpperCase(),message:"Request received. Please visit the Kids Ministry desk for teacher verification and secure check-in."},{status:201});
}
export async function PATCH(request:Request){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);if(!user||!(await canManageKidsMinistry(user)))return NextResponse.json({error:"Leader access required"},{status:403});
 const b=await request.json().catch(()=>null);if(!["reviewed","cancelled"].includes(b?.status)||typeof b?.id!=="string")return NextResponse.json({error:"Invalid request"},{status:400});
 const result=await prisma.kidsArrivalRequest.updateMany({where:{id:b.id,status:"pending"},data:{status:b.status,reviewedAt:new Date(),reviewedById:user.id}});
 return NextResponse.json({updated:result.count});
}
