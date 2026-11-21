"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  KidsIncident,
  KidsLesson,
  KidsRosterEntry,
  KidsRoomHeadcount,
} from "@/lib/kids-types";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import type { KidsChildSearchResult } from "@/lib/kids-workspace-types";
import type {
  KidsAnnouncement,
  KidsLeaderSnapshot,
  KidsLessonCompletion,
  KidsTeacherAssignment,
  KidsVolunteerProfile,
} from "@/lib/kids-workspace-types";
import {
  KidsLeaderTab,
  KidsLessonCompletionButton,
  KidsRegisteredChildPicker,
  KidsTeacherHomeTab,
  KidsTeamTab,
  KidsTrainingTab,
} from "@/components/kids/KidsMinistryWorkspaceTabs";

type MinistryData = {
  roster: KidsRosterEntry[];
  rosterForRoom?: KidsRosterEntry[];
  directory: { childName: string; parentName: string; ageGroup: string; parentUserId?: string; allergies?: string; medicalNotes?: string; authorizedPickup?: { name: string; phone?: string }[] }[];
  headcount: KidsRoomHeadcount[];
  lessons: KidsLesson[];
  incidents: KidsIncident[];
  weekStarting: string;
  serviceDate?: string;
  services: string[];
  ageGroups: string[];
  canManageKidsMinistry: boolean;
  todayAssignment?: KidsTeacherAssignment | null;
  myLesson?: KidsLesson | null;
  assignments?: KidsTeacherAssignment[];
  announcements?: KidsAnnouncement[];
  completions?: KidsLessonCompletion[];
  leaderSnapshot?: KidsLeaderSnapshot | null;
  safeguardingGuideUrl?: string;
  volunteers?: KidsVolunteerProfile[];
  myVolunteerProfile?: KidsVolunteerProfile | null;
};

