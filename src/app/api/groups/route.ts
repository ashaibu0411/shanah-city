import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import type { GroupCategory, GroupVisibility } from "@/lib/group-types";
import {
  createGroup,
  deleteGroup,
  demoteGroupAdmin,
  demoteGroupAssistant,
  getGroupDetail,
  joinGroup,
  listGroupsForUser,
  addGroupMember,
  promoteGroupAdmin,
  promoteGroupAssistant,
  removeGroupMember,
  updateGroup,
} from "@/lib/group-server";
import { requestGroupJoin } from "@/lib/group-join-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("id");
  const mine = searchParams.get("mine") === "1";

  if (groupId) {
    const group = await getGroupDetail(groupId, user?.id);
    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }
    return NextResponse.json({ group });
  }

  const groups = await listGroupsForUser(user?.id, { mine });
  return NextResponse.json({ groups, user });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage groups." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "create");
  const groupId = body.groupId ? String(body.groupId) : undefined;
  const actorIsSiteAdmin = await canManageAsAdmin(user);
  const managementOptions = { actorIsSiteAdmin };

  try {
    if (action === "create") {
      const group = await createGroup({
        name: String(body.name ?? ""),
        description: String(body.description ?? ""),
        category: (body.category ?? "ministry") as GroupCategory,
        campusId: body.campusId ? String(body.campusId) : undefined,
        visibility: (body.visibility ?? "public") as GroupVisibility,
        meetingSchedule: body.meetingSchedule ? String(body.meetingSchedule) : undefined,
        meetingLink: body.meetingLink ? String(body.meetingLink) : undefined,
        creatorId: user.id,
        creatorName: user.name,
      });

      await recordActivity(user.id, "profile_update", `Created group "${group.name}"`);
      return NextResponse.json({ group }, { status: 201 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Group id is required." }, { status: 400 });
    }

    if (action === "join") {
      const result = await requestGroupJoin(groupId, {
        id: user.id,
        name: user.name,
        email: user.email,
      });
      if (result.status === "pending") {
        return NextResponse.json({
          group: await getGroupDetail(groupId, user.id),
          joinStatus: result.status,
          message: `Your request to join "${result.groupName}" is pending approval.`,
        });
      }
      const group = await getGroupDetail(groupId, user.id);
      if (result.status === "joined") {
        await recordActivity(user.id, "profile_update", `Joined group "${result.groupName}"`);
      }
      return NextResponse.json({ group, joinStatus: result.status });
    }

    if (action === "request-join") {
      const result = await requestGroupJoin(groupId, {
        id: user.id,
        name: user.name,
        email: user.email,
      });
      return NextResponse.json({ joinStatus: result.status, groupName: result.groupName });
    }

    if (action === "leave") {
      return NextResponse.json(
        {
          error:
            "Members cannot leave a group on their own. Ask your group leader to remove you.",
        },
        { status: 403 },
      );
    }

    if (action === "update") {
      const group = await updateGroup(groupId, user.id, {
        name: body.name !== undefined ? String(body.name) : undefined,
        description: body.description !== undefined ? String(body.description) : undefined,
        category: body.category as GroupCategory | undefined,
        campusId: body.campusId !== undefined ? String(body.campusId) : undefined,
        visibility: body.visibility as GroupVisibility | undefined,
        meetingSchedule:
          body.meetingSchedule !== undefined ? String(body.meetingSchedule) : undefined,
        meetingLink: body.meetingLink !== undefined ? String(body.meetingLink) : undefined,
      });
      await recordActivity(user.id, "profile_update", `Updated group "${group.name}"`);
      return NextResponse.json({ group });
    }

    if (action === "remove-member") {
      const memberId = String(body.memberId ?? "");
      if (!memberId) {
        return NextResponse.json({ error: "Member id is required." }, { status: 400 });
      }
      const result = await removeGroupMember(groupId, user.id, memberId, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Removed ${result.removedName} from "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "add-member") {
      const email = String(body.email ?? "");
      const result = await addGroupMember(groupId, user.id, email, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Added ${result.addedName} to "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "promote-admin") {
      const memberId = String(body.memberId ?? "");
      if (!memberId) {
        return NextResponse.json({ error: "Member id is required." }, { status: 400 });
      }
      const result = await promoteGroupAdmin(groupId, user.id, memberId, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Made ${result.promotedName} a leader of "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "demote-admin") {
      const memberId = String(body.memberId ?? "");
      if (!memberId) {
        return NextResponse.json({ error: "Member id is required." }, { status: 400 });
      }
      const result = await demoteGroupAdmin(groupId, user.id, memberId, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Removed ${result.demotedName} as leader of "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "promote-assistant") {
      const memberId = String(body.memberId ?? "");
      if (!memberId) {
        return NextResponse.json({ error: "Member id is required." }, { status: 400 });
      }
      const result = await promoteGroupAssistant(groupId, user.id, memberId, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Made ${result.promotedName} an assistant leader of "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "demote-assistant") {
      const memberId = String(body.memberId ?? "");
      if (!memberId) {
        return NextResponse.json({ error: "Member id is required." }, { status: 400 });
      }
      const result = await demoteGroupAssistant(groupId, user.id, memberId, managementOptions);
      await recordActivity(
        user.id,
        "profile_update",
        `Removed ${result.demotedName} as assistant leader of "${result.group.name}"`,
      );
      const group = await getGroupDetail(groupId, user.id);
      return NextResponse.json({ group });
    }

    if (action === "delete") {
      const detail = await getGroupDetail(groupId, user.id);
      await deleteGroup(groupId, user.id);
      const { deleteGroupChatMessagesForGroup } = await import("@/lib/group-chat-server");
      await deleteGroupChatMessagesForGroup(groupId);
      if (detail) {
        await recordActivity(user.id, "profile_update", `Deleted group "${detail.name}"`);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Group action failed." },
      { status: 400 },
    );
  }
}
