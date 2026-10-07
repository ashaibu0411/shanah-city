"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { GroupPremiumSectionLabel, GroupPremiumStackCard } from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import type {
  MinistryHubBiblePlan,
  MinistryHubBibleStudy,
  MinistryHubEngagementSnapshot,
  MinistryHubFaithChallenge,
} from "@/lib/group-ministry-hub-types";

type MemberOption = { id: string; name: string };

type YoungAdultsHubProgramSectionsProps = {
  groupId: string;
  canManage: boolean;
  members: MemberOption[];
  bibleStudy: MinistryHubBibleStudy | null;
  biblePlan: MinistryHubBiblePlan | null;
  planProgress: number[];
  faithChallenge: MinistryHubFaithChallenge | null;
  challengeCheckedIn: boolean;
  engagement?: MinistryHubEngagementSnapshot;
  onReload: () => Promise<void>;
};

function formatReminder(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function YoungAdultsHubProgramSections({
  groupId,
  canManage,
  members,
  bibleStudy,
  biblePlan,
  planProgress,
  faithChallenge,
  challengeCheckedIn,
  engagement,
  onReload,
}: YoungAdultsHubProgramSectionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingStudy, setEditingStudy] = useState(false);
  const [leaderUserId, setLeaderUserId] = useState(bibleStudy?.leaderUserId ?? "");
  const [leaderName, setLeaderName] = useState(bibleStudy?.leaderName ?? "");
  const [topic, setTopic] = useState(bibleStudy?.topic ?? "");
  const [bibleBook, setBibleBook] = useState(bibleStudy?.bibleBook ?? "");
  const [meetingTime, setMeetingTime] = useState(bibleStudy?.meetingTime ?? "");
  const [reminder1Hour, setReminder1Hour] = useState(bibleStudy?.reminder1Hour ?? 9);
  const [reminder2Hour, setReminder2Hour] = useState(bibleStudy?.reminder2Hour ?? 17);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const [planTitle, setPlanTitle] = useState("");
  const [planDaysText, setPlanDaysText] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeBody, setChallengeBody] = useState("");

  async function postHub(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/ministry-hub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, ...body }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Something went wrong.");
      return false;
    }
    await onReload();
    return true;
  }

  function syncStudyFields() {
    setLeaderUserId(bibleStudy?.leaderUserId ?? "");
    setLeaderName(bibleStudy?.leaderName ?? "");
    setTopic(bibleStudy?.topic ?? "");
    setBibleBook(bibleStudy?.bibleBook ?? "");
    setMeetingTime(bibleStudy?.meetingTime ?? "");
    setReminder1Hour(bibleStudy?.reminder1Hour ?? 9);
    setReminder2Hour(bibleStudy?.reminder2Hour ?? 17);
  }

  async function saveStudy() {
    const selected = members.find((member) => member.id === leaderUserId);
    const ok = await postHub({
      action: "bibleStudy",
      leaderUserId: leaderUserId || undefined,
      leaderName: leaderName.trim() || selected?.name || "",
      topic,
      bibleBook,
      meetingTime,
      reminder1Hour,
      reminder1Minute: 0,
      reminder2Hour,
      reminder2Minute: 0,
    });
    if (ok) {
      setEditingStudy(false);
      setMessage("Monday bible study updated. Two push reminders go out automatically.");
    }
  }

  async function sendBroadcast() {
    const ok = await postHub({
      action: "broadcast",
      title: broadcastTitle,
      body: broadcastBody,
    });
    if (ok) {
      setBroadcastTitle("");
      setBroadcastBody("");
      setMessage("Notification sent to all young adults.");
    }
  }

  function parsePlanDaysFromText(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const parts = line.split("|").map((part) => part.trim());
        if (parts.length >= 2) {
          return {
            day: index + 1,
            title: parts[0],
            passage: parts.slice(1).join(" | "),
          };
        }
        const match = line.match(/^(\d+)[.:)\s-]+(.+)$/);
        if (match) {
          return { day: Number(match[1]), title: `Day ${match[1]}`, passage: match[2].trim() };
        }
        return { day: index + 1, title: `Day ${index + 1}`, passage: line };
      });
  }

  async function publishPlan() {
    const ok = await postHub({
      action: "biblePlan",
      title: planTitle,
      days: parsePlanDaysFromText(planDaysText),
    });
    if (ok) {
      setPlanTitle("");
      setPlanDaysText("");
      setMessage("Reading plan published.");
    }
  }

  async function publishChallenge() {
    const ok = await postHub({
      action: "faithChallenge",
      title: challengeTitle,
      body: challengeBody,
    });
    if (ok) {
      setChallengeTitle("");
      setChallengeBody("");
      setMessage("Faith challenge is live for the group.");
    }
  }

  async function togglePlanDay(day: number, completed: boolean) {
    if (!biblePlan) return;
    await postHub({
      action: "planProgress",
      planId: biblePlan.id,
      dayIndex: day,
      completed,
    });
  }

  async function checkInChallenge() {
    if (!faithChallenge) return;
    await postHub({
      action: "challengeCheckIn",
      challengeId: faithChallenge.id,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <GroupPremiumSectionLabel className="mb-2 px-0.5">Monday bible study</GroupPremiumSectionLabel>
        <GroupPremiumStackCard>
          {editingStudy && canManage ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-night-600">
                Leader
                <select
                  value={leaderUserId}
                  onChange={(event) => {
                    const id = event.target.value;
                    setLeaderUserId(id);
                    const member = members.find((entry) => entry.id === id);
                    if (member) setLeaderName(member.name);
                  }}
                  className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Custom name below</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <input
                value={leaderName}
                onChange={(event) => setLeaderName(event.target.value)}
                placeholder="Leader name"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
              />
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Topic (e.g. Faith at work)"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
              />
              <input
                value={bibleBook}
                onChange={(event) => setBibleBook(event.target.value)}
                placeholder="Book or passage (e.g. James 1–2)"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
              />
              <input
                value={meetingTime}
                onChange={(event) => setMeetingTime(event.target.value)}
                placeholder="Time (e.g. 7:00 PM)"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-night-600">
                  Reminder 1 (hour, 24h)
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={reminder1Hour}
                    onChange={(event) => setReminder1Hour(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-semibold text-night-600">
                  Reminder 2 (hour, 24h)
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={reminder2Hour}
                    onChange={(event) => setReminder2Hour(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <p className="text-xs text-night-500">
                Denver time · defaults {formatReminder(9, 0)} and {formatReminder(17, 0)} each Monday.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void saveStudy()}>
                  {busy ? "Saving…" : "Save study"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingStudy(false);
                    syncStudyFields();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : bibleStudy ? (
            <>
              <p className={groupsPremium.cardTitle}>Every Monday</p>
              <p className="mt-1 text-sm text-night-800">
                <strong>{bibleStudy.leaderName}</strong> leads <strong>{bibleStudy.bibleBook}</strong>
                {bibleStudy.topic ? ` — ${bibleStudy.topic}` : ""}
                {bibleStudy.meetingTime ? ` · ${bibleStudy.meetingTime}` : ""}
              </p>
              <p className="mt-2 text-xs text-night-500">
                Push reminders {formatReminder(bibleStudy.reminder1Hour, bibleStudy.reminder1Minute)} &{" "}
                {formatReminder(bibleStudy.reminder2Hour, bibleStudy.reminder2Minute)} (Denver).
              </p>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => {
                    syncStudyFields();
                    setEditingStudy(true);
                  }}
                  className="mt-3 text-xs font-semibold text-violet-700 underline"
                >
                  Edit study
                </button>
              ) : null}
            </>
          ) : canManage ? (
            <div>
              <p className={groupsPremium.cardMeta}>
                Set who is leading, the book or passage, and automatic Monday reminders.
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => {
                  syncStudyFields();
                  setEditingStudy(true);
                }}
              >
                Set up Monday study
              </Button>
            </div>
          ) : (
            <p className={groupsPremium.cardMeta}>Monday bible study details coming soon.</p>
          )}
        </GroupPremiumStackCard>
      </div>

      {biblePlan ? (
        <div>
          <GroupPremiumSectionLabel className="mb-2 px-0.5">Bible reading plan</GroupPremiumSectionLabel>
          <GroupPremiumStackCard>
            <p className={groupsPremium.cardTitle}>{biblePlan.title}</p>
            <ul className="mt-3 space-y-2">
              {biblePlan.days.map((day) => {
                const done = planProgress.includes(day.day);
                return (
                  <li
                    key={day.day}
                    className="flex items-start gap-3 rounded-xl border border-night-900/6 bg-white/80 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={busy}
                      onChange={(event) => void togglePlanDay(day.day, event.target.checked)}
                      className="mt-1"
                      aria-label={`Mark day ${day.day} complete`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-night-900">{day.title}</p>
                      <p className="text-sm text-night-600">{day.passage}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </GroupPremiumStackCard>
        </div>
      ) : null}

      {faithChallenge ? (
        <div>
          <GroupPremiumSectionLabel className="mb-2 px-0.5">Faith challenge</GroupPremiumSectionLabel>
          <GroupPremiumStackCard>
            <p className={groupsPremium.cardTitle}>{faithChallenge.title}</p>
            <p className="mt-2 text-sm text-night-700">{faithChallenge.body}</p>
            {challengeCheckedIn ? (
              <p className="mt-3 text-sm font-semibold text-emerald-700">You checked in this week.</p>
            ) : (
              <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => void checkInChallenge()}>
                I did this
              </Button>
            )}
          </GroupPremiumStackCard>
        </div>
      ) : null}

      {canManage ? (
        <>
          <div>
            <GroupPremiumSectionLabel className="mb-2 px-0.5">Notify young adults</GroupPremiumSectionLabel>
            <GroupPremiumStackCard className="space-y-3">
              <input
                value={broadcastTitle}
                onChange={(event) => setBroadcastTitle(event.target.value)}
                placeholder="Notification title"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm font-semibold"
              />
              <textarea
                value={broadcastBody}
                onChange={(event) => setBroadcastBody(event.target.value)}
                rows={3}
                placeholder="Message for everyone in Young Adults"
                className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
              />
              <Button
                disabled={busy || !broadcastTitle.trim() || !broadcastBody.trim()}
                onClick={() => void sendBroadcast()}
              >
                Send push to group
              </Button>
            </GroupPremiumStackCard>
          </div>

          {!biblePlan ? (
            <div>
              <GroupPremiumSectionLabel className="mb-2 px-0.5">Publish reading plan</GroupPremiumSectionLabel>
              <GroupPremiumStackCard className="space-y-3">
                <input
                  value={planTitle}
                  onChange={(event) => setPlanTitle(event.target.value)}
                  placeholder="Plan title"
                  className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                />
                <textarea
                  value={planDaysText}
                  onChange={(event) => setPlanDaysText(event.target.value)}
                  rows={5}
                  placeholder="One line per day: Title | Passage&#10;Day 1 | James 1:1-8&#10;Day 2 | James 1:9-18"
                  className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm font-mono"
                />
                <Button disabled={busy || !planTitle.trim() || !planDaysText.trim()} onClick={() => void publishPlan()}>
                  Publish plan
                </Button>
              </GroupPremiumStackCard>
            </div>
          ) : null}

          {!faithChallenge ? (
            <div>
              <GroupPremiumSectionLabel className="mb-2 px-0.5">Faith challenge</GroupPremiumSectionLabel>
              <GroupPremiumStackCard className="space-y-3">
                <input
                  value={challengeTitle}
                  onChange={(event) => setChallengeTitle(event.target.value)}
                  placeholder="Challenge title"
                  className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                />
                <textarea
                  value={challengeBody}
                  onChange={(event) => setChallengeBody(event.target.value)}
                  rows={3}
                  placeholder="What should they do this week?"
                  className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm"
                />
                <Button
                  disabled={busy || !challengeTitle.trim() || !challengeBody.trim()}
                  onClick={() => void publishChallenge()}
                >
                  Post challenge
                </Button>
              </GroupPremiumStackCard>
            </div>
          ) : null}

          {engagement ? (
            <div>
              <GroupPremiumSectionLabel className="mb-2 px-0.5">Engagement snapshot</GroupPremiumSectionLabel>
              <GroupPremiumStackCard>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-night-500">Members</p>
                    <p className="text-lg font-semibold text-night-900">{engagement.memberCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-night-500">Prayer & praise (7d)</p>
                    <p className="text-lg font-semibold text-night-900">{engagement.prayerPraiseLast7Days}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-night-500">Open polls</p>
                    <p className="text-lg font-semibold text-night-900">{engagement.activePollCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-night-500">Challenge check-ins</p>
                    <p className="text-lg font-semibold text-night-900">{engagement.challengeCheckInsThisWeek}</p>
                  </div>
                </div>
              </GroupPremiumStackCard>
            </div>
          ) : null}
        </>
      ) : null}

      {message ? <p className="text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
