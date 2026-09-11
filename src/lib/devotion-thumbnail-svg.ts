import type { ArtworkVariant } from "@/lib/content-artwork";

export type DevotionThumbnailInput = {
  id: string;
  title: string;
  reference: string;
  date: string;
};

const COLORS = {
  nightDeep: "#2d2418",
  clayDeep: "#6b2a0f",
  clayMid: "#8b3f28",
  sand50: "#faf7f2",
  sand100: "#f5f1ea",
  sand200: "#ece1cc",
  sand300: "#e8dfd2",
  copperLight: "#d4765a",
  copperDark: "#a84d32",
  goldLight: "#c4a882",
  goldDark: "#967652",
};

const VARIANT_SIZE: Record<ArtworkVariant, { width: number; height: number }> = {
  square: { width: 1024, height: 1024 },
  wide: { width: 1920, height: 1080 },
  banner: { width: 1920, height: 692 },
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

function titleLines(title: string, variant: ArtworkVariant) {
  if (variant === "square") return wrapText(title, 16, 4);
  if (variant === "banner") return wrapText(title, 28, 2);
  return wrapText(title, 24, 3);
}

function decorativeCircles(id: string, width: number, height: number, light = false) {
  const seed = hashSeed(id);
  const x1 = 80 + (seed % 120);
  const y1 = 60 + ((seed >> 4) % 80);
  const r1 = 56 + ((seed >> 8) % 40);
  const x2 = width - 120 - ((seed >> 12) % 100);
  const y2 = height - 80 - ((seed >> 16) % 100);
  const r2 = 72 + ((seed >> 20) % 48);

  if (light) {
    return `
    <circle cx="${x1}" cy="${y1}" r="${r1}" fill="${COLORS.copperLight}" opacity="0.14"/>
    <circle cx="${x2}" cy="${y2}" r="${r2}" fill="${COLORS.goldLight}" opacity="0.18"/>
  `;
  }

  return `
    <circle cx="${x1}" cy="${y1}" r="${r1}" fill="${COLORS.copperLight}" opacity="0.12"/>
    <circle cx="${x2}" cy="${y2}" r="${r2}" fill="${COLORS.goldLight}" opacity="0.08"/>
  `;
}

function coverPalette(id: string) {
  const seed = hashSeed(id);
  const palettes = [
    [COLORS.sand50, COLORS.sand100, COLORS.sand300],
    ["#fffaf5", COLORS.sand50, COLORS.sand200],
    [COLORS.sand100, "#f7efe4", COLORS.sand300],
  ] as const;
  return palettes[seed % palettes.length];
}

function renderTitle(lines: string[], x: number, startY: number, fontSize: number, lineHeight: number) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + index * lineHeight}" fill="${COLORS.sand50}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="600">${escapeXml(line)}</text>`,
    )
    .join("\n");
}

/** Text-free warm cover art for cards and lists (no duplicate titles in the UI). */
export function buildDevotionCoverSvg(
  devotion: DevotionThumbnailInput,
  variant: ArtworkVariant = "square",
) {
  const { width, height } = VARIANT_SIZE[variant];
  const uid = devotion.id.replace(/[^a-zA-Z0-9_-]/g, "") || "devotion";
  const [toneA, toneB, toneC] = coverPalette(devotion.id);
  const seed = hashSeed(devotion.id);
  const glowX = 120 + (seed % (width - 240));
  const glowY = 80 + ((seed >> 6) % (height - 160));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${toneA}"/>
      <stop offset="55%" stop-color="${toneB}"/>
      <stop offset="100%" stop-color="${toneC}"/>
    </linearGradient>
    <radialGradient id="glow-${uid}" cx="0.5" cy="0.5" r="0.65">
      <stop offset="0%" stop-color="${COLORS.copperLight}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${COLORS.copperLight}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${COLORS.copperLight}"/>
      <stop offset="100%" stop-color="${COLORS.goldDark}"/>
    </linearGradient>
    <filter id="grain-${uid}">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.035"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  <rect x="0" y="0" width="${width}" height="${variant === "banner" ? 8 : 6}" fill="url(#accent-${uid})"/>
  <ellipse cx="${glowX}" cy="${glowY}" rx="${width * 0.28}" ry="${height * 0.32}" fill="url(#glow-${uid})"/>
  ${decorativeCircles(devotion.id, width, height, true)}
  <rect width="${width}" height="${height}" filter="url(#grain-${uid})" opacity="0.55"/>
  <text x="${width - 48}" y="56" fill="${COLORS.goldDark}" font-family="Georgia, serif" font-size="22" opacity="0.55" text-anchor="end">✦</text>
</svg>`;
}

