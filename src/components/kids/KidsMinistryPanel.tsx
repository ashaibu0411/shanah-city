"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  KidsIncident,
  KidsLesson,
  KidsRosterEntry,
  KidsRoomHeadcount,
} from "@/lib/kids-types";
import { Button, Card } from "@/components/ui";

type MinistryData = {
  roster: KidsRosterEntry[];
  headcount: KidsRoomHeadcount[];
  lessons: KidsLesson[];
  incidents: KidsIncident[];
  weekStarting: string;
  services: string[];
  ageGroups: string[];
  canManageKidsMinistry: boolean;
};

const tabs = [
  { id: "roster", label: "Roster" },
  { id: "pickup", label: "Pickup" },
  { id: "lessons", label: "Lessons" },
  { id: "incidents", label: "Incidents" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function KidsMinistryPanel({
  initialWeek,
  initialService,
}: {
  initialWeek?: string;
  initialService?: string;
}) {
  const [tab, setTab] = useState<TabId>("roster");
  const [service, setService] = useState(initialService ?? "Sunday Morning");
  const [weekStarting, setWeekStarting] = useState(initialWeek ?? "");
  const [data, setData] = useState<MinistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pickupId, setPickupId] = useState("");
  const [securityCode, setSecurityCode] = useState("");

  const [lessonAgeGroup, setLessonAgeGroup] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");

  const [incidentChild, setIncidentChild] = useState("");
  const [incidentAgeGroup, setIncidentAgeGroup] = useState("");
  const [incidentSummary, setIncidentSummary] = useState("");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [incidentSeverity, setIncidentSeverity] =
    useState<KidsIncident["severity"]>("minor");
  const [incidentCheckInId, setIncidentCheckInId] = useState("");
  const [incidentParentUserId, setIncidentParentUserId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ service });
    if (weekStarting) params.set("week", weekStarting);

    const response = await fetch(`/api/kids/ministry?${params.toString()}`);
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not load kids ministry data.");
      return;
    }

    setData(payload);
    if (!weekStarting) setWeekStarting(payload.weekStarting);
    if (!lessonAgeGroup && payload.ageGroups?.[0]) setLessonAgeGroup(payload.ageGroups[0]);
    if (!incidentAgeGroup && payload.ageGroups?.[0]) setIncidentAgeGroup(payload.ageGroups[0]);
  }, [service, weekStarting]);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyPickup() {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/kids/ministry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify-checkout",
        id: pickupId,
        securityCode,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Pickup verification failed.");
      return;
    }
    setMessage(`${payload.checkin.childName} checked out with verified pickup code.`);
    setPickupId("");
    setSecurityCode("");
    load();
  }

  async function saveLesson(publish: boolean) {
    if (!data) return;
    setMessage(null);
    setError(null);
    const response = await fetch("/api/kids/ministry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: publish ? "publish-lesson" : "save-lesson",
        weekStarting: data.weekStarting,
        ageGroup: lessonAgeGroup,
        title: lessonTitle,
        content: lessonContent,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not save lesson.");
      return;
    }
    setMessage(publish ? "Lesson published for the team." : "Lesson draft saved.");
    setLessonTitle("");
    setLessonContent("");
    load();
  }

  async function reportIncident() {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/kids/ministry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "report-incident",
        childName: incidentChild,
        ageGroup: incidentAgeGroup,
        service,
        summary: incidentSummary,
        details: incidentDetails,
        severity: incidentSeverity,
        checkInId: incidentCheckInId || undefined,
        parentUserId: incidentParentUserId || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not log incident.");
      return;
    }
    setMessage("Incident logged.");
    setIncidentChild("");
    setIncidentSummary("");
    setIncidentDetails("");
    setIncidentCheckInId("");
    setIncidentParentUserId("");
    load();
  }

  async function notifyParent(incidentId: string) {
    setMessage(null);
    setError(null);
    const response = await fetch("/api/kids/ministry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "notify-parent", incidentId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not notify parent.");
      return;
    }
    setMessage("Parent notified.");
    load();
  }

  function prefillIncident(entry: KidsRosterEntry) {
    setIncidentChild(entry.childName);
    setIncidentAgeGroup(entry.ageGroup);
    setIncidentCheckInId(entry.id);
    setIncidentParentUserId(entry.parentUserId ?? "");
    setTab("incidents");
  }

  function prefillPickup(entry: KidsRosterEntry) {
    setPickupId(entry.id);
    setTab("pickup");
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-night-600">Service</span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
            >
              {(data?.services ?? ["Friday Evening", "Sunday Morning"]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-night-600">Lesson week</span>
            <input
              type="date"
              value={weekStarting}
              onChange={(event) => setWeekStarting(event.target.value)}
              className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
            />
          </label>
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                tab === item.id
                  ? "bg-night-900 text-white"
                  : "bg-sand-100 text-night-700 hover:bg-sand-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      {loading || !data ? (
        <Card>
          <p className="text-sm text-night-600">Loading kids ministry dashboard...</p>
        </Card>
      ) : (
        <>
          {tab === "roster" && (
            <div className="space-y-6">
              <Card>
                <h2 className="font-display text-xl font-semibold text-night-900">
                  Room headcount
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.headcount.map((room) => (
                    <div key={room.ageGroup} className="rounded-xl bg-sand-50 px-4 py-3">
                      <p className="text-sm text-night-600">{room.ageGroup}</p>
                      <p className="font-display text-2xl font-semibold text-night-900">
                        {room.count}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="font-display text-xl font-semibold text-night-900">
                  Active roster
                </h2>
                {data.roster.length === 0 ? (
                  <p className="mt-3 text-sm text-night-500">No children checked in for this service.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.roster.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-night-900/5 bg-sand-50 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-night-900">{entry.childName}</p>
                            <p className="text-night-600">
                              {entry.ageGroup} · Parent: {entry.parentName}
                            </p>
                            <p className="text-night-500">Code {entry.securityCode}</p>
                            {(entry.hasAllergyAlert || entry.hasMedicalAlert) && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {entry.hasAllergyAlert && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                    Allergy: {entry.allergies}
                                  </span>
                                )}
                                {entry.hasMedicalAlert && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                    Medical: {entry.medicalNotes}
                                  </span>
                                )}
                              </div>
                            )}
                            {entry.authorizedPickup && entry.authorizedPickup.length > 0 && (
                              <p className="mt-2 text-xs text-night-500">
                                Authorized pickup:{" "}
                                {entry.authorizedPickup.map((contact) => contact.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={() => prefillPickup(entry)}>
                              Verify pickup
                            </Button>
                            <Button variant="secondary" onClick={() => prefillIncident(entry)}>
                              Log incident
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "pickup" && (
            <Card>
              <h2 className="font-display text-xl font-semibold text-night-900">
                Pickup verification
              </h2>
              <p className="mt-2 text-sm text-night-600">
                Enter the security code from the parent label before releasing a child.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={pickupId}
                  onChange={(event) => setPickupId(event.target.value)}
                  className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                >
                  <option value="">Select checked-in child</option>
                  {data.roster.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.childName} · Code {entry.securityCode}
                    </option>
                  ))}
                </select>
                <input
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value)}
                  placeholder="Security code"
                  className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                />
              </div>
              <Button className="mt-4" onClick={verifyPickup} disabled={!pickupId || !securityCode.trim()}>
                Verify & check out
              </Button>
            </Card>
          )}

          {tab === "lessons" && (
            <div className="space-y-6">
              {data.canManageKidsMinistry && (
                <Card>
                  <h2 className="font-display text-xl font-semibold text-night-900">
                    Weekly lesson
                  </h2>
                  <p className="mt-2 text-sm text-night-600">
                    Week of {data.weekStarting}. One lesson per age group.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <select
                      value={lessonAgeGroup}
                      onChange={(event) => setLessonAgeGroup(event.target.value)}
                      className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                    >
                      {data.ageGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    <input
                      value={lessonTitle}
                      onChange={(event) => setLessonTitle(event.target.value)}
                      placeholder="Lesson title"
                      className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <textarea
                    value={lessonContent}
                    onChange={(event) => setLessonContent(event.target.value)}
                    placeholder="Lesson outline, activities, and discussion points"
                    rows={6}
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => saveLesson(false)} disabled={!lessonTitle.trim()}>
                      Save draft
                    </Button>
                    <Button onClick={() => saveLesson(true)} disabled={!lessonTitle.trim()}>
                      Publish lesson
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                <h3 className="font-semibold text-night-900">This week&apos;s lessons</h3>
                {data.lessons.length === 0 ? (
                  <p className="mt-3 text-sm text-night-500">No lessons saved for this week yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.lessons.map((lesson) => (
                      <li key={lesson.id} className="rounded-xl bg-sand-50 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-night-900">
                            {lesson.ageGroup}: {lesson.title}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              lesson.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sand-200 text-night-700"
                            }`}
                          >
                            {lesson.status}
                          </span>
                        </div>
                        {lesson.content && (
                          <p className="mt-2 whitespace-pre-wrap text-night-700">{lesson.content}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "incidents" && (
            <div className="space-y-6">
              <Card>
                <h2 className="font-display text-xl font-semibold text-night-900">
                  Log incident
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    value={incidentChild}
                    onChange={(event) => setIncidentChild(event.target.value)}
                    placeholder="Child name"
                    className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  />
                  <select
                    value={incidentAgeGroup}
                    onChange={(event) => setIncidentAgeGroup(event.target.value)}
                    className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  >
                    {data.ageGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  <select
                    value={incidentSeverity}
                    onChange={(event) =>
                      setIncidentSeverity(event.target.value as KidsIncident["severity"])
                    }
                    className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    value={incidentSummary}
                    onChange={(event) => setIncidentSummary(event.target.value)}
                    placeholder="Short summary"
                    className="rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  />
                </div>
                <textarea
                  value={incidentDetails}
                  onChange={(event) => setIncidentDetails(event.target.value)}
                  placeholder="Details and action taken"
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm"
                />
                <Button
                  className="mt-4"
                  onClick={reportIncident}
                  disabled={!incidentChild.trim() || !incidentSummary.trim()}
                >
                  Save incident
                </Button>
              </Card>

              <Card>
                <h3 className="font-semibold text-night-900">Recent incidents</h3>
                {data.incidents.length === 0 ? (
                  <p className="mt-3 text-sm text-night-500">No incidents logged yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.incidents.map((incident) => (
                      <li key={incident.id} className="rounded-xl bg-sand-50 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-night-900">
                              {incident.childName} · {incident.severity}
                            </p>
                            <p className="text-night-700">{incident.summary}</p>
                            <p className="mt-1 text-xs text-night-500">
                              {incident.service} · {new Date(incident.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!incident.parentNotified && incident.parentUserId && (
                            <Button variant="secondary" onClick={() => notifyParent(incident.id)}>
                              Notify parent
                            </Button>
                          )}
                          {incident.parentNotified && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              Parent notified
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
