export type TextToGiveKeyword = {
  keyword: string;
  label: string;
};

export type TextToGiveConfig = {
  number: string;
  displayNumber: string;
  keywords: TextToGiveKeyword[];
  provider?: string;
  note?: string;
};

function envValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

/** Parse "GIVE|General gift,TITHE|Tithe" from env. */
export function parseTextToGiveKeywords(raw: string): TextToGiveKeyword[] {
  if (!raw.trim()) {
    return [{ keyword: "GIVE", label: "General giving" }];
  }

  return raw
    .split(",")
    .map((part) => {
      const [keyword, label] = part.split("|").map((entry) => entry.trim());
      if (!keyword) return null;
      return { keyword: keyword.toUpperCase(), label: label || keyword };
    })
    .filter((entry): entry is TextToGiveKeyword => Boolean(entry));
}

export function formatTextToGiveNumber(number: string) {
  const trimmed = number.trim();
  if (/^\d{5,6}$/.test(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return trimmed;
}

export function smsGiveUrl(number: string, keyword: string) {
  const trimmed = number.trim();
  const body = encodeURIComponent(keyword.toUpperCase());
  if (/^\d{5,6}$/.test(trimmed)) {
    return `sms:${trimmed}?body=${body}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  const target =
    trimmed.startsWith("+") || digits.length === 11
      ? `+${digits.replace(/^\+/, "")}`
      : `+1${digits}`;
  return `sms:${target}?body=${body}`;
}

export function getTextToGiveConfig(): TextToGiveConfig | null {
  const number = envValue("NEXT_PUBLIC_GIVE_TEXT_NUMBER");
  if (!number) return null;

  return {
    number,
    displayNumber: formatTextToGiveNumber(number),
    keywords: parseTextToGiveKeywords(envValue("NEXT_PUBLIC_GIVE_TEXT_KEYWORDS")),
    provider: envValue("NEXT_PUBLIC_GIVE_TEXT_PROVIDER") || undefined,
    note: envValue("NEXT_PUBLIC_GIVE_TEXT_NOTE") || undefined,
  };
}
