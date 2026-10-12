export type ChoirResourceTabId = "resources" | "guides" | "onboarding" | "forms" | "links";

export type ChoirResourceKind =
  | "pdf"
  | "docx"
  | "xlsx"
  | "image"
  | "video_link"
  | "article_link"
  | "internal_route"
  | "external_url";

export type ChoirResourceStatus = "draft" | "published";

export type ChoirResourceRequestStatus = "submitted" | "under_review" | "fulfilled" | "closed";

export type ChoirMinistryResource = {
  id: string;
  groupId: string;
  tab: ChoirResourceTabId;
  category: string;
  title: string;
  description: string;
  kind: ChoirResourceKind;
  url?: string;
  coverImagePath?: string;
  fileSizeLabel?: string;
  featured: boolean;
  featuredBadge?: string;
  status: ChoirResourceStatus;
  sortOrder: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type ChoirResourceRequest = {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  category: string;
  title: string;
  description: string;
  relatedActivity?: string;
  referenceUrl?: string;
  status: ChoirResourceRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ChoirResourceStore = {
  resources: ChoirMinistryResource[];
  requests: ChoirResourceRequest[];
};

export type ChoirResourceCardView = {
  id: string;
  title: string;
  description: string;
  kind: ChoirResourceKind;
  kindLabel: string;
  url: string | null;
  coverImagePath: string;
  fileSizeLabel?: string;
  featuredBadge?: string;
  category: string;
  tab: ChoirResourceTabId;
  href: string;
};

export type ChoirResourceHomePayload = {
  groupId: string;
  groupChatHref: string;
  featured: ChoirResourceCardView[];
  library: ChoirResourceCardView[];
  helpfulLinks: ChoirResourceCardView[];
  canManage: boolean;
  manageHref: string;
};
