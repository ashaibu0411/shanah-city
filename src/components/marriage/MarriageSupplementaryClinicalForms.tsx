"use client";

import type {
  MarriageCounselingSessionRecord,
  MarriageCounselorPremaritalOperationsView,
} from "@/lib/marriage-counseling-types";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";

type Props = {
  journeyId: string;
  appointments: Array<MarriageCounselingSessionRecord & { isSupplementary: true }>;
  clinical: MarriageCounselorPremaritalOperationsView["supplementaryClinical"];
  busy: boolean;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
};

function triSelect(name: string, label: string, value: boolean | null | undefined) {
  const v = value === true ? "true" : value === false ? "false" : "";
  return (
    <label className="text-sm">
      <span className="font-semibold">{label}</span>
      <select name={name} className="marriage-c3m-input mt-1" defaultValue={v}>
        <option value="">Not recorded</option>
        <option value="true">Attended</option>
        <option value="false">Did not attend</option>
      </select>
    </label>
  );
}

function parseTri(v: FormDataEntryValue | null): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export function MarriageSupplementaryClinicalForms({ journeyId, appointments, clinical, busy, onSave }: Props) {
  const byAppt = new Map(clinical.map((r) => [r.appointmentId, r]));

  if (appointments.length === 0) {
    return <p className="marriage-c3m-muted mt-2 text-xs">No supplementary appointments scheduled yet.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {appointments.map((appt) => {
        const record = byAppt.get(appt.id);
        const saved = Boolean(record?.updatedAt);
        return (
          <li key={appt.id} className="rounded-xl border border-stone-200 p-3 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{appt.topic ?? "Additional session"}</p>
                <p className="text-xs text-night-500">
                  {formatMarriageSessionScheduledAt(appt.scheduledAt, appt.schedulingTimeZone)}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${saved ? "bg-emerald-100 text-emerald-900" : "bg-stone-100 text-stone-600"}`}
              >
                {saved ? "Record saved" : "Needs record"}
              </span>
            </div>
            <form
              className="marriage-c3m-form mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void onSave({
                  action: "save_supplementary_clinical",
                  journeyId,
                  appointmentId: appt.id,
                  sessionDateLocal: String(fd.get("sessionDateLocal") ?? "") || undefined,
                  partnerAAttended: parseTri(fd.get("partnerAAttended")),
                  partnerBAttended: parseTri(fd.get("partnerBAttended")),
                  outcome: String(fd.get("outcome") ?? "") || undefined,
                  topicsCovered: String(fd.get("topicsCovered") ?? ""),
                  followUpActions: String(fd.get("followUpActions") ?? ""),
                  privateObservations: String(fd.get("privateObservations") ?? ""),
                }).then((ok) => {
                  if (ok && typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("marriage-timeline-refresh"));
                  }
                });
              }}
            >
              <label className="text-sm font-semibold">Session date (optional)</label>
              <input
                type="date"
                name="sessionDateLocal"
                className="marriage-c3m-input"
                defaultValue={record?.sessionDate ? record.sessionDate.slice(0, 10) : ""}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {triSelect("partnerAAttended", "Partner A attendance", record?.partnerAAttended)}
                {triSelect("partnerBAttended", "Partner B attendance", record?.partnerBAttended)}
              </div>
              <label className="text-sm font-semibold">Session outcome</label>
              <select name="outcome" className="marriage-c3m-input" defaultValue={record?.outcome ?? ""}>
                <option value="">—</option>
                <option value="completed">Completed</option>
                <option value="partial">Partially completed</option>
                <option value="postponed">Postponed</option>
              </select>
              <textarea
                name="topicsCovered"
                className="marriage-c3m-textarea"
                placeholder="Topics discussed"
                defaultValue={record?.topicsCovered ?? ""}
              />
              <textarea
                name="followUpActions"
                className="marriage-c3m-textarea"
                placeholder="Follow-up actions"
                defaultValue={record?.followUpActions ?? ""}
              />
              <textarea
                name="privateObservations"
                className="marriage-c3m-textarea"
                placeholder="Private counselor observations (not shown to partners)"
                defaultValue={record?.privateObservations ?? ""}
              />
              <button type="submit" disabled={busy} className="marriage-c3m-btn-secondary min-h-[44px]">
                Save supplementary record
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
