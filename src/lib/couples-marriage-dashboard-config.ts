import type { CouplesHubMarriageTileId } from "@/lib/couples-hub-types";
import { couplesMarriageTiles } from "@/lib/couples-hub-routes";

export type CouplesMarriageFeatureVariant =
  | "calendar"
  | "date-night"
  | "love-notes"
  | "check-in"
  | "prayer"
  | "goals"
  | "devotionals"
  | "games";

export type CouplesMarriageFeatureConfig = {
  id: CouplesHubMarriageTileId;
  title: string;
  href: string;
  variant: CouplesMarriageFeatureVariant;
  background: string;
};

const tileById = new Map(couplesMarriageTiles.map((tile) => [tile.id, tile]));

export const COUPLES_MARRIAGE_FEATURE_CARDS: CouplesMarriageFeatureConfig[] = [
  {
    id: "calendar",
    title: "Our Calendar",
    href: tileById.get("calendar")!.href,
    variant: "calendar",
    background: "#E9EDF2",
  },
  {
    id: "date-night",
    title: "Date Night",
    href: tileById.get("date-night")!.href,
    variant: "date-night",
    background: "#F9E8E1",
  },
  {
    id: "love-notes",
    title: "Love Notes",
    href: tileById.get("love-notes")!.href,
    variant: "love-notes",
    background: "#F7DFE5",
  },
  {
    id: "check-in",
    title: "Marriage Check-In",
    href: tileById.get("check-in")!.href,
    variant: "check-in",
    background: "#E6EDF7",
  },
  {
    id: "prayer-journal",
    title: "Prayer Journal",
    href: tileById.get("prayer-journal")!.href,
    variant: "prayer",
    background: "#F7F0DE",
  },
  {
    id: "goals",
    title: "Our Goals",
    href: tileById.get("goals")!.href,
    variant: "goals",
    background: "#FFF0DA",
  },
  {
    id: "devotionals",
    title: "Devotionals",
    href: tileById.get("devotionals")!.href,
    variant: "devotionals",
    background: "#E4F0EC",
  },
  {
    id: "games",
    title: "Couples Games",
    href: tileById.get("games")!.href,
    variant: "games",
    background: "#EEE6F8",
  },
];
