-- Foreign keys for Temperament & Shepherding Hub (additive)

ALTER TABLE "TemperamentAssessmentResponse"
  ADD CONSTRAINT "TemperamentAssessmentResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemperamentAssessmentSnapshot"
  ADD CONSTRAINT "TemperamentAssessmentSnapshot_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "TemperamentAssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemperamentAssessmentInvitation"
  ADD CONSTRAINT "TemperamentAssessmentInvitation_inviterUserId_fkey"
  FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemperamentAssessmentInvitation"
  ADD CONSTRAINT "TemperamentAssessmentInvitation_inviteeUserId_fkey"
  FOREIGN KEY ("inviteeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemperamentShepherdingAudit"
  ADD CONSTRAINT "TemperamentShepherdingAudit_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemperamentShepherdingAudit"
  ADD CONSTRAINT "TemperamentShepherdingAudit_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
