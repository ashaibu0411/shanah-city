import { sendPushToUsers } from "@/lib/push-server";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";

/**
 * Notifications contain only a generic invitation, never private vision content.
 * Authorization is enforced again when a recipient opens the linked plan.
 */
export async function notifyVisionLeader(userId: string, planId: string, kind: "assigned" | "revision" | "comment" | "decision", commentId?: string) {
  const messages = {
    assigned: "You have a private 2027 ministry vision to review.",
    revision: "A revision was requested on your 2027 ministry vision.",
    comment: "There is a new discussion message on your ministry vision.",
    decision: "A pastoral decision was recorded on your ministry vision.",
  };
  try {
    await sendPushToUsers([userId], {
      title: "2027 Vision Center",
      body: messages[kind],
      url: "/leadership/vision/" + encodeURIComponent(planId) + (commentId ? "?comment=" + encodeURIComponent(commentId) : ""),
    }, "announcements");
  } catch (error) {
    console.warn("[vision] push notification unavailable", error instanceof Error ? error.message : "unknown");
  }
}

export async function notifyVisionPastor(planId: string, kind: "submitted" | "comment", commentId?: string) {
  const roles = await getPastoralRoleAssignments();
  if (!roles.seniorPastorUserId) return;
  try {
    await sendPushToUsers([roles.seniorPastorUserId], {
      title: "2027 Vision Center",
      body: kind === "submitted" ? "A leader submitted a ministry vision response." : "A leader posted a private vision comment.",
      url: "/leadership/vision/" + encodeURIComponent(planId) + (commentId ? "?comment=" + encodeURIComponent(commentId) : ""),
    }, "announcements");
  } catch (error) {
    console.warn("[vision] pastoral notification unavailable", error instanceof Error ? error.message : "unknown");
  }
}
