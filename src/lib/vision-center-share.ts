/**
 * Canonical deep links and invitation copy for private Vision Center proposals.
 * Sharing never grants access; recipients must already be invited after sign-in.
 */

export function visionPlanCanonicalPath(planId: string) {
  const id = planId.trim();
  return `/leadership/vision/${encodeURIComponent(id)}`;
}

export function visionPlanShareUrl(origin: string, planId: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}${visionPlanCanonicalPath(planId)}`;
}

export function visionShareDocumentTitle(planTitle: string) {
  const title = planTitle.trim() || "2027 ministry vision proposal";
  return `Shanah City — ${title}`;
}

/** Invitation prose only (no URL). Use with Web Share \`text\` + separate \`url\` to avoid duplicate links on iOS/Android. */
export function buildVisionShareInvitationBody(planTitle: string) {
  const title = planTitle.trim() || "a 2027 ministry vision proposal";
  return [
    `You are invited to review ${title} in Shanah City Vision Center.`,
    "",
    "This document is a private leadership proposal for review, corrections, additions, feasibility assessment, and recommendations.",
    "",
    "Before sending this link: assign the pastor or ministry leader in Vision Center (or invite the pastoral review team). The link does not grant access by itself.",
    "",
    "After assignment, they sign in with their Shanah City account and open the link below.",
  ].join("\n");
}

/** Full paste-ready message for Copy invitation (body + canonical URL on one line). */
export function buildVisionShareInvitation(planTitle: string, url: string) {
  return `${buildVisionShareInvitationBody(planTitle)}\n\n${url.trim()}`;
}