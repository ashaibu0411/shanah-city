import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canAccessWorshipPlanner,
  canManageWorshipPlan,
  getConfiguredWorshipGroupId,
} from "@/lib/worship-access-server";
import {
  WORSHIP_SERVICE_TIMES,
  type WorshipServiceTime,
  type WorshipSong,
  type WorshipTeamMember,
} from "@/lib/worship-types";
import {
  deleteWorshipPlan,
  getWorshipPlan,
  listWorshipPlans,
  saveWorshipPlan,
  updateWorshipMemberStatus,
} from "@/lib/worship-server";
import { getGroupDetail } from "@/lib/group-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

async function requireWorshipAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canAccessWorshipPlanner(user))) {
    return {
      error: NextResponse.json(
        {
          error:
            "Join Shanah Worship (Choir) under Groups to access the worship planner.",
        },
        { status: 403 },
      ),
    };
  }

  return { user };
}

function parseSongs(body: Record<string, unknown>): WorshipSong[] {
  if (!Array.isArray(body.songs)) return [];
  return body.songs as WorshipSong[];
}

function parseTeam(body: Record<string, unknown>): WorshipTeamMember[] {
  if (!Array.isArray(body.team)) return [];
  return body.team as WorshipTeamMember[];
}

function canViewPlan(userId: string, canManage: boolean, plan: { status: string; team: WorshipTeamMember[] }) {
  if (canManage) return true;
  if (plan.status !== "published") return false;
  return plan.team.some((member) => member.userId === userId);
}

export async function GET(request: Request) {
  const auth = await requireWorshipAccess();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const serviceDate = searchParams.get("serviceDate") ?? undefined;
  const serviceTime = searchParams.get("serviceTime") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;
  const roster = searchParams.get("roster") === "1";
  const canManage = await canManageWorshipPlan(auth.user!);

  if (roster) {
    if (!canManage) {
      return NextResponse.json({ error: "Worship leader access required." }, { status: 403 });
    }

    const group = await getGroupDetail(getConfiguredWorshipGroupId(), auth.user!.id);
    return NextResponse.json({
      members: group?.members ?? [],
      roles: [
        { value: "worship-leader", label: "Worship leader" },
        { value: "singer", label: "Singer" },
        { value: "musician", label: "Musician" },
        { value: "tech", label: "Tech / media" },
        { value: "other", label: "Other" },
      ],
      serviceTimes: WORSHIP_SERVICE_TIMES,
    });
  }

  if (serviceDate && serviceTime) {
    const plan = await getWorshipPlan(serviceDate, serviceTime);
    if (!plan) {
      return NextResponse.json({ plan: null, canManage });
    }

    if (!canViewPlan(auth.user!.id, canManage, plan)) {
      return NextResponse.json({ plan: null, canManage, hidden: true });
    }

    return NextResponse.json({ plan, canManage });
  }

  const plans = await listWorshipPlans({ since, until });
  const visiblePlans = plans.filter((plan) => canViewPlan(auth.user!.id, canManage, plan));

  return NextResponse.json({ plans: visiblePlans, canManage });
}

export async function POST(request: Request) {
  const auth = await requireWorshipAccess();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");
  const serviceDate = String(body.serviceDate ?? "").trim();
  const serviceTime = String(body.serviceTime ?? "").trim() as WorshipServiceTime;

  if (!serviceDate || !serviceTime) {
    return NextResponse.json({ error: "Service date and time are required." }, { status: 400 });
  }

  const canManage = await canManageWorshipPlan(auth.user!);

  try {
    if (action === "mark_ready" || action === "toggle_song") {
      const plan = await updateWorshipMemberStatus({
        serviceDate,
        serviceTime,
        userId: auth.user!.id,
        ready: action === "mark_ready" ? Boolean(body.ready) : undefined,
        songId: action === "toggle_song" ? String(body.songId ?? "") : undefined,
        prepared: action === "toggle_song" ? Boolean(body.prepared) : undefined,
      });

      if (!plan) {
        return NextResponse.json(
          { error: "You are not on the team for this service plan." },
          { status: 404 },
        );
      }

      if (!canViewPlan(auth.user!.id, canManage, plan)) {
        return NextResponse.json({ error: "Plan not available." }, { status: 403 });
      }

      return NextResponse.json({ plan });
    }

    if (!canManage) {
      return NextResponse.json({ error: "Worship leader access required." }, { status: 403 });
    }

    if (action === "delete") {
      const removed = await deleteWorshipPlan(serviceDate, serviceTime);
      if (!removed) {
        return NextResponse.json({ error: "Service plan not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    let planStatus: "draft" | "published" = "draft";
    if (action === "publish") {
      planStatus = "published";
    } else if (action === "unpublish") {
      planStatus = "draft";
    } else if (body.status === "published") {
      planStatus = "published";
    }

    const plan = await saveWorshipPlan({
      serviceDate,
      serviceTime,
      title: body.title ? String(body.title).trim() : undefined,
      songs: parseSongs(body),
      team: parseTeam(body),
      rehearsalNotes: body.rehearsalNotes ? String(body.rehearsalNotes).trim() : undefined,
      status: planStatus,
      actor: { id: auth.user!.id, name: auth.user!.name },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update worship plan." },
      { status: 400 },
    );
  }
}
