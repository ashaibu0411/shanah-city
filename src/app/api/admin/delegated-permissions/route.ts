import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isDelegatedPermission, listDelegatedPermissions, setDelegatedPermission } from "@/lib/delegated-permissions-server";
import { useDatabase } from "@/lib/use-database";

async function authorize() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  return user && await canManageAsAdmin(user) ? user : null;
}
export async function GET(request:Request) {
  const admin = await authorize();
  if (!admin) return NextResponse.json({error:"Forbidden"},{status:403});
  const userId = new URL(request.url).searchParams.get("userId")?.trim();
  if (!userId) return NextResponse.json({error:"userId required"},{status:400});
  return NextResponse.json({permissions:await listDelegatedPermissions(userId)});
}
export async function POST(request:Request) {
  const admin = await authorize();
  if (!admin) return NextResponse.json({error:"Forbidden"},{status:403});
  if (!useDatabase()) return NextResponse.json({error:"Database unavailable"},{status:503});
  const body = await request.json().catch(()=>({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const permission = typeof body.permission === "string" ? body.permission : "";
  if (!userId || !isDelegatedPermission(permission) || typeof body.enabled !== "boolean") {
    return NextResponse.json({error:"Valid userId, permission and enabled are required"},{status:400});
  }
  if (userId === admin.id) return NextResponse.json({error:"Cannot modify your own delegated permissions"},{status:400});
  await setDelegatedPermission(userId,permission,admin.id,body.enabled);
  return NextResponse.json({ok:true,permissions:await listDelegatedPermissions(userId)});
}
