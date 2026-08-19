export const DEVOTION_TTS_VOICE_KEY = "devotion-tts-voice-uri";
export const DEVOTION_TTS_RATE_KEY = "devotion-tts-rate";

export const DEVOTION_TTS_SPEED_OPTIONS = [
  { value: 0.65, label: "Very slow" },
  { value: 0.78, label: "Slow" },
  { value: 0.92, label: "Normal" },
] as const;

export const DEFAULT_DEVOTION_TTS_RATE = DEVOTION_TTS_SPEED_OPTIONS[1].value;

export type DevotionTtsVoiceOption = {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
};

function readStorage(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

export function getStoredDevotionTtsRate() {
  const raw = readStorage(DEVOTION_TTS_RATE_KEY);
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 1.2) {
    return parsed;
  }
  return DEFAULT_DEVOTION_TTS_RATE;
}

export function setStoredDevotionTtsRate(rate: number) {
  writeStorage(DEVOTION_TTS_RATE_KEY, String(rate));
}

export function getStoredDevotionTtsVoiceUri() {
  return readStorage(DEVOTION_TTS_VOICE_KEY);
}

export function setStoredDevotionTtsVoiceUri(voiceUri: string) {
  writeStorage(DEVOTION_TTS_VOICE_KEY, voiceUri);
}

export function toDevotionTtsVoiceOption(voice: SpeechSynthesisVoice): DevotionTtsVoiceOption {
  return {
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
  };
}

export function voiceQualityLabel(voice: Pick<DevotionTtsVoiceOption, "name" | "localService">) {
  const name = voice.name.toLowerCase();
  if (/neural|natural|online|premium|enhanced|wavenet|studio|network/.test(name)) {
    return "Natural";
  }
  if (!voice.localService) return "Online";
  return "Device";
}

export function formatDevotionVoiceLabel(voice: DevotionTtsVoiceOption) {
  return `${voice.name} · ${voiceQualityLabel(voice)} · ${voice.lang}`;
}

export function voiceScore(voice: Pick<DevotionTtsVoiceOption, "name" | "lang" | "localService">) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (lang.startsWith("en")) score += 8;
  if (lang === "en-us" || lang === "en-gb" || lang === "en-au") score += 3;

  // Cloud/neural voices are usually warmer than offline compact voices.
  if (!voice.localService) score += 12;
  if (/neural|natural|online|premium|enhanced|wavenet|studio|network/.test(name)) score += 16;
  if (
    /google|microsoft|samantha|karen|moira|tessa|serena|fiona|daniel|aria|jenny|guy|davis|jane|sara|zira/.test(
      name,
    )
  ) {
    score += 8;
  }
  if (/uk english female|google uk|en-gb/.test(name) || lang === "en-gb") score += 4;
  if (/female|woman/.test(name)) score += 1;

  if (/compact|espeak|pico|robot/.test(name)) score -= 20;
  if (voice.localService && !/neural|natural|enhanced|google|samantha|karen|moira/.test(name)) {
    score -= 3;
  }

  return score;
}

export function sortDevotionTtsVoices<T extends Pick<DevotionTtsVoiceOption, "name" | "lang" | "localService">>(
  voices: T[],
) {
  return [...voices].sort((left, right) => {
    const leftEnglish = left.lang.toLowerCase().startsWith("en") ? 1 : 0;
    const rightEnglish = right.lang.toLowerCase().startsWith("en") ? 1 : 0;
    if (leftEnglish !== rightEnglish) return rightEnglish - leftEnglish;
    return voiceScore(right) - voiceScore(left) || left.name.localeCompare(right.name);
  });
}

export function recommendedDevotionTtsVoices(voices: DevotionTtsVoiceOption[]) {
  const sorted = sortDevotionTtsVoices(voices);
  const english = sorted.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : sorted;
  const strong = pool.filter((voice) => voiceScore(voice) >= 14);
  if (strong.length >= 3) return strong.slice(0, 8);
  return pool.slice(0, Math.min(8, pool.length));
}

export function pickDefaultDevotionVoice(voices: DevotionTtsVoiceOption[]) {
  const sorted = sortDevotionTtsVoices(voices);
  const storedUri = getStoredDevotionTtsVoiceUri();
  if (storedUri) {
    const stored = sorted.find((voice) => voice.voiceURI === storedUri);
    if (stored) return stored;
  }
  return sorted[0] ?? null;
}

export function findSpeechSynthesisVoice(voiceURI: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  return window.speechSynthesis.getVoices().find((voice) => voice.voiceURI === voiceURI) ?? null;
}

export function loadDevotionTtsVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([] as DevotionTtsVoiceOption[]);
  }

  const mapVoices = () =>
    sortDevotionTtsVoices(window.speechSynthesis.getVoices().map(toDevotionTtsVoiceOption));

  const existing = mapVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise<DevotionTtsVoiceOption[]>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(mapVoices());
    };

    window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    window.setTimeout(finish, 800);
  });
}
