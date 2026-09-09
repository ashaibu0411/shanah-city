export type GroupResourceRecord = {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  url?: string;
  category: string;
  sortOrder: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupResourceInput = {
  groupId: string;
  title: string;
  description?: string;
  url?: string;
  category?: string;
  sortOrder?: number;
  createdBy: string;
  createdByName: string;
};
