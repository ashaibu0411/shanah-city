/** Licenses allowed for the free worship story music library (strict). */
export type StoryMusicFreeLicenseClass =
  | "cc0"
  | "cc-by"
  | "public-domain"
  | "rejected";

export type StoryMusicFreeLicenseEvaluation = {
  allowed: boolean;
  licenseClass: StoryMusicFreeLicenseClass;
  licenseSlug: string;
  licenseUrl: string;
  rejectionReason?: string;
  requiresAttribution: boolean;
};

const CC0_PATTERNS = [
  /creativecommons\.org\/publicdomain\/zero\/1\.0/i,
  /creativecommons\.org\/publicdomain\/mark\/1\.0/i,
  /^cc0$/i,
  /public.?domain/i,
];

const CC_BY_PATTERNS = [
  /creativecommons\.org\/licenses\/by\/[\d.]+/i,
  /^by$/i,
];

const REJECT_PATTERNS = [
  /creativecommons\.org\/licenses\/by-nc/i,
  /creativecommons\.org\/licenses\/by-nd/i,
  /creativecommons\.org\/licenses\/by-sa/i,
  /all.?rights.?reserved/i,
  /copyright/i,
];

export function normalizeLicenseSlug(raw: string | undefined | null): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function evaluateStoryMusicFreeLicense(input: {
  license?: string | null;
  licenseUrl?: string | null;
}): StoryMusicFreeLicenseEvaluation {
  const license = normalizeLicenseSlug(input.license);
  const licenseUrl = (input.licenseUrl ?? "").trim();
  const combined = `${license} ${licenseUrl}`.toLowerCase();

  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        allowed: false,
        licenseClass: "rejected",
        licenseSlug: license || "unknown",
        licenseUrl: licenseUrl || "",
        rejectionReason: "License is restricted (NC, ND, SA, or non-open).",
        requiresAttribution: false,
      };
    }
  }

  if (CC0_PATTERNS.some((p) => p.test(combined)) || license === "cc0" || license === "pdm") {
    return {
      allowed: true,
      licenseClass: "cc0",
      licenseSlug: license || "cc0",
      licenseUrl: licenseUrl || "https://creativecommons.org/publicdomain/zero/1.0/",
      requiresAttribution: false,
    };
  }

  if (CC_BY_PATTERNS.some((p) => p.test(combined)) || license === "by" || license === "cc-by") {
    return {
      allowed: true,
      licenseClass: "cc-by",
      licenseSlug: license || "by",
      licenseUrl: licenseUrl || "https://creativecommons.org/licenses/by/4.0/",
      requiresAttribution: true,
    };
  }

  return {
    allowed: false,
    licenseClass: "rejected",
    licenseSlug: license || "unknown",
    licenseUrl,
    rejectionReason: "License is not verified CC0, CC BY, or public domain.",
    requiresAttribution: false,
  };
}

export function buildCcByAttribution(input: {
  title: string;
  artist: string;
  sourceUrl: string;
  licenseUrl: string;
}) {
  const title = input.title.trim() || "Untitled";
  const artist = input.artist.trim() || "Unknown creator";
  return `${title} by ${artist} — ${input.sourceUrl} (${input.licenseUrl})`;
}
