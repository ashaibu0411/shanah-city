"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyAchievementView } from "@/lib/choir-academy-types";

type ChoirAcademyAchievementsPageProps = {
  groupId: string;
};

export function ChoirAcademyAchievementsPage({ groupId }: ChoirAcademyAchievementsPageProps) {
  const [achievements, setAchievements] = useState<ChoirAcademyAchievementView[]>([]);
  const [groupChatHref, setGroupChatHref] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=achievements`)
      .then((response) => response.json())
      .then((data) => {
        if (data.payload) {
          setAchievements(data.payload.achievements ?? []);
          setGroupChatHref(data.payload.groupChatHref);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  return (
    <ChoirAcademyShell groupId={groupId} groupChatHref={groupChatHref} title="Achievements" subtitle="Milestones from verified course completions.">
      {loading ? <p className="text-sm text-[var(--choir-muted)]">Loading…</p> : null}
      {!loading && achievements.length === 0 ? (
        <div className="choir-card p-5 text-center">
          <p className="font-bold text-[var(--choir-heading)]">No achievements yet</p>
          <p className="mt-2 text-sm text-[var(--choir-muted)]">
            Complete published academy courses to earn recognition here.
          </p>
          <Link href={`/groups/${encodeURIComponent(groupId)}/academy/courses`} className="choir-setlist-manage-link mt-3 inline-block">
            Browse courses →
          </Link>
        </div>
      ) : null}
      {!loading && achievements.length > 0 ? (
        <ul className="space-y-2">
          {achievements.map((item) => (
            <li key={item.id} className="choir-card p-4">
              <p className="font-bold text-[var(--choir-heading)]">🏆 {item.title}</p>
              <p className="text-sm text-[var(--choir-body)]">{item.description}</p>
              {item.earnedAt ? (
                <p className="mt-1 text-xs text-[var(--choir-muted)]">
                  Earned {new Date(item.earnedAt).toLocaleDateString()}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </ChoirAcademyShell>
  );
}
