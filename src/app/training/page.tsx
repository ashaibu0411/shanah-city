import type { Metadata } from "next";
import Link from "next/link";
import { TrainingPrintButton } from "@/components/training/TrainingPrintButton";

export const metadata: Metadata = {
  title: "Leader Training Handouts",
  description:
    "Printable one-page guides for Shanah City ministry leaders.",
};

const handouts = [
  {
    href: "/training/choir-worship-leader.html",
    title: "Choir / Worship leader",
    description: "Worship planner, setlists, My Part, monthly report",
  },
  {
    href: "/training/finance-team.html",
    title: "Finance team",
    description: "Weekly counts, giving records, thank-yous, monthly report",
  },
  {
    href: "/training/comms-team.html",
    title: "Comms team",
    description: "Comms calendar, ministry requests, promote to app",
  },
  {
    href: "/training/kids-ministry-leader.html",
    title: "Kids ministry leader",
    description: "Check-in, lessons, pickup codes, incidents",
  },
  {
    href: "/training/frontliners-ushering.html",
    title: "FrontLiners & ushering",
    description: "Volunteer check-in, usher schedules, rosters",
  },
  {
    href: "/training/follow-up-guest-care.html",
    title: "Follow-up / guest care",
    description: "Guest queue, 48-hour follow-up, status updates",
  },
  {
    href: "/training/media-team.html",
    title: "Media team",
    description: "Photo upload, live stream, monthly report",
  },
  {
    href: "/training/devotion-writers.html",
    title: "Devotion writers (Team ZNCF)",
    description: "Draft, schedule, publish daily devotions",
  },
  {
    href: "/training/senior-associate-pastor.html",
    title: "Senior / Associate pastor",
    description: "Overview dashboard, review leader reports",
  },
  {
    href: "/training/admin-group.html",
    title: "Admin group",
    description: "Full church operations portal",
  },
  {
    href: "/training/ministry-group-leader.html",
    title: "Ministry group leader (general)",
    description: "Manage team, events, polls, monthly report",
  },
  {
    href: "/training/assistant-group-leader.html",
    title: "Assistant group leader",
    description: "What assistants can and cannot do",
  },
  {
    href: "/training/member-quick-reference.html",
    title: "Member quick reference (for leaders to share)",
    description: "Paths to devotions, groups, give, check-in, etc.",
  },
] as const;

export default function TrainingPage() {
  return (
    <div className="sheet index-page">
      <div className="header">
        <div>
          <div className="brand">Shanah City App</div>
          <h1>Leader training handouts</h1>
          <p className="path">
            Open any handout → <strong>Print</strong> → <strong>Save as PDF</strong>
          </p>
        </div>
      </div>

      <p>
        One-page guides for training ministry leaders. Each sheet explains what the app helps
        their team achieve and where to find the tools.
      </p>

      <div className="card-list">
        {handouts.map((handout) => (
          <Link key={handout.href} href={handout.href}>
            {handout.title}
            <span>{handout.description}</span>
          </Link>
        ))}
      </div>

      <div className="callout no-print">
        <strong>Tip:</strong> Share{" "}
        <Link href="/training">shanah-city.vercel.app/training</Link> so leaders can download
        handouts from any device.
      </div>

      <div className="footer">
        <span>Shanah City · Training materials</span>
        <TrainingPrintButton />
      </div>
    </div>
  );
}
