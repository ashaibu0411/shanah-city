import type { ArtworkVariant } from "@/lib/content-artwork";
import type { GroupCategory } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";

export type GroupThumbnailInput = {
  id: string;
  name: string;
  category: GroupCategory;
  description?: string;
};

const COLORS = {
  navyDeep: "#111827",
  navyMid: "#1a2332",
  navyLight: "#405578",
  sand50: "#faf8f5",
  sand200: "#e8dfd2",
};

const CATEGORY_THEME: Record<
  GroupCategory,
  { accent: string; accentDark: string; symbol: string }
> = {
  ministry: { accent: "#c4a882", accentDark: "#967652", symbol: "✦" },
  choir: { accent: "#c4b5fd", accentDark: "#7c3aed", symbol: "♪" },
  "small-group": { accent: "#5eead4", accentDark: "#0f766e", symbol: "◉" },
  youth: { accent: "#fcd34d", accentDark: "#d97706", symbol: "☼" },
  other: { accent: "#93c5fd", accentDark: "#2563eb", symbol: "✦" },
};

const VARIANT_SIZE: Record<ArtworkVariant, { width: number; height: number }> = {
  square: { width: 512, height: 512 },
  wide: { width: 960, height: 540 },
  banner: { width: 1200, height: 434 },
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashSeed(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length >= maxLines - 1) {
      const last = current.length > maxChars - 1 ? `${current.slice(0, maxChars - 1)}…` : current;
      lines.push(last);
      return lines.slice(0, maxLines);
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function nameLines(name: string, variant: ArtworkVariant) {
  if (variant === "square") return wrapText(name, 14, 3);
  if (variant === "banner") return wrapText(name, 26, 2);
  return wrapText(name, 22, 2);
}

function tagline(description: string | undefined, variant: ArtworkVariant) {
  const text = description?.trim() || "Shanah City group";
  if (variant === "square") return wrapText(text, 28, 2);
  return wrapText(text, 42, 2);
}

function decorativeCircles(id: string, width: number, height: number) {
  const seed = hashSeed(id);
  const x1 = 70 + (seed % 100);
  const y1 = 50 + ((seed >> 4) % 70);
  const r1 = 52 + ((seed >> 8) % 36);
  const x2 = width - 100 - ((seed >> 12) % 90);
  const y2 = height - 70 - ((seed >> 16) % 90);
  const r2 = 68 + ((seed >> 20) % 44);

  return `
    <circle cx="${x1}" cy="${y1}" r="${r1}" fill="#ffffff" opacity="0.06"/>
    <circle cx="${x2}" cy="${y2}" r="${r2}" fill="#ffffff" opacity="0.04"/>
  `;
}

function renderLines(
  lines: string[],
  x: number,
  startY: number,
  fontSize: number,
  lineHeight: number,
  fill: string,
  weight = "600",
) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + index * lineHeight}" fill="${fill}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="${weight}">${escapeXml(line)}</text>`,
    )
    .join("\n");
}

export function buildGroupThumbnailSvg(
  group: GroupThumbnailInput,
  variant: ArtworkVariant = "square",
) {
  const { width, height } = VARIANT_SIZE[variant];
  const theme = CATEGORY_THEME[group.category];
  const categoryLabel = groupCategoryLabels[group.category].toUpperCase();
  const names = nameLines(group.name, variant);
  const tags = tagline(group.description, variant);
  const uid = group.id.replace(/[^a-zA-Z0-9_-]/g, "") || "group";

  if (variant === "square") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.navyDeep}"/>
      <stop offset="52%" stop-color="${COLORS.navyMid}"/>
      <stop offset="100%" stop-color="${COLORS.navyLight}"/>
    </linearGradient>
    <linearGradient id="accent-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accentDark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  <rect x="0" y="0" width="${width}" height="5" fill="url(#accent-${uid})"/>
  ${decorativeCircles(group.id, width, height)}
  <text x="36" y="48" fill="${theme.accent}" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="3">${escapeXml(categoryLabel)}</text>
  <text x="${width - 40}" y="52" fill="${theme.accent}" font-family="Georgia, serif" font-size="28" text-anchor="end">${theme.symbol}</text>
  ${renderLines(names, 36, 220, 26, 32, COLORS.sand50)}
  ${renderLines(tags, 36, 330, 14, 20, COLORS.sand200, "500")}
</svg>`;
  }

  const titleFontSize = variant === "banner" ? 36 : 40;
  const titleLineHeight = variant === "banner" ? 44 : 48;
  const titleStartY = variant === "banner" ? 210 : 224;
  const paddingX = 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.navyDeep}"/>
      <stop offset="50%" stop-color="${COLORS.navyMid}"/>
      <stop offset="100%" stop-color="${COLORS.navyLight}"/>
    </linearGradient>
    <linearGradient id="accent-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accentDark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  <rect x="0" y="0" width="${width}" height="6" fill="url(#accent-${uid})"/>
  ${decorativeCircles(group.id, width, height)}
  <text x="${paddingX}" y="72" fill="${theme.accent}" font-family="Georgia, serif" font-size="18" letter-spacing="4">SHANAH CITY</text>
  <text x="${paddingX}" y="108" fill="${COLORS.sand200}" font-family="sans-serif" font-size="16" letter-spacing="2">${escapeXml(categoryLabel)}</text>
  ${renderLines(names, paddingX, titleStartY, titleFontSize, titleLineHeight, COLORS.sand50)}
  ${renderLines(tags, paddingX, height - 72, 18, 26, COLORS.sand200, "500")}
  <text x="${width - paddingX}" y="88" fill="${theme.accent}" font-family="Georgia, serif" font-size="42" text-anchor="end">${theme.symbol}</text>
</svg>`;
}

export function buildGenericGroupThumbnailSvg(variant: ArtworkVariant = "square") {
  return buildGroupThumbnailSvg(
    {
      id: "group-placeholder",
      name: "Shanah City Group",
      category: "ministry",
      description: "Groups and ministries",
    },
    variant,
  );
}
