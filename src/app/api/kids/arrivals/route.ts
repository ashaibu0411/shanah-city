import type {Prisma} from "@prisma/client";import {createHash,randomBytes} from "node:crypto";import {cookies} from "next/headers";import {NextResponse} from "next/server";import {prisma} from "@/lib/db";import {getUserFromSession,SESSION_COOKIE} from "@/lib/auth-server";import {canAccessKidsMinistry,canManageKidsMinistry} from "@/lib/kids-access-server";import {enforceRateLimit,getClientIp,rateLimitResponse} from "@/lib/rate-limit-server";
const digest=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function GET(request:Request){
 const token=new URL(request.url).searchParams.get("token")||"";
 if(/^[a-f0-9]{64}$/.test(token)){
  const row=await prisma.kidsArrivalRequest.findUnique({where:{accessTokenHash:digest(token)}});
  if(!row||row.status!=="pending")return NextResponse.json({error:"No active arrival found"},{status:404});
  return NextResponse.json({reference:row.id.slice(-8).toUpperCase(),childCount:Array.isArray(row.children)?row.children.length:0,createdAt:row.createdAt});
 }

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
 const accessToken=randomBytes(32).toString("hex");
 const arrival=await prisma.kidsArrivalRequest.create({data:{guardianName,phone,email:email||null,parentUserId:user?.id||null,children,accessTokenHash:digest(accessToken)}});
 return NextResponse.json({reference:arrival.id.slice(-8).toUpperCase(),accessToken,message:"Request received. Please visit the Kids Ministry desk for teacher verification and secure check-in."},{status:201});
}
export async function PATCH(request:Request){
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);if(!user||!(await canManageKidsMinistry(user)))return NextResponse.json({error:"Leader access required"},{status:403});
 const b=await request.json().catch(()=>null);if(!["reviewed","cancelled"].includes(b?.status)||typeof b?.id!=="string")return NextResponse.json({error:"Invalid request"},{status:400});
 const result=await prisma.kidsArrivalRequest.updateMany({where:{id:b.id,status:"pending"},data:{status:b.status,reviewedAt:new Date(),reviewedById:user.id}});
 return NextResponse.json({updated:result.count});
}

export async function PUT(request:Request){
 const limit=await enforceRateLimit("kids:arrival:add:"+getClientIp(request),{limit:10,windowSeconds:3600});if(!limit.allowed)return rateLimitResponse(limit.retryAfterSeconds);
 const b=await request.json().catch(()=>null);const token=String(b?.token||"");
 if(!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Invalid arrival session"},{status:400});
 const row=await prisma.kidsArrivalRequest.findUnique({where:{accessTokenHash:digest(token)}});
 if(!row||row.status!=="pending")return NextResponse.json({error:"Arrival is no longer open"},{status:404});
 if(Date.now()-row.createdAt.getTime()>12*3600000)return NextResponse.json({error:"Arrival has expired; please ask a teacher for help."},{status:409});
 if(!Array.isArray(b.children)||b.children.length<1||b.children.length>6)return NextResponse.json({error:"Add between one and six children"},{status:400});
 const user=await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
 const family=user?.family?.filter(x=>x.relationship==="child")??[];
 const current=Array.isArray(row.children)?row.children as Record<string,unknown>[]:[];
 if(current.length+b.children.length>6)return NextResponse.json({error:"Maximum six children per arrival"},{status:400});
 const added=[] as Record<string,unknown>[];
 for(const raw of b.children){
  if(!raw||typeof raw!=="object")return NextResponse.json({error:"Invalid child details"},{status:400});
  const familyMemberId=String(raw.familyMemberId||"");
  const known=familyMemberId&&user?.id===row.parentUserId?family.find(x=>x.id===familyMemberId):null;
  if(familyMemberId&&!known)return NextResponse.json({error:"Sign in as the registered guardian"},{status:403});
  const name=known?.name||String(raw.name||"").trim().slice(0,100),age=String(raw.age||"").trim().slice(0,20);
  if(name.length<2||!known&&!age)return NextResponse.json({error:"Enter each child's name and age"},{status:400});
  if(current.concat(added).some(x=>String(x.name).toLowerCase()===name.toLowerCase()))return NextResponse.json({error:"Child already added to this arrival"},{status:409});
  added.push({name,age,allergies:String(raw.allergies||"").trim().slice(0,300),careNotes:String(raw.careNotes||"").trim().slice(0,300),familyMemberId:known?.id||null});
 }
 const updated=await prisma.kidsArrivalRequest.updateMany({where:{id:row.id,status:"pending"},data:{children:[...current,...added] as Prisma.InputJsonValue}});
 if(!updated.count)return NextResponse.json({error:"Arrival changed; please retry"},{status:409});
 return NextResponse.json({reference:row.id.slice(-8).toUpperCase(),childCount:current.length+added.length});
}
