export type MarriageFinalCertificateStatus = "active" | "revoked" | "superseded";

export type MarriagePremaritalFinalCertificateRecord = {
  id: string;
  journeyId: string;
  certificateNumber: string;
  status: MarriageFinalCertificateStatus;
  completionDate: string | null;
  issuedAt: string;
  issuedByUserId: string;
  partnerADisplayName: string;
  partnerBDisplayName: string;
  seniorPastorName: string;
  seniorPastorTitle: string;
  revokedAt: string | null;
  revokeReason: string | null;
  supersededById: string | null;
  /** Snapshot of configured signature ref at issuance (not live settings). */
  signatureAssetPathAtIssue: string | null;
  /** Template/renderer version frozen at issuance. */
  renderVersion: string | null;
  /** Immutable issued PDF in private storage. */
  issuedPdfAssetPath: string | null;
  createdAt: string;
};

export type MarriagePremaritalFinalCertificateAuditRecord = {
  id: string;
  certificateId: string;
  journeyId: string;
  action: "issue" | "revoke" | "replace" | "download" | "preview";
  actorUserId: string;
  note: string | null;
  metaJson: string | null;
  createdAt: string;
};

export type MarriagePrepCertificateSettingRecord = {
  id: "default";
  seniorPastorSignatureAssetPath: string | null;
  updatedAt: string;
  updatedByUserId: string | null;
};

export type MarriagePremaritalSupplementaryClinicalRecord = {
  appointmentId: string;
  journeyId: string;
  sessionDate: string | null;
  partnerAAttended: boolean | null;
  partnerBAttended: boolean | null;
  outcome: string | null;
  topicsCovered: string | null;
  followUpActions: string | null;
  privateObservations: string | null;
  updatedAt: string;
  updatedByUserId: string;
};

export type MarriagePrepCertificateSettingAuditRecord = {
  id: string;
  action: "upload" | "remove" | "replace";
  actorUserId: string;
  note: string | null;
  previousPath: string | null;
  newPath: string | null;
  createdAt: string;
};

export type MarriageCoupleSessionCertificateView = {
  sessionKey: string;
  order: number;
  title: string;
  unlocked: boolean;
  completionDate: string | null;
  completionDateMissing: boolean;
  certificateReference: string;
};

export type MarriageCoupleCertificatesGalleryView = {
  sessionMilestones: MarriageCoupleSessionCertificateView[];
  finalCertificate: {
    status: "not_eligible" | "eligible_pending_issue" | "issued" | "revoked";
    certificateNumber: string | null;
    issuedAt: string | null;
    canDownload: boolean;
    eligibilitySummary: string[];
  };
};

export type MarriageFinalCertificateEligibilityView = {
  eligible: boolean;
  blockers: string[];
  partnerADisplayName: string;
  partnerBDisplayName: string;
  suggestedCompletionDate: string | null;
  completionDateMissing: boolean;
  activeCertificate: MarriagePremaritalFinalCertificateRecord | null;
  history: MarriagePremaritalFinalCertificateRecord[];
  audit: MarriagePremaritalFinalCertificateAuditRecord[];
};

export type MarriagePastoralTimelineEvent = {
  id: string;
  at: string;
  category:
    | "appointment"
    | "attendance"
    | "session_completion"
    | "homework"
    | "follow_up"
    | "program_pause"
    | "program_resume"
    | "readiness"
    | "certificate";
  title: string;
  summary: string;
  visibility: "clinical" | "pastoral" | "couple_safe";
};

export type MarriagePastoralReportKind =
  | "progress"
  | "attendance"
  | "homework"
  | "supplementary"
  | "outstanding"
  | "completion";
