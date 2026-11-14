import Link from "next/link";
import {
  ChoirIconBook,
  ChoirIconCalendar,
  ChoirIconChat,
  ChoirIconHeadphones,
  ChoirIconMusic,
  ChoirIconUsers,
} from "@/components/groups/choir/choir-icons";

type ChoirQuickActionsProps = {
  setlistsHref: string;
  myScheduleHref: string;
  recordingsHref: string;
  rehearsalRoomHref: string | null;
  worshipTeamHref: string;
  worshipAcademyHref: string;
  teamConnectHref: string;
};

export function ChoirQuickActions({
  setlistsHref,
  myScheduleHref,
  recordingsHref,
  rehearsalRoomHref,
  worshipTeamHref,
  worshipAcademyHref,
  teamConnectHref,
}: ChoirQuickActionsProps) {
  const tiles = [
    {
      key: "setlists",
      title: "Setlists",
      subtitle: "Songs & arrangements",
      icon: <ChoirIconMusic />,
      href: setlistsHref,
    },
    {
      key: "recordings",
      title: "Recordings",
      subtitle: "Library & uploads",
      icon: <ChoirIconHeadphones />,
      href: recordingsHref,
    },
    {
      key: "schedule",
      title: "My schedule",
      subtitle: "Services & rehearsals",
      icon: <ChoirIconCalendar />,
      href: myScheduleHref,
    },
    {
      key: "rehearsal",
      title: "Rehearsal room",
      subtitle: rehearsalRoomHref ? "Listen & practice" : "Coming soon",
      icon: <ChoirIconHeadphones />,
      href: rehearsalRoomHref,
      disabled: !rehearsalRoomHref,
    },
    {
      key: "team",
      title: "Worship team",
      subtitle: "People & assignments",
      icon: <ChoirIconUsers />,
      href: worshipTeamHref,
    },
    {
      key: "academy",
      title: "Worship academy",
      subtitle: "Grow your gift",
      icon: <ChoirIconBook />,
      href: worshipAcademyHref,
    },
    {
      key: "connect",
      title: "Team connect",
      subtitle: "Chat & announcements",
      icon: <ChoirIconChat />,
      href: teamConnectHref,
    },
  ];

  return (
    <section aria-labelledby="choir-quick-actions-title" className="choir-quick-actions">
      <div className="choir-quick-actions-heading">
        <div>
          <p className="choir-quick-actions-eyebrow">WORSHIP ESSENTIALS</p>
          <h2 id="choir-quick-actions-title" className="choir-quick-actions-title">Your worship space</h2>
        </div>
        <span className="choir-quick-actions-count">7 tools</span>
      </div>
      <div className="choir-quick-actions-grid">
        {tiles.map((tile) => {
          const className = `choir-tile ${tile.key === "connect" ? "choir-tile-featured" : ""} ${tile.disabled ? "opacity-55" : ""}`;
          if (tile.href && !tile.disabled) {
            return (
              <Link key={tile.key} href={tile.href} className={className}>
                <span className="choir-tile-icon" aria-hidden="true">{tile.icon}</span>
                <span className="choir-tile-copy"><span className="choir-tile-title">{tile.title}</span><span className="choir-tile-sub">{tile.subtitle}</span></span>
                <span className="choir-tile-arrow" aria-hidden="true">›</span>
              </Link>
            );
          }
          return (
            <button
              key={tile.key}
              type="button"
              className={className}
              disabled={tile.disabled}
            >
              <span className="choir-tile-icon" aria-hidden="true">{tile.icon}</span>
              <span className="choir-tile-copy"><span className="choir-tile-title">{tile.title}</span><span className="choir-tile-sub">{tile.subtitle}</span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