const tabs = [
  { id: "home", label: "Home" },
  { id: "checkin", label: "Check in" },
  { id: "roster", label: "Roster" },
  { id: "pickup", label: "Pickup" },
  { id: "lessons", label: "Lessons" },
  { id: "team", label: "Team" },
  { id: "leader", label: "Leader" },
  { id: "training", label: "Training" },
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
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("home");
  const [service, setService] = useState(initialService ?? "Sunday Morning");
  const [weekStarting, setWeekStarting] = useState(initialWeek ?? "");
  const [data, setData] = useState<MinistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [childSearch, setChildSearch] = useState("");
  const [linkedParentUserId, setLinkedParentUserId] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [registeredChildren, setRegisteredChildren] = useState<KidsChildSearchResult[]>([]);
  const [alertingId, setAlertingId] = useState("");
  const [childName, setChildName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [room, setRoom] = useState<string>("Preschool (3-5)");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<{ childName: string; securityCode: string } | null>(null);
  const [pickupId, setPickupId] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [pickupAdultConfirmed, setPickupAdultConfirmed] = useState(false);
  const [pickupBusy, setPickupBusy] = useState(false);
  const [checkinMode, setCheckinMode] = useState<"returning" | "guest">("returning");

  const [lessonAgeGroup, setLessonAgeGroup] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonMemoryVerse, setLessonMemoryVerse] = useState("");
  const [lessonBibleStory, setLessonBibleStory] = useState("");
  const [lessonObjectives, setLessonObjectives] = useState("");
  const [lessonActivities, setLessonActivities] = useState("");
  const [lessonMaterialsUrl, setLessonMaterialsUrl] = useState("");

  const [incidentChild, setIncidentChild] = useState("");
  const [incidentAgeGroup, setIncidentAgeGroup] = useState("");
  const [incidentSummary, setIncidentSummary] = useState("");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [incidentSeverity, setIncidentSeverity] =
    useState<KidsIncident["severity"]>("minor");
  const [incidentCheckInId, setIncidentCheckInId] = useState("");
  const [incidentParentUserId, setIncidentParentUserId] = useState("");

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    const params = new URLSearchParams({ service });
    if (weekStarting) params.set("week", weekStarting);

    const response = await fetch(`/api/kids/ministry?${params.toString()}`);
    const payload = await response.json();
    if (!silent) setLoading(false);

    if (!response.ok) {
      if (!silent) setError(payload.error ?? "Could not load kids ministry data.");
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

  useEffect(() => {
    const query = childSearch.trim();
    if (checkinMode !== "returning" || !query) {
      setRegisteredChildren([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ childSearch: query.slice(0, 1), service });
        if (data?.serviceDate) params.set("date", data.serviceDate);
        const response = await fetch(`/api/kids/ministry?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) { setRegisteredChildren([]); return; }
        const payload = await response.json();
        if (!controller.signal.aborted) setRegisteredChildren(payload.children ?? []);
      } catch {
        if (!controller.signal.aborted) setRegisteredChildren([]);
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [childSearch, checkinMode, service, data?.serviceDate]);

  useEffect(() => {
    const intervalMs = 15_000;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load({ silent: true });
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [load]);

  async function messageParent(entry: KidsRosterEntry, message: string) {
    if (!entry.parentUserId) { setError("No linked guardian app account. Please call the verified pickup contact."); return; }
    setAlertingId(entry.id);
    setError(null);
    try {
      const response = await fetch("/api/kids/ministry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "message-parent", id: entry.id, message }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to send notification.");
      else setMessage(result.delivery?.sent ? "Parent alert sent to the app. Not a read receipt — call if urgent." : "Push delivery not confirmed. Please call the guardian.");
    } catch { setError("Notification failed. Call the guardian directly."); }
    finally { setAlertingId(""); }
  }

  async function escalateToLead(entry: KidsRosterEntry) {
    setAlertingId(entry.id);
    setError(null);
    try {
      const response = await fetch("/api/kids/ministry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "escalate-to-lead", id: entry.id }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Could not reach the ministry lead.");
      else setMessage(result.delivery?.sent ? "Private alert sent to Kids Ministry leadership. Call directly if immediate help is needed." : "Leader notification not confirmed. Contact leadership directly.");
    } catch { setError("Could not notify leadership. Call directly."); }
    finally { setAlertingId(""); }
  }

  async function teacherCheckIn() {
    if (checkinBusy) return;
    if (Boolean(linkedParentUserId) !== Boolean(familyMemberId)) {
      setError("Select the registered child again, or choose New / guest child.");
      return;
    }
    setCheckinBusy(true);
    setError(null);
    setMessage(null);
    setLastCheckin(null);
    try {
      const response = await fetch("/api/kids/ministry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teacher-checkin",
          childName,
          parentName: guardianName,
          ageGroup: room,
          service,
          pickupName,
          pickupPhone,
          notes: checkinNotes,
          allergies,
          medicalNotes,
          parentUserId: linkedParentUserId || undefined,
          familyMemberId: familyMemberId || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not check in child.");
        return;
      }
      setLastCheckin({ childName: payload.checkin.childName, securityCode: payload.checkin.securityCode });
      setMessage(`${payload.checkin.childName} checked into ${room}. Give the guardian the pickup code privately.`);
      setChildName("");
      setGuardianName("");
      setPickupName("");
      setPickupPhone("");
      setCheckinNotes("");
      setAllergies("");
      setMedicalNotes("");
      setChildSearch("");
      setLinkedParentUserId("");
      setFamilyMemberId("");
      await load({ silent: true });
    } catch {
      setError("Check-in could not be completed. Please try again.");
    } finally {
      setCheckinBusy(false);
    }
  }

  async function verifyPickup() {
    if (pickupBusy || !pickupAdultConfirmed || !pickupId || !securityCode.trim()) return;
    setPickupBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/kids/ministry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-checkout", id: pickupId, securityCode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Pickup verification failed.");
        return;
      }
      setMessage(`${payload.checkin.childName} checked out. Confirm the child is released only to the adult you verified in person.`);
      setPickupId("");
      setSecurityCode("");
      setPickupAdultConfirmed(false);
      await load({ silent: true });
    } catch {
      setError("Could not complete pickup. Keep the child in the classroom and contact the ministry lead.");
    } finally {
      setPickupBusy(false);
    }
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
        memoryVerse: lessonMemoryVerse,
        materialsUrl: lessonMaterialsUrl,
        curriculum: {
          bibleStory: lessonBibleStory,
          teachingObjectives: lessonObjectives,
          activities: lessonActivities,
          preparationChecklist: lessonContent
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 12),
        },
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

  async function ministryAction(payload: Record<string, unknown>) {
    const response = await fetch("/api/kids/ministry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Request failed.");
    return result;
  }

  async function confirmAssignment(id: string) {
    try {
      await ministryAction({ action: "confirm-assignment", id });
      setMessage("Assignment confirmed.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm assignment.");
    }
  }

  async function requestReplacement(id: string) {
    try {
      await ministryAction({ action: "request-replacement", id });
      setMessage("Leaders notified that you need a substitute.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update assignment.");
    }
  }

  async function assignTeacher(payload: { userId: string; ageGroup: string; role: string }) {
    if (!data) return;
    try {
      await ministryAction({
        action: "assign-teacher",
        userId: payload.userId,
        ageGroup: payload.ageGroup,
        role: payload.role,
        service,
        serviceDate: data.serviceDate,
      });
      setMessage("Teacher assigned.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign teacher.");
    }
  }

  async function completeLesson(lesson: KidsLesson, ageGroup: string) {
    if (!data) return;
    try {
      await ministryAction({
        action: "complete-lesson",
        lessonId: lesson.id,
        weekStarting: data.weekStarting,
        ageGroup,
        service,
        serviceDate: data.serviceDate,
      });
      setMessage("Lesson marked complete for today.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save completion.");
    }
  }

  async function attestSafeguarding() {
    try {
      await ministryAction({ action: "attest-safeguarding-training" });
      setMessage("Safeguarding self-attestation saved. A leader must verify before lead teaching.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update training record.");
    }
  }

  async function verifyVolunteerSafeguarding(userId: string) {
    try {
      await ministryAction({ action: "verify-volunteer-safeguarding", userId });
      setMessage("Volunteer safeguarding verified.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify safeguarding.");
    }
  }

  async function publishAnnouncement(title: string, body: string) {
    try {
      await ministryAction({ action: "publish-announcement", title, body });
      setMessage("Announcement published.");
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish announcement.");
    }
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
    setSecurityCode("");
    setPickupAdultConfirmed(false);
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
          <Button variant="secondary" onClick={() => load()} disabled={loading}>
            Refresh
          </Button>
          <p className="text-xs text-night-500 sm:ml-auto sm:self-center">
            Roster updates automatically every 15 seconds.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs
            .filter((item) => item.id !== "leader" || data?.canManageKidsMinistry)
            .map((item) => (
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
          {tab === "home" && (
            <KidsTeacherHomeTab
              service={service}
              todayAssignment={data.todayAssignment ?? null}
              myLesson={data.myLesson ?? null}
              rosterForRoom={data.rosterForRoom ?? data.roster}
              headcount={data.headcount}
              onOpenCheckIn={() => setTab("checkin")}
              onOpenRoster={() => setTab("roster")}
              onOpenPickup={() => setTab("pickup")}
              onOpenLessons={() => setTab("lessons")}
            />
          )}
          {tab === "team" && user && (
            <KidsTeamTab
              assignments={data.assignments ?? []}
              myUserId={user.id}
              canManage={data.canManageKidsMinistry}
              ageGroups={data.ageGroups}
              service={service}
              serviceDate={data.serviceDate ?? data.weekStarting}
              onConfirm={confirmAssignment}
              onRequestReplacement={requestReplacement}
              onAssign={assignTeacher}
            />
          )}
          {tab === "leader" && data.canManageKidsMinistry && (
            <KidsLeaderTab snapshot={data.leaderSnapshot ?? null} />
          )}
          {tab === "training" && (
            <KidsTrainingTab
              announcements={data.announcements ?? []}
              safeguardingGuideUrl={data.safeguardingGuideUrl ?? "/training/kids-ministry-leader.html"}
              onAttestSafeguarding={() => void attestSafeguarding()}
              safeguardingSelfAttested={Boolean(data.myVolunteerProfile?.safeguardingSelfAttestedAt)}
              safeguardingLeaderVerified={Boolean(data.myVolunteerProfile?.safeguardingLeaderVerifiedAt)}
              canManage={data.canManageKidsMinistry}
              volunteers={data.volunteers ?? []}
              onVerifyVolunteerSafeguarding={(userId) => void verifyVolunteerSafeguarding(userId)}
              onPublishAnnouncement={(title, body) => void publishAnnouncement(title, body)}
            />
          )}
          {tab === "checkin" && (
            <div className="space-y-4">
              <Card className="border-[#dfceb0] bg-[#faf5eb] dark:border-slate-600 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wider text-[#85643d] dark:text-amber-200">Shanah Kids · Teacher station</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-night-900 dark:text-white">Welcome children into their rooms</h2>
                <p className="mt-2 text-sm leading-6 text-night-700 dark:text-slate-200">Choose a returning child or add a new one. Confirm the guardian and authorized pickup adult before completing check-in.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {data.headcount.map((item) => <div key={item.ageGroup} className="rounded-xl border border-[#e4d4b9] bg-white p-3 dark:border-slate-600 dark:bg-slate-800"><p className="text-xs font-semibold text-night-600 dark:text-slate-300">{item.ageGroup}</p><p className="mt-1 text-2xl font-bold text-night-900 dark:text-white">{item.count}</p></div>)}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-bold text-night-900 dark:text-white">1. Find a child</h3>
                <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Check-in type">
                  <button type="button" aria-pressed={checkinMode === "returning"} onClick={() => setCheckinMode("returning")} className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-bold ${checkinMode === "returning" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-night-900 dark:bg-slate-800 dark:text-white"}`}>Returning child</button>
                  <button type="button" aria-pressed={checkinMode === "guest"} onClick={() => { setCheckinMode("guest"); setChildSearch(""); setLinkedParentUserId(""); setFamilyMemberId(""); setChildName(""); setGuardianName(""); setPickupName(""); setPickupPhone(""); setAllergies(""); setMedicalNotes(""); }} className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-bold ${checkinMode === "guest" ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-night-900 dark:bg-slate-800 dark:text-white"}`}>New / guest child</button>
                </div>
                {checkinMode === "returning" && (<>
                <label className="mt-3 block text-sm font-semibold text-night-700 dark:text-slate-200">Search returning children</label>
                <input value={childSearch} onChange={(event) => { setChildSearch(event.target.value); setRegisteredChildren([]); }} placeholder="Type first letter of child's name" className="mt-1 w-full rounded-xl border border-night-900/20 bg-white px-4 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                <KidsRegisteredChildPicker
                  letter={childSearch}
                  results={registeredChildren.filter((entry) =>
                    entry.childName.toLowerCase().startsWith(childSearch.trim().toLowerCase()),
                  )}
                  onSelect={(entry) => {
                    setCheckinMode("returning");
                    setChildName(entry.childName);
                    setGuardianName(entry.parentName);
                    if (entry.suggestedAgeGroup) setRoom(entry.suggestedAgeGroup);
                    setLinkedParentUserId(entry.parentUserId);
                    setFamilyMemberId(entry.familyMemberId);
                    setPickupName("");
                    setPickupPhone("");
                    setAllergies("");
                    setMedicalNotes("");
                    setChildSearch("");
                  }}
                />
                {childSearch.trim().length >= 1 && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {(data.directory ?? [])
                      .filter((entry) =>
                        entry.childName.toLowerCase().startsWith(childSearch.trim().toLowerCase()),
                      )
                      .slice(0, 8)
                      .map((entry) => (
                        <button
                          key={`${entry.childName}:${entry.parentName}`}
                          type="button"
                          onClick={() => {
                            setChildName(entry.childName);
                            setGuardianName(entry.parentName);
                            setRoom(entry.ageGroup);
                            setLinkedParentUserId("");
                            setFamilyMemberId("");
                            setAllergies(entry.allergies ?? "");
                            setMedicalNotes(entry.medicalNotes ?? "");
                            setPickupName(entry.authorizedPickup?.[0]?.name ?? "");
                            setPickupPhone(entry.authorizedPickup?.[0]?.phone ?? "");
                            setChildSearch("");
                          }}
                          className="block w-full rounded-xl border border-night-900/10 bg-sand-50 px-4 py-3 text-left text-sm text-night-900 hover:bg-sand-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                          <span className="block font-semibold">{entry.childName}</span>
                          <span className="text-xs">
                            {entry.parentName} · {entry.ageGroup} · previous visit
                          </span>
                        </button>
                      ))}
                  </div>
                )}
                </>)}
                <h3 className="mt-5 text-lg font-bold text-night-900 dark:text-white">2. Confirm check-in details</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Child's full name<input value={childName} onChange={(e) => { setChildName(e.target.value); setLinkedParentUserId(""); setFamilyMemberId(""); }} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Parent / guardian name<input value={guardianName} onChange={(e) => { setGuardianName(e.target.value); setLinkedParentUserId(""); setFamilyMemberId(""); }} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Assign room<select value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">{data.ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Authorized pickup adult<input value={pickupName} onChange={(e) => setPickupName(e.target.value)} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Pickup contact phone<input type="tel" value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Allergies (ask guardian)<input value={allergies} onChange={(e) => setAllergies(e.target.value)} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200">Medical alerts (ask guardian)<input value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                  <label className="text-sm font-semibold text-night-700 dark:text-slate-200 sm:col-span-2">Additional notes<textarea value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} rows={3} className="mt-1 block w-full rounded-xl border border-night-900/20 bg-white px-3 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white" /></label>
                </div>
                {linkedParentUserId && familyMemberId ? (
                  <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Registered child linked to guardian records. Pickup contacts load from the family profile on check-in.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-night-600 dark:text-slate-200">
                    Guest check-in: confirm guardian and authorized pickup contact before completing check-in.
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-night-600 dark:text-slate-200">At pickup, verify the adult&apos;s identity and matching security code before releasing the child.</p>
                <Button
                  className="mt-4 min-h-12 w-full"
                  onClick={teacherCheckIn}
                  disabled={
                    checkinBusy ||
                    (linkedParentUserId && familyMemberId
                      ? false
                      : !childName.trim() ||
                        !guardianName.trim() ||
                        !pickupName.trim() ||
                        !pickupPhone.trim())
                  }
                >
                  {checkinBusy ? "Checking in…" : "Check in child"}
                </Button>
                {lastCheckin && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="font-bold">Check-in complete: {lastCheckin.childName}</p><p className="mt-1 text-sm">Pickup code: <strong>{lastCheckin.securityCode}</strong></p><p className="mt-1 text-xs">Share this code privately with the authorized guardian. Do not display it on a public screen.</p></div>}
              </Card>
              <Card><h3 className="text-lg font-bold text-night-900 dark:text-white">3. Manage today's rooms</h3><p className="mt-2 text-sm text-night-600 dark:text-slate-200">{data.roster.length} children currently checked in for {service}.</p><Button className="mt-3" variant="secondary" onClick={() => setTab("roster")}>Open live room roster</Button></Card>
            </div>
          )}
          {tab === "roster" && (
            <div className="space-y-6">
              {data.roster.some((e) => e.hasAllergyAlert || e.hasMedicalAlert) && (
                <Card className="border-amber-200 bg-amber-50">
                  <h2 className="font-display text-lg font-semibold text-amber-950">
                    Safety alerts active
                  </h2>
                  <p className="mt-1 text-sm text-amber-900">
                    Review allergy and medical flags before releasing a child. Pickup requires the parent security
                    code; verify identity against authorized pickup on the roster.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-950">
                    {[...data.roster]
                      .filter((e) => e.hasAllergyAlert || e.hasMedicalAlert)
                      .map((entry) => (
                        <li key={entry.id}>
                          <span className="font-semibold">{entry.childName}</span> ({entry.ageGroup})
                          {entry.hasAllergyAlert && ` — Allergy: ${entry.allergies}`}
                          {entry.hasMedicalAlert && ` — Medical: ${entry.medicalNotes}`}
                        </li>
                      ))}
                  </ul>
                </Card>
              )}

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
                <p className="mt-2 text-sm leading-6 text-night-700 dark:text-slate-200">
                  For each child: request a guardian, call directly, or alert your ministry lead. App alerts are
                  not proof of receipt. For emergencies, follow the church safety plan and call 911 when
                  appropriate.
                </p>
                {data.roster.length === 0 ? (
                  <p className="mt-3 text-sm text-night-500">No children checked in for this service.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {[...data.roster]
                      .sort((a, b) => {
                        const score = (e: (typeof data.roster)[number]) =>
                          (e.hasMedicalAlert ? 2 : 0) + (e.hasAllergyAlert ? 1 : 0);
                        return score(b) - score(a);
                      })
                      .map((entry) => (
                      <li
                        key={entry.id}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          entry.hasMedicalAlert
                            ? "border-red-200 bg-red-50/80"
                            : entry.hasAllergyAlert
                              ? "border-amber-200 bg-amber-50/80"
                              : "border-night-900/5 bg-sand-50"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-night-900">{entry.childName}</p>
                            <p className="text-night-600">
                              {entry.ageGroup} · Parent: {entry.parentName}
                            </p>
                            <p className="text-xs text-night-500">Pickup code is private. Verify it at the pickup station.</p>
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
                            {entry.parentUserId && <div className="flex flex-wrap gap-2">
                              <Button variant="secondary" disabled={alertingId === entry.id} onClick={() => void messageParent(entry, "Please come to the Shanah Kids check-in desk when you can.")}>Request parent</Button>
                              <Button variant="secondary" disabled={alertingId === entry.id} onClick={() => void messageParent(entry, "Please contact the Shanah Kids teacher immediately.")}>Urgent parent alert</Button>
                            </div>}
                            <Button variant="secondary" disabled={alertingId === entry.id} onClick={() => void escalateToLead(entry)}>Alert ministry lead</Button>
                            {entry.authorizedPickup?.[0]?.phone && <a className="inline-flex min-h-10 items-center rounded-xl border border-night-900/15 px-3 py-2 font-semibold text-night-900" href={`tel:${entry.authorizedPickup[0].phone.replace(/[^+0-9]/g, "")}`}>Call guardian</a>}
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
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-sky-300">Shanah Kids · Secure release</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-night-900 dark:text-white">Pickup verification</h2>
              <p className="mt-2 text-sm text-night-600">
                Enter the security code from the parent label before releasing a child. Match the adult to the parent
                name and authorized pickup list on the roster — code alone is not enough if you do not recognize them.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={pickupId}
                  onChange={(event) => { setPickupId(event.target.value); setPickupAdultConfirmed(false); setSecurityCode(""); }}
                  aria-label="Select checked-in child"
                  className="min-h-12 rounded-xl border border-night-900/20 bg-sand-50 px-4 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select checked-in child</option>
                  {data.roster.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.childName} · {entry.ageGroup}
                    </option>
                  ))}
                </select>
                <input
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value)}
                  placeholder="Enter guardian pickup code"
                  autoComplete="off"
                  aria-label="Guardian pickup code"
                  className="min-h-12 rounded-xl border border-night-900/20 bg-sand-50 px-4 py-3 text-base text-night-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              {pickupId && (() => {
                const selected = data.roster.find((entry) => entry.id === pickupId);
                return selected ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                    <p className="font-bold">Check the adult against approved pickup contacts</p>
                    <p className="mt-2">Guardian: {selected.parentName}</p>
                    <p className="mt-1">Authorized pickup: {selected.authorizedPickup?.length ? selected.authorizedPickup.map((person) => person.name).join(", ") : "No authorized pickup contacts listed — contact ministry leadership."}</p>
                    <label className="mt-4 flex min-h-12 items-start gap-3 rounded-xl bg-white/80 p-3 dark:bg-slate-900">
                      <input type="checkbox" checked={pickupAdultConfirmed} onChange={(event) => setPickupAdultConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
                      <span className="font-semibold">I checked this adult's identity in person and confirmed they are authorized to collect this child.</span>
                    </label>
                  </div>
                ) : null;
              })()}
              <Button className="mt-4 min-h-12 w-full" onClick={verifyPickup} disabled={pickupBusy || !pickupId || !securityCode.trim() || !pickupAdultConfirmed || !(data.roster.find((entry) => entry.id === pickupId)?.authorizedPickup?.length)}>
                {pickupBusy ? "Verifying pickup…" : "Verify and complete pickup"}
              </Button>
              <p className="mt-3 text-xs leading-5 text-night-600 dark:text-slate-300">If the adult is not on the authorized pickup list, stop the release and contact the ministry leader. Never rely on the code alone.</p>
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
                  <input
                    value={lessonMemoryVerse}
                    onChange={(event) => setLessonMemoryVerse(event.target.value)}
                    placeholder="Memory verse"
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  />
                  <input
                    value={lessonBibleStory}
                    onChange={(event) => setLessonBibleStory(event.target.value)}
                    placeholder="Bible story / passage"
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
                  />
                  <textarea
                    value={lessonObjectives}
                    onChange={(event) => setLessonObjectives(event.target.value)}
                    placeholder="Teaching objectives"
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm"
                  />
                  <textarea
                    value={lessonContent}
                    onChange={(event) => setLessonContent(event.target.value)}
                    placeholder="Preparation checklist (one item per line)"
                    rows={5}
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm"
                  />
                  <textarea
                    value={lessonActivities}
                    onChange={(event) => setLessonActivities(event.target.value)}
                    placeholder="Games, crafts, and activities"
                    rows={4}
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 p-3 text-sm"
                  />
                  <input
                    value={lessonMaterialsUrl}
                    onChange={(event) => setLessonMaterialsUrl(event.target.value)}
                    placeholder="Downloadable materials link (optional)"
                    className="mt-3 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm"
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
                        {lesson.memoryVerse && (
                          <p className="mt-2 text-night-700">Memory verse: {lesson.memoryVerse}</p>
                        )}
                        {lesson.curriculum?.bibleStory && (
                          <p className="mt-2 text-night-700">{lesson.curriculum.bibleStory}</p>
                        )}
                        {lesson.content && (
                          <p className="mt-2 whitespace-pre-wrap text-night-700">{lesson.content}</p>
                        )}
                        {lesson.materialsUrl && (
                          <a
                            href={lesson.materialsUrl}
                            className="mt-2 inline-block text-sm font-semibold text-blue-700 underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download teaching materials
                          </a>
                        )}
                        <KidsLessonCompletionButton
                          lesson={lesson}
                          service={service}
                          serviceDate={data.serviceDate ?? data.weekStarting}
                          weekStarting={data.weekStarting}
                          ageGroup={lesson.ageGroup}
                          completions={data.completions ?? []}
                          onComplete={() => void completeLesson(lesson, lesson.ageGroup)}
                        />
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