export function buildGenericDevotionCoverSvg(variant: ArtworkVariant = "square") {
  return buildDevotionCoverSvg(
    {
      id: "placeholder",
      title: "Daily Devotion",
      reference: "Shanah City",
      date: "",
    },
    variant,
  );
}

export function buildDevotionThumbnailSvg(
  devotion: DevotionThumbnailInput,
  variant: ArtworkVariant = "square",
) {
  const { width, height } = VARIANT_SIZE[variant];
  const lines = titleLines(devotion.title, variant);
  const subtitle = devotion.reference.trim() || devotion.date.trim() || "Daily devotion";
  const uid = devotion.id.replace(/[^a-zA-Z0-9_-]/g, "") || "devotion";

  if (variant === "square") {
    const titleStartY = height - 168;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.nightDeep}"/>
      <stop offset="48%" stop-color="${COLORS.clayDeep}"/>
      <stop offset="100%" stop-color="${COLORS.clayMid}"/>
    </linearGradient>
    <linearGradient id="accent-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.copperLight}"/>
      <stop offset="100%" stop-color="${COLORS.copperDark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  <rect x="0" y="0" width="${width}" height="5" fill="url(#accent-${uid})"/>
  ${decorativeCircles(devotion.id, width, height)}
  <text x="36" y="52" fill="${COLORS.goldLight}" font-family="Georgia, serif" font-size="13" letter-spacing="3.5">DEVOTION</text>
  ${renderTitle(lines, 36, titleStartY, 28, 34)}
  <text x="36" y="${height - 36}" fill="${COLORS.sand200}" font-family="sans-serif" font-size="15">${escapeXml(subtitle)}</text>
  <text x="${width - 40}" y="52" fill="${COLORS.goldLight}" font-family="Georgia, serif" font-size="18" text-anchor="end">✦</text>
</svg>`;
  }

  const titleFontSize = variant === "banner" ? 38 : 42;
  const titleLineHeight = variant === "banner" ? 46 : 50;
  const titleStartY = variant === "banner" ? 210 : 228;
  const paddingX = 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.nightDeep}"/>
      <stop offset="50%" stop-color="${COLORS.clayDeep}"/>
      <stop offset="100%" stop-color="${COLORS.clayMid}"/>
    </linearGradient>
    <linearGradient id="accent-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.copperLight}"/>
      <stop offset="100%" stop-color="${COLORS.copperDark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  <rect x="0" y="0" width="${width}" height="6" fill="url(#accent-${uid})"/>
  ${decorativeCircles(devotion.id, width, height)}
  <text x="${paddingX}" y="72" fill="${COLORS.goldLight}" font-family="Georgia, serif" font-size="18" letter-spacing="4">SHANAH CITY</text>
  <text x="${paddingX}" y="108" fill="${COLORS.sand200}" font-family="sans-serif" font-size="16" letter-spacing="2">DEVOTION</text>
  ${renderTitle(lines, paddingX, titleStartY, titleFontSize, titleLineHeight)}
  <text x="${paddingX}" y="${height - 48}" fill="${COLORS.sand200}" font-family="sans-serif" font-size="20">${escapeXml(subtitle)}</text>
  <text x="${paddingX}" y="${height - 20}" fill="${COLORS.goldLight}" font-family="sans-serif" font-size="15">${escapeXml(devotion.date)}</text>
</svg>`;
}

export function buildGenericDevotionThumbnailSvg(variant: ArtworkVariant = "square") {
  return buildDevotionThumbnailSvg(
    {
      id: "placeholder",
      title: "Daily Devotion",
      reference: "Shanah City",
      date: "",
    },
    variant,
  );
}
