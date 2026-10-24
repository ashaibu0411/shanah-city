"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MarriageCounselorSessionDateTimeField } from "@/components/marriage/MarriageCounselorSessionDateTimeField";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import type { MarriageCounselorPremaritalOperationsView } from "@/lib/marriage-counseling-types";
import { PREMARITAL_PROGRAM_SESSIONS } from "@/lib/marriage-premarital-eight-session-program";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  onError: (message: string) => void;
};

export function MarriageCounselorPremaritalOperationsPanel({ journeyId, onError }: Props) {
  const [ops, setOps] = useState<MarriageCounselorPremaritalOperationsView | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionKey, setSessionKey] = useState(PREMARITAL_PROGRAM_SESSIONS[0]?.sessionKey ?? "");
  const [clinicalKey, setClinicalKey] = useState(PREMARITAL_PROGRAM_SESSIONS[0]?.sessionKey ?? "");
  const [manageId, setManageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/marriage/counselor/premarital-operations?journeyId=${encodeURIComponent(journeyId)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<{ operations?: MarriageCounselorPremaritalOperationsView; error?: string }>(
      res,
    );
    if (!res.ok) {
      onError(data.error ?? "Could not load operations.");
      return;
    }
    setOps(data.operations ?? null);
  }, [journeyId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/marriage/counselor/premarital-operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      onError(data.error ?? "Save failed.");
      return false;
    }
    await load();
    return true;
  }

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      (ops?.appointments ?? []).filter(
        (a) => a.status !== "cancelled" && new Date(a.scheduledAt).getTime() >= now,
      ),
    [ops?.appointments, now],
  );
  const past = useMemo(
    () =>
      (ops?.appointments ?? []).filter(
        (a) => a.status === "cancelled" || new Date(a.scheduledAt).getTime() < now,
      ),
    [ops?.appointments, now],
  );

  const clinicalByKey = useMemo(() => {
    const map = new Map((ops?.clinicalRecords ?? []).map((r) => [r.sessionKey, r]));
    return map;
  }, [ops?.clinicalRecords]);

  if (!ops) return null;

  const readinessOnly = Boolean(ops.readinessOnlyAccess);

  return (
    <section className="marriage-c3m-panel mt-6" data-testid="counselor-premarital-operations">
      <h2 className="marriage-c3m-section-title">Counseling operations</h2>
      <p className="marriage-c3m-muted mt-1 text-xs">
        Appointments and attendance are separate from eight-session content progress. Scheduling does not auto-complete
        sessions.
      </p>
      <nav className="mt-3 flex flex-wrap gap-2 text-xs font-semibold" aria-label="Operations sections">
        {!readinessOnly ? (
          <>
            <a href="#premarital-ops-appointments" className="rounded-full border border-[#E8E2DA] px-3 py-1 dark:border-white/10">
              Appointments
            </a>
            <a href="#premarital-ops-attendance" className="rounded-full border border-[#E8E2DA] px-3 py-1 dark:border-white/10">
              Attendance
            </a>
          </>
        ) : null}
        {ops.canEditReadiness ? (
          <a href="#premarital-ops-readiness" className="rounded-full border border-[#E8E2DA] px-3 py-1 dark:border-white/10">
            Readiness review
          </a>
        ) : null}
      </nav>

      <div className="mt-4 space-y-6">
        {!readinessOnly ? (
        <>
        <div id="premarital-ops-appointments">
          <h3 className="text-sm font-semibold">Schedule appointment</h3>
          <form
            className="marriage-c3m-form mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void post({
                action: "schedule_appointment",
                journeyId,
                premaritalSessionKey: String(fd.get("premaritalSessionKey") ?? sessionKey),
                scheduledAtLocal: String(fd.get("scheduledAtLocal") ?? ""),
                scheduledEndAtLocal: String(fd.get("scheduledEndAtLocal") ?? ""),
                meetingMode: String(fd.get("meetingMode") ?? "in_person"),
                locationOrLink: String(fd.get("locationOrLink") ?? ""),
              });
            }}
          >
            <label className="text-sm font-semibold">Counseling session</label>
            <select
              name="premaritalSessionKey"
              className="marriage-c3m-input"
              value={sessionKey}
              onChange={(e) => setSessionKey(e.target.value)}
            >
              {PREMARITAL_PROGRAM_SESSIONS.map((s) => (
                <option key={s.sessionKey} value={s.sessionKey}>
                  {s.order}. {s.title}
                </option>
              ))}
            </select>
            <MarriageCounselorSessionDateTimeField name="scheduledAtLocal" label="Start" inputClassName="marriage-c3m-input" />
            <MarriageCounselorSessionDateTimeField name="scheduledEndAtLocal" label="End (optional)" inputClassName="marriage-c3m-input" />
            <label className="text-sm font-semibold">Meeting type</label>
            <select name="meetingMode" className="marriage-c3m-input" defaultValue="in_person">
              <option value="in_person">In person</option>
              <option value="phone">Phone</option>
              <option value="video">Video</option>
            </select>
            <label className="text-sm font-semibold">Location or link</label>
            <input name="locationOrLink" className="marriage-c3m-input" placeholder="Address, phone, or video URL" />
            <button type="submit" disabled={busy} className="marriage-c3m-btn-primary min-h-[44px] w-full sm:w-auto">
              Schedule appointment
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Upcoming appointments</h3>
          {upcoming.length === 0 ? (
            <p className="marriage-c3m-muted mt-2 text-sm">None scheduled.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {upcoming.map((a) => (
                <li key={a.id} className="rounded-xl border border-[#E8E2DA] p-3 text-sm dark:border-white/10">
                  <p className="font-semibold">{a.premaritalSessionTitle ?? a.topic}</p>
                  <p className="text-xs">
                    {formatMarriageSessionScheduledAt(a.scheduledAt, a.schedulingTimeZone)}
                    {a.scheduledEndAt
                      ? ` – ${formatMarriageSessionScheduledAt(a.scheduledEndAt, a.schedulingTimeZone)}`
                      : ""}
                  </p>
                  <p className="text-xs capitalize">{a.meetingMode?.replace(/_/g, " ")}</p>
                  {a.locationOrLink ? <p className="text-xs break-all">{a.locationOrLink}</p> : null}
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-clay-800 underline"
                    onClick={() => setManageId(manageId === a.id ? null : a.id)}
                  >
                    {manageId === a.id ? "Close" : "Reschedule or cancel"}
                  </button>
                  {manageId === a.id ? (
                    <div className="mt-3 space-y-4 border-t border-[#E8E2DA] pt-3 dark:border-white/10">
                      <form
                        className="marriage-c3m-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          void post({
                            action: "reschedule_appointment",
                            sessionId: a.id,
                            scheduledAtLocal: String(fd.get("scheduledAtLocal") ?? ""),
                            scheduledEndAtLocal: String(fd.get("scheduledEndAtLocal") ?? ""),
                            meetingMode: String(fd.get("meetingMode") ?? a.meetingMode ?? "in_person"),
                            locationOrLink: String(fd.get("locationOrLink") ?? ""),
                            reason: String(fd.get("reason") ?? ""),
                          }).then((ok) => {
                            if (ok) setManageId(null);
                          });
                        }}
                      >
                        <p className="text-xs font-semibold">Reschedule</p>
                        <MarriageCounselorSessionDateTimeField
                          name="scheduledAtLocal"
                          label="New start"
                          inputClassName="marriage-c3m-input"
                        />
                        <MarriageCounselorSessionDateTimeField
                          name="scheduledEndAtLocal"
                          label="New end (optional)"
                          inputClassName="marriage-c3m-input"
                        />
                        <select name="meetingMode" className="marriage-c3m-input" defaultValue={a.meetingMode ?? "in_person"}>
                          <option value="in_person">In person</option>
                          <option value="phone">Phone</option>
                          <option value="video">Video</option>
                        </select>
                        <input
                          name="locationOrLink"
                          className="marriage-c3m-input"
                          placeholder="Location or link"
                          defaultValue={a.locationOrLink ?? ""}
                        />
                        <input name="reason" className="marriage-c3m-input" placeholder="Reason (optional)" />
                        <button type="submit" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px] w-full sm:w-auto">
                          Save new time
                        </button>
                      </form>
                      <form
                        className="marriage-c3m-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          void post({
                            action: "cancel_appointment",
                            sessionId: a.id,
                            cancelReason: String(fd.get("cancelReason") ?? ""),
                          }).then((ok) => {
                            if (ok) setManageId(null);
                          });
                        }}
                      >
                        <p className="text-xs font-semibold">Cancel appointment</p>
                        <input name="cancelReason" className="marriage-c3m-input" placeholder="Cancellation reason" required />
                        <button type="submit" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px] w-full sm:w-auto">
                          Cancel appointment
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Past / cancelled</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {past.map((a) => (
                <li key={a.id} className="marriage-c3m-muted">
                  {a.premaritalSessionTitle ?? a.topic} · {a.status}
                  {a.cancelReason ? ` — ${a.cancelReason}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div id="premarital-ops-attendance">
          <h3 className="text-sm font-semibold">Attendance & session record</h3>
          <form
            className="marriage-c3m-form mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void post({
                action: "save_clinical_record",
                journeyId,
                sessionKey: String(fd.get("clinicalSessionKey") ?? clinicalKey),
                sessionDateLocal: String(fd.get("sessionDateLocal") ?? "") || undefined,
                partnerAAttended: fd.get("partnerAAttended") === "on",
                partnerBAttended: fd.get("partnerBAttended") === "on",
                outcome: String(fd.get("outcome") ?? ""),
                topicsCovered: String(fd.get("topicsCovered") ?? ""),
                followUpActions: String(fd.get("followUpActions") ?? ""),
                privateObservations: String(fd.get("privateObservations") ?? ""),
              });
            }}
          >
            <select
              name="clinicalSessionKey"
              className="marriage-c3m-input"
              value={clinicalKey}
              onChange={(e) => setClinicalKey(e.target.value)}
            >
              {PREMARITAL_PROGRAM_SESSIONS.map((s) => (
                <option key={s.sessionKey} value={s.sessionKey}>
                  {s.order}. {s.title}
                </option>
              ))}
            </select>
            <label className="text-sm font-semibold">Session date (optional)</label>
            <input
              type="date"
              name="sessionDateLocal"
              className="marriage-c3m-input"
              defaultValue={
                clinicalByKey.get(clinicalKey)?.sessionDate
                  ? clinicalByKey.get(clinicalKey)!.sessionDate!.slice(0, 10)
                  : ""
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="partnerAAttended" defaultChecked={clinicalByKey.get(clinicalKey)?.partnerAAttended ?? false} /> Partner A attended
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="partnerBAttended" defaultChecked={clinicalByKey.get(clinicalKey)?.partnerBAttended ?? false} /> Partner B attended
            </label>
            <label className="text-sm font-semibold">Session outcome</label>
            <select name="outcome" className="marriage-c3m-input" defaultValue={clinicalByKey.get(clinicalKey)?.outcome ?? ""}>
              <option value="">—</option>
              <option value="completed">Completed</option>
              <option value="partial">Partially completed</option>
              <option value="postponed">Postponed</option>
            </select>
            <textarea name="topicsCovered" className="marriage-c3m-textarea" placeholder="Topics covered" defaultValue={clinicalByKey.get(clinicalKey)?.topicsCovered ?? ""} />
            <textarea name="followUpActions" className="marriage-c3m-textarea" placeholder="Follow-up actions" defaultValue={clinicalByKey.get(clinicalKey)?.followUpActions ?? ""} />
            <textarea name="privateObservations" className="marriage-c3m-textarea" placeholder="Private observations (counselor only)" defaultValue={clinicalByKey.get(clinicalKey)?.privateObservations ?? ""} />
            <button type="submit" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px] w-full sm:w-auto">
              Save attendance record
            </button>
          </form>
        </div>
        </>
        ) : null}

        {ops.canEditReadiness && (
          <div id="premarital-ops-readiness">
            <h3 className="text-sm font-semibold">Senior Pastor readiness review</h3>
            <p className="marriage-c3m-muted mt-1 text-xs">
              Pastoral recommendation only — not a medical, psychological, or legal certification. Requires explicit
              decision; module completion does not auto-set status.
            </p>
            <form
              className="marriage-c3m-form mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void post({
                  action: "save_readiness_review",
                  journeyId,
                  status: String(fd.get("status") ?? "in_progress"),
                  strengths: String(fd.get("strengths") ?? ""),
                  areasForDiscussion: String(fd.get("areasForDiscussion") ?? ""),
                  unresolvedConcerns: String(fd.get("unresolvedConcerns") ?? ""),
                  recommendedNextSteps: String(fd.get("recommendedNextSteps") ?? ""),
                  optionalAdditionalCounseling: String(fd.get("optionalAdditionalCounseling") ?? ""),
                  pastoralRecommendation: String(fd.get("pastoralRecommendation") ?? ""),
                  sessionsOverviewNote: String(fd.get("sessionsOverviewNote") ?? ""),
                  homeworkOverviewNote: String(fd.get("homeworkOverviewNote") ?? ""),
                  assessmentOverviewNote: String(fd.get("assessmentOverviewNote") ?? ""),
                });
              }}
            >
              <select name="status" className="marriage-c3m-input" defaultValue={ops.readinessReview?.status ?? "in_progress"}>
                <option value="in_progress">In progress</option>
                <option value="additional_counseling_recommended">Additional counseling recommended</option>
                <option value="ready_to_proceed">Ready to proceed</option>
                <option value="deferred">Deferred</option>
              </select>
              <textarea name="strengths" className="marriage-c3m-textarea" placeholder="Relationship strengths" defaultValue={ops.readinessReview?.strengths ?? ""} />
              <textarea name="areasForDiscussion" className="marriage-c3m-textarea" placeholder="Areas requiring further discussion" defaultValue={ops.readinessReview?.areasForDiscussion ?? ""} />
              <textarea name="unresolvedConcerns" className="marriage-c3m-textarea" placeholder="Unresolved concerns" defaultValue={ops.readinessReview?.unresolvedConcerns ?? ""} />
              <textarea name="recommendedNextSteps" className="marriage-c3m-textarea" placeholder="Recommended next steps" defaultValue={ops.readinessReview?.recommendedNextSteps ?? ""} />
              <textarea name="optionalAdditionalCounseling" className="marriage-c3m-textarea" placeholder="Optional additional counseling" defaultValue={ops.readinessReview?.optionalAdditionalCounseling ?? ""} />
              <textarea name="pastoralRecommendation" className="marriage-c3m-textarea" placeholder="Final pastoral recommendation" defaultValue={ops.readinessReview?.pastoralRecommendation ?? ""} />
              <textarea name="sessionsOverviewNote" className="marriage-c3m-textarea" placeholder="Sessions overview (high level)" defaultValue={ops.readinessReview?.sessionsOverviewNote ?? ""} />
              <textarea name="homeworkOverviewNote" className="marriage-c3m-textarea" placeholder="Homework overview (high level)" defaultValue={ops.readinessReview?.homeworkOverviewNote ?? ""} />
              <textarea name="assessmentOverviewNote" className="marriage-c3m-textarea" placeholder="Assessment overview (high level, no private answers)" defaultValue={ops.readinessReview?.assessmentOverviewNote ?? ""} />
              <button type="submit" disabled={busy} className="marriage-c3m-btn-primary min-h-[44px] w-full sm:w-auto">
                Save readiness decision
              </button>
            </form>
            {ops.readinessAudit.length > 0 && (
              <p className="marriage-c3m-muted mt-2 text-xs">
                Audit trail: {ops.readinessAudit.length} revision(s), latest{" "}
                {new Date(ops.readinessAudit[0]!.revisedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
