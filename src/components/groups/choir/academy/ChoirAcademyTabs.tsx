"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  choirAcademyAchievementsHref,
  choirAcademyCoursesHref,
  choirAcademyHomeHref,
  choirAcademyMyLearningHref,
} from "@/lib/choir-academy-links";

type ChoirAcademyTabsProps = {
  groupId: string;
};

type TabId = "home" | "my-learning" | "courses" | "achievements";

function resolveActive(pathname: string, groupId: string): TabId {
  const base = choirAcademyHomeHref(groupId);
  if (pathname.startsWith(`${base}/my-learning`)) return "my-learning";
  if (pathname.startsWith(`${base}/courses`)) return "courses";
  if (pathname.startsWith(`${base}/achievements`)) return "achievements";
  if (pathname === base || pathname.startsWith(`${base}/path/`) || pathname.startsWith(`${base}/course/`)) {
    return "home";
  }
  return "home";
}

const TABS: { id: TabId; label: string; href: (groupId: string) => string }[] = [
  { id: "home", label: "Worship Academy", href: choirAcademyHomeHref },
  { id: "my-learning", label: "My Learning", href: choirAcademyMyLearningHref },
  { id: "courses", label: "Courses", href: choirAcademyCoursesHref },
  { id: "achievements", label: "Achievements", href: choirAcademyAchievementsHref },
];

export function ChoirAcademyTabs({ groupId }: ChoirAcademyTabsProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname, groupId);

  return (
    <div className="choir-academy-tabs" role="tablist" aria-label="Worship academy">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href(groupId)}
            role="tab"
            aria-selected={isActive}
            className={`choir-academy-tab ${isActive ? "choir-academy-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
