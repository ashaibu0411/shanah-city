export const MEMBER_PARTICIPATION_TYPES = ["member", "visitor", "guest"] as const;

export type MemberParticipationType = (typeof MEMBER_PARTICIPATION_TYPES)[number];

export function isMemberParticipationType(value: string): value is MemberParticipationType {
  return (MEMBER_PARTICIPATION_TYPES as readonly string[]).includes(value);
}

export function parseMemberParticipationType(value: unknown): MemberParticipationType {
  const raw = String(value ?? "").trim().toLowerCase();
  return isMemberParticipationType(raw) ? raw : "member";
}

export function participationTypeLabel(type: MemberParticipationType) {
  switch (type) {
    case "member":
      return "Church member";
    case "visitor":
      return "Visitor";
    case "guest":
      return "Guest";
  }
}

export function participationTypeDescription(
  type: MemberParticipationType,
  inAnyGroup: boolean,
) {
  switch (type) {
    case "member":
      return inAnyGroup
        ? "You're connected as a Shanah City member and belong to one or more groups."
        : "You're connected church-wide without a ministry group — global member access to the app.";
    case "visitor":
      return "You're visiting or exploring Shanah City before joining a group.";
    case "guest":
      return "You're using the app as a guest without ministry group membership.";
  }
}

export const participationTypeOptions: {
  id: MemberParticipationType;
  label: string;
  hint: string;
}[] = [
  {
    id: "member",
    label: "Church member",
    hint: "Part of Shanah City — groups optional (global member if none selected).",
  },
  {
    id: "visitor",
    label: "Visitor",
    hint: "Checking us out; not in a ministry group yet.",
  },
  {
    id: "guest",
    label: "Guest",
    hint: "Trying the app or visiting occasionally without group membership.",
  },
];
