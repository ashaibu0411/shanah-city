export type CoupleMarriageDevotionalRecord = {
  id: string;
  publishDate: string;
  title: string;
  scripture: string;
  teaching: string;
  discussion: string;
  assignment: string;
  prayer: string;
  declaration: string;
  published: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type CoupleDevotionalReadRecord = {
  coupleLinkId: string;
  devotionalId: string;
  readByUserId: string;
  readAt: string;
};

export type CoupleMarriageDevotionalView = CoupleMarriageDevotionalRecord & {
  readByMe: boolean;
  readBySpouse: boolean;
};
