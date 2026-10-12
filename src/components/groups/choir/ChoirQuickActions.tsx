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
  onMySchedule: () => void;
  rehearsalRoomHref: string | null;
  onWorshipTeam: () => void;
  onWorshipAcademy: () => void;
  onTeamConnect: () => void;
};

export function ChoirQuickActions({
  setlistsHref,
  onMySchedule,
  rehearsalRoomHref,
  onWorshipTeam,
  onWorshipAcademy,
  onTeamConnect,
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
      onClick: onMySchedule,
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
      onClick: onWorshipTeam,
    },
    {
      key: "academy",
      title: "Worship academy",
      subtitle: "Grow your gift",
      icon: <ChoirIconBook />,
      onClick: onWorshipAcademy,
    },
    {
      key: "connect",
      title: "Team connect",
      subtitle: "Chat & announcements",
      icon: <ChoirIconChat />,
      onClick: onTeamConnect,
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
              onClick={tile.onClick}
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
