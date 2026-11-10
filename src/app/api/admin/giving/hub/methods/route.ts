import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  listAdminGivingHubMethods,
  updateGivingHubPaymentMethod,
} from "@/lib/giving-hub-server";

export const runtime = "nodejs";

async function requireFinance() {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (!(await canManageGivingRecords(user))) {
    return { error: NextResponse.json({ error: "Finance access required." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireFinance();
  if (auth.error) return auth.error;
  const methods = await listAdminGivingHubMethods();
  return NextResponse.json({ methods });
}

export async function PATCH(request: Request) {
  const auth = await requireFinance();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "id required." }, { status: 400 });
  }

  try {
    const updated = await updateGivingHubPaymentMethod({
      id,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
      published: typeof body.published === "boolean" ? body.published : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: "Method not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 422 },
    );
  }
}
