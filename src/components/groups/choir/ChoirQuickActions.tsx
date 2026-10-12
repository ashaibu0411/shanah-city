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
  rehearsalRoomHref: string | null;
  worshipTeamHref: string;
  worshipAcademyHref: string;
  teamConnectHref: string;
};

export function ChoirQuickActions({
  setlistsHref,
  myScheduleHref,
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
    <section aria-label="Quick access">
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => {
          const className = `choir-tile ${tile.disabled ? "opacity-55" : ""}`;
          if (tile.href && !tile.disabled) {
            return (
              <Link key={tile.key} href={tile.href} className={className}>
                <span className="choir-tile-icon">{tile.icon}</span>
                <span className="choir-tile-title">{tile.title}</span>
                <span className="choir-tile-sub">{tile.subtitle}</span>
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
              <span className="choir-tile-icon">{tile.icon}</span>
              <span className="choir-tile-title">{tile.title}</span>
              <span className="choir-tile-sub">{tile.subtitle}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
