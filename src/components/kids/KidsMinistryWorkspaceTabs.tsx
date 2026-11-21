"use client";

import { useState } from "react";
import type {
  KidsAnnouncement,
  KidsLeaderSnapshot,
  KidsLessonCompletion,
  KidsTeacherAssignment,
  KidsVolunteerProfile,
} from "@/lib/kids-workspace-types";
import type { KidsChildSearchResult } from "@/lib/kids-workspace-types";
import type { KidsLesson, KidsRosterEntry } from "@/lib/kids-types";
import { Button, Card } from "@/components/ui";

export function KidsTeacherHomeTab({
  service,
  todayAssignment,
  myLesson,
  rosterForRoom,
  headcount,
  onOpenCheckIn,
  onOpenRoster,
}: {
  service: string;
  todayAssignment: KidsTeacherAssignment | null;
  myLesson: KidsLesson | null;
  rosterForRoom: KidsRosterEntry[];
  headcount: { ageGroup: string; count: number }[];
  onOpenCheckIn: () => void;
  onOpenRoster: () => void;
}) {
  const roomCount = todayAssignment
    ? headcount.find((room) => room.ageGroup === todayAssignment.ageGroup)?.count ?? 0
    : headcount.reduce((sum, room) => sum + room.count, 0);

  return (
    <div className="space-y-4">
      <Card className="border-[#dfceb0] bg-gradient-to-br from-[#faf5eb] to-white dark:border-slate-600 dark:from-slate-900 dark:to-slate-900">
        <p className="text-xs font-bold uppercase tracking-wider text-[#85643d] dark:text-amber-200">
          Today · {service}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-night-900 dark:text-white">
          {todayAssignment
            ? `Your room: ${todayAssignment.ageGroup}`
            : "Teacher workspace"}
        </h2>
        <p className="mt-2 text-sm text-night-700 dark:text-slate-200">
          {todayAssignment
            ? `Role: ${todayAssignment.role.replaceAll("_", " ")} · ${todayAssignment.status.replaceAll("_", " ")}`
            : "No classroom assignment for today yet. Leaders can assign you under Team."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="In your room" value={String(roomCount)} />
          <StatCard label="On roster" value={String(rosterForRoom.length)} />
          <StatCard
            label="Lesson"
            value={myLesson?.status === "published" ? "Ready" : "Pending"}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="min-h-12 flex-1 sm:flex-none" onClick={onOpenCheckIn}>
            Quick check-in
          </Button>
          <Button variant="secondary" className="min-h-12" onClick={onOpenRoster}>
            Open roster
          </Button>
        </div>
      </Card>

      {myLesson && (
        <Card>
          <h3 className="text-lg font-bold text-night-900 dark:text-white">Today&apos;s lesson</h3>
          <p className="mt-1 font-semibold text-night-800 dark:text-slate-100">{myLesson.title}</p>
          {myLesson.memoryVerse && (
            <p className="mt-2 text-sm text-night-700 dark:text-slate-200">
              Memory verse: {myLesson.memoryVerse}
            </p>
          )}
          {myLesson.curriculum?.bibleStory && (
            <p className="mt-2 text-sm text-night-600 dark:text-slate-300">
              {myLesson.curriculum.bibleStory}
            </p>
          )}
          {myLesson.curriculum?.preparationChecklist && myLesson.curriculum.preparationChecklist.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-slate-200">
              {myLesson.curriculum.preparationChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e4d4b9] bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
      <p className="text-xs font-semibold text-night-600 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-bold text-night-900 dark:text-white">{value}</p>
    </div>
  );
}

export function KidsRegisteredChildPicker({
  letter,
  results,
  onSelect,
}: {
  letter: string;
  results: KidsChildSearchResult[];
  onSelect: (child: KidsChildSearchResult) => void;
}) {
  if (letter.trim().length < 1) return null;
  if (!results.length) {
    return (
      <p className="mt-2 text-sm text-night-500">
        No registered children starting with “{letter.trim().toUpperCase()}”. You can still add a guest
        below.
      </p>
    );
  }
  return (
    <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
      {results.map((entry) => (
        <button
          key={entry.familyMemberId}
          type="button"
          onClick={() => onSelect(entry)}
          className="block w-full rounded-xl border border-night-900/10 bg-sand-50 px-4 py-3 text-left text-sm hover:bg-sand-100 dark:border-slate-600 dark:bg-slate-800"
        >
          <span className="block font-semibold text-night-900 dark:text-white">{entry.childName}</span>
          <span className="text-xs text-night-600 dark:text-slate-300">
            {entry.parentName}
            {entry.suggestedAgeGroup ? ` · ${entry.suggestedAgeGroup}` : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

export function KidsTeamTab({
  assignments,
  myUserId,
  canManage,
  ageGroups,
  service,
  serviceDate,
  onConfirm,
  onRequestReplacement,
  onAssign,
}: {
  assignments: KidsTeacherAssignment[];
  myUserId: string;
  canManage: boolean;
  ageGroups: string[];
  service: string;
  serviceDate: string;
  onConfirm: (id: string) => void;
  onRequestReplacement: (id: string) => void;
  onAssign: (payload: { userId: string; ageGroup: string; role: string }) => void;
}) {
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoom, setAssignRoom] = useState(ageGroups[0] ?? "");
  const [assignRole, setAssignRole] = useState("teacher");
  const mine = assignments.filter((row) => row.userId === myUserId);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-bold text-night-900 dark:text-white">My schedule</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-night-600">No assignments on {serviceDate}.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mine.map((row) => (
              <li key={row.id} className="rounded-xl bg-sand-50 px-4 py-3 text-sm dark:bg-slate-800">
                <p className="font-semibold">
                  {row.ageGroup} · {row.service}
                </p>
                <p className="text-night-600 dark:text-slate-300 capitalize">
                  {row.role} · {row.status.replaceAll("_", " ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.status === "pending" && (
                    <Button variant="secondary" onClick={() => onConfirm(row.id)}>
                      Confirm
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => onRequestReplacement(row.id)}>
                    Need a substitute
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canManage && (
        <Card>
          <h2 className="text-lg font-bold text-night-900 dark:text-white">Assign teachers</h2>
          <p className="mt-1 text-sm text-night-600">Date: {serviceDate} · {service}</p>
          <AssignTeacherForm
            assignUserId={assignUserId}
            setAssignUserId={setAssignUserId}
            assignRoom={assignRoom}
            setAssignRoom={setAssignRoom}
            assignRole={assignRole}
            setAssignRole={setAssignRole}
            ageGroups={ageGroups}
            onAssign={() => {
              if (!assignUserId.trim()) return;
              onAssign({ userId: assignUserId.trim(), ageGroup: assignRoom, role: assignRole });
              setAssignUserId("");
            }}
          />
          <h3 className="mt-6 font-semibold text-night-900 dark:text-white">Coverage today</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {assignments.map((row) => (
              <li key={row.id} className="rounded-lg bg-sand-50 px-3 py-2 dark:bg-slate-800">
                {row.userName} · {row.ageGroup} · {row.role} ({row.status})
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function AssignTeacherForm(props: {
  assignUserId: string;
  setAssignUserId: (value: string) => void;
  assignRoom: string;
  setAssignRoom: (value: string) => void;
  assignRole: string;
  setAssignRole: (value: string) => void;
  ageGroups: string[];
  onAssign: () => void;
}) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        Member user id
        <input
          value={props.assignUserId}
          onChange={(e) => props.setAssignUserId(e.target.value)}
          placeholder="Paste Shanah City user id"
          className="mt-1 block w-full rounded-xl border border-night-900/20 px-3 py-3 text-base"
        />
      </label>
      <label className="text-sm font-semibold">
        Classroom
        <select
          value={props.assignRoom}
          onChange={(e) => props.setAssignRoom(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-night-900/20 px-3 py-3 text-base"
        >
          {props.ageGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        Role
        <select
          value={props.assignRole}
          onChange={(e) => props.setAssignRole(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-night-900/20 px-3 py-3 text-base"
        >
          <option value="teacher">Teacher</option>
          <option value="assistant">Assistant</option>
          <option value="substitute">Substitute</option>
        </select>
      </label>
      <div className="flex items-end">
        <Button className="min-h-12 w-full" onClick={props.onAssign}>
          Assign
        </Button>
      </div>
    </div>
  );
}

export function KidsLeaderTab({ snapshot }: { snapshot: KidsLeaderSnapshot | null }) {
  if (!snapshot) {
    return (
      <Card>
        <p className="text-sm text-night-600">Leader metrics unavailable.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold text-night-900 dark:text-white">Ministry pulse</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Checked in" value={String(snapshot.totalChildrenCheckedIn)} />
          <StatCard label="Teachers today" value={String(snapshot.assignmentsToday)} />
          <StatCard label="Lessons published" value={String(snapshot.publishedLessonsThisWeek)} />
          <StatCard label="Safeguarding gaps" value={String(snapshot.volunteersNeedingSafeguarding)} />
        </div>
      </Card>
      {snapshot.attentionItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <h3 className="font-bold text-amber-950">Needs attention</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {snapshot.attentionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <h3 className="font-semibold text-night-900 dark:text-white">Upcoming assignments</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {snapshot.upcomingAssignments.map((row) => (
            <li key={row.id} className="rounded-lg bg-sand-50 px-3 py-2 dark:bg-slate-800">
              {row.serviceDate} · {row.userName} · {row.ageGroup}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function KidsTrainingTab({
  announcements,
  safeguardingGuideUrl,
  onMarkSafeguarding,
  safeguardingComplete,
  canManage,
  onPublishAnnouncement,
}: {
  announcements: KidsAnnouncement[];
  safeguardingGuideUrl: string;
  onMarkSafeguarding: () => void;
  safeguardingComplete: boolean;
  canManage: boolean;
  onPublishAnnouncement: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-bold text-night-900 dark:text-white">Safeguarding & onboarding</h2>
        <p className="mt-2 text-sm text-night-600 dark:text-slate-200">
          Complete safeguarding training before serving alone in a classroom.
        </p>
        <a
          href={safeguardingGuideUrl}
          className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-night-900 px-4 text-sm font-semibold text-white"
        >
          Open training guide
        </a>
        <Button className="mt-3 min-h-11 w-full sm:w-auto" variant="secondary" onClick={onMarkSafeguarding}>
          {safeguardingComplete ? "Safeguarding marked complete" : "Mark safeguarding complete"}
        </Button>
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-night-900 dark:text-white">Team announcements</h2>
        {announcements.length === 0 ? (
          <p className="mt-2 text-sm text-night-500">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {announcements.map((item) => (
              <li key={item.id} className="rounded-xl bg-sand-50 px-4 py-3 text-sm dark:bg-slate-800">
                <p className="font-semibold text-night-900 dark:text-white">{item.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-night-700 dark:text-slate-200">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <div className="mt-4 space-y-2 border-t border-night-900/10 pt-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full rounded-xl border border-night-900/20 px-3 py-3 text-base"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Message for teachers"
              className="w-full rounded-xl border border-night-900/20 px-3 py-3 text-base"
            />
            <Button
              className="min-h-11"
              disabled={!title.trim() || !body.trim()}
              onClick={() => {
                onPublishAnnouncement(title, body);
                setTitle("");
                setBody("");
              }}
            >
              Publish announcement
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function KidsLessonCompletionButton({
  lesson,
  service,
  serviceDate,
  weekStarting,
  ageGroup,
  completions,
  onComplete,
}: {
  lesson: KidsLesson;
  service: string;
  serviceDate: string;
  weekStarting: string;
  ageGroup: string;
  completions: KidsLessonCompletion[];
  onComplete: () => void;
}) {
  const done = completions.some(
    (row) =>
      row.weekStarting === weekStarting &&
      row.ageGroup === ageGroup &&
      row.service === service &&
      row.serviceDate === serviceDate,
  );
  if (lesson.status !== "published") return null;
  return (
    <Button className="mt-3 min-h-11" variant={done ? "secondary" : undefined} disabled={done} onClick={onComplete}>
      {done ? "Lesson marked complete today" : "Mark lesson taught today"}
    </Button>
  );
}