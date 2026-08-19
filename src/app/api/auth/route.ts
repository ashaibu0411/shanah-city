import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSession,
  createUser,
  getActivity,
  getUserFromSession,
  SESSION_COOKIE,
  SESSION_DAYS,
  toPublicMember,
  verifyCredentials,
} from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { processSignupGroupSelections } from "@/lib/group-join-server";
import { getSessionPermissions } from "@/lib/session-permissions";

async function checkAuthRateLimit(request: Request, action: string) {
  const ip = getClientIp(request);
  const result = await enforceRateLimit(`auth:${action}:${ip}`, {
    limit: action === "forgot" ? 5 : 15,
    windowSeconds: action === "forgot" ? 60 * 60 : 15 * 60,
  });
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds);
  }
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({
      user: null,
      permissions: {
        canUploadGallery: false,
        canWriteDevotions: false,
        canManageAdmin: false,
        canAccessFinance: false,
        canAccessWorshipPlanner: false,
        canManageWorshipPlan: false,
        canAccessFrontLiners: false,
        canManageFrontLiners: false,
        canAccessKidsMinistry: false,
        canManageKidsMinistry: false,
      },
    });
  }
  const [activity, permissions] = await Promise.all([
    getActivity(user.id),
    getSessionPermissions(user),
  ]);
  return NextResponse.json({ user, activity, permissions });
}
export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action ?? "signin";
  const rateLimited = await checkAuthRateLimit(
    request,
    action === "signup" ? "signup" : "signin",
  );
  if (rateLimited) return rateLimited;

  if (action === "signup") {
    try {
      const user = await createUser({
        name: body.name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        campusId: body.campusId ?? "colorado",
      });
      const groupIds = Array.isArray(body.groupIds)
        ? body.groupIds.map(String)
        : [];
      const ministryResults = await processSignupGroupSelections(
        { id: user.id, name: user.name, email: user.email },
        groupIds,
      );
      const session = await createSession(user.id);
      const publicUser = toPublicMember(user);
      const permissions = await getSessionPermissions(publicUser);
      const response = NextResponse.json(
        { user: publicUser, permissions, ministryResults },
        { status: 201 },
      );      response.cookies.set(SESSION_COOKIE, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_DAYS * 24 * 60 * 60,
        path: "/",
      });
      return response;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Sign up failed." },
        { status: 400 },
      );
    }
  }

  const user = await verifyCredentials(body.email, body.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = await createSession(user.id);
  const publicUser = toPublicMember(user);
  const permissions = await getSessionPermissions(publicUser);
  const response = NextResponse.json({ user: publicUser, permissions });  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  if (token) {
    const { deleteSession } = await import("@/lib/auth-server");
    await deleteSession(token);
  }
  return response;
}
