import type {
  CommsChannelId,
  CommsRequestStatus,
  CommsRequestTemplate,
} from "@/lib/comms-types";

export const COMMS_CHANNELS: {
  id: CommsChannelId;
  label: string;
  color: string;
}[] = [
  { id: "service_announcement", label: "Service announcement", color: "#2563eb" },
  { id: "instagram", label: "Instagram", color: "#db2777" },
  { id: "facebook", label: "Facebook", color: "#1877f2" },
  { id: "email", label: "Email", color: "#059669" },
  { id: "newsletter", label: "Newsletter", color: "#d97706" },
  { id: "app_banner", label: "App home banner", color: "#dc2626" },
  { id: "push", label: "Push notification", color: "#7c3aed" },
];

export const COMMS_REQUEST_STATUSES: { id: CommsRequestStatus; label: string }[] = [
  { id: "submitted", label: "Submitted" },
  { id: "pending_approval", label: "Pending approval" },
  { id: "approved", label: "Approved" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
  { id: "on_hold", label: "On hold" },
];

export const COMMS_REQUEST_TEMPLATES: {
  id: CommsRequestTemplate;
  label: string;
  department: string;
  deliverables: string[];
}[] = [
  {
    id: "media",
    label: "Media team",
    department: "Media",
    deliverables: ["Social graphic", "Video clip", "Photo gallery upload", "Live stream slide"],
  },
  {
    id: "worship",
    label: "Worship team",
    department: "Worship",
    deliverables: ["Service announcement copy", "Slideshow slide", "Run sheet note"],
  },
  {
    id: "communications",
    label: "Communications",
    department: "Communications",
    deliverables: ["Email", "Newsletter", "App banner", "Push notification", "Social post"],
  },
  {
    id: "general",
    label: "General request",
    department: "Ministry",
    deliverables: ["Copy", "Graphic", "Other"],
  },
];

export function commsChannelMeta(channel: CommsChannelId) {
  return COMMS_CHANNELS.find((entry) => entry.id === channel) ?? COMMS_CHANNELS[0];
}

export function commsTemplateMeta(template: CommsRequestTemplate) {
  return COMMS_REQUEST_TEMPLATES.find((entry) => entry.id === template) ?? COMMS_REQUEST_TEMPLATES[3];
}
