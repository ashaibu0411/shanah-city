export type CoupleEnrichmentModuleRecord = {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type CoupleEnrichmentModuleView = CoupleEnrichmentModuleRecord & {
  completed: boolean;
  completedAt?: string;
};
