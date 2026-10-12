export type ChoirAcademyPathId =
  | "heart-of-worship"
  | "vocal-excellence"
  | "musicianship"
  | "worship-leadership"
  | "team-discipline"
  | "spiritual-growth";

export type ChoirAcademyPathDefinition = {
  id: ChoirAcademyPathId;
  title: string;
  description: string;
  icon: string;
};

export const CHOIR_ACADEMY_PATHS: ChoirAcademyPathDefinition[] = [
  {
    id: "heart-of-worship",
    title: "Heart of Worship",
    description: "Spiritual foundations",
    icon: "♥",
  },
  {
    id: "vocal-excellence",
    title: "Vocal Excellence",
    description: "Voice & harmony",
    icon: "🎤",
  },
  {
    id: "musicianship",
    title: "Musicianship",
    description: "Skill & arrangements",
    icon: "🎵",
  },
  {
    id: "worship-leadership",
    title: "Worship Leadership",
    description: "Leading with humility",
    icon: "🙌",
  },
  {
    id: "team-discipline",
    title: "Team & Discipline",
    description: "Serving together",
    icon: "👥",
  },
  {
    id: "spiritual-growth",
    title: "Spiritual Growth",
    description: "Prayer & Scripture",
    icon: "📖",
  },
];

export function choirAcademyPathById(pathId: string): ChoirAcademyPathDefinition | null {
  return CHOIR_ACADEMY_PATHS.find((path) => path.id === pathId) ?? null;
}
