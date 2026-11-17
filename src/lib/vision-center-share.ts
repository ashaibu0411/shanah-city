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

export function buildVisionShareInvitation(planTitle: string, url: string) {
  const title = planTitle.trim() || "a 2027 ministry vision proposal";
  return [
    `You are invited to review ${title} in Shanah City Vision Center.`,
    "",
    "This document is a private leadership proposal for review, corrections, additions, feasibility assessment, and recommendations.",
    "",
    "Sign in with your Shanah City account. If the page asks for access, the Senior Pastor must invite you first—the link does not open the proposal by itself.",
    "",
    url,
  ].join("\n");
}