import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, getUsers, SESSION_COOKIE } from "@/lib/auth-server";
import { canAccessKidsMinistry } from "@/lib/kids-access-server";

export async function GET() {
  const user = await getUserFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({error:"Sign in required"},{status:401});
  if (!(await canAccessKidsMinistry(user))) return NextResponse.json({error:"Kids ministry access required"},{status:403});
  const users = await getUsers();
  const children = users.flatMap(parent=>(parent.family??[])
    .filter(member=>member.relationship==="child" && member.name.trim())
    .map(member=>({
      id:member.id,
      name:member.name,
      birthYear:member.birthYear,
      parentUserId:parent.id,
      parentName:parent.name,
      parentPhone:parent.phone??null,
      hasAllergyAlert:Boolean(member.allergies?.trim()),
      hasMedicalAlert:Boolean(member.medicalNotes?.trim()),
    })));
  return NextResponse.json({children:children.sort((a,b)=>a.name.localeCompare(b.name))},{headers:{"Cache-Control":"private, no-store"}});
}
