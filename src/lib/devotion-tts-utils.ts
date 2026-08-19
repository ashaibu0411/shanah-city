export const DEVOTION_TTS_VOICE_KEY = "devotion-tts-voice-uri";
export const DEVOTION_TTS_RATE_KEY = "devotion-tts-rate";

export const DEVOTION_TTS_SPEED_OPTIONS = [
  { value: 0.65, label: "Very slow" },
  { value: 0.78, label: "Slow" },
  { value: 0.92, label: "Normal" },
] as const;

export const DEFAULT_DEVOTION_TTS_RATE = DEVOTION_TTS_SPEED_OPTIONS[1].value;

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

function voiceScore(voice: SpeechSynthesisVoice) {
  let score = 0;
  if (voice.localService) score += 8;
  if (voice.lang.startsWith("en")) score += 6;
  if (voice.lang === "en-US") score += 4;
  if (/natural|premium|enhanced|neural|google|samantha|zira|david|karen|daniel|aria|jenny|guy/i.test(voice.name)) {
    score += 5;
  }
  if (/female|woman|samantha|zira|karen|aria|jenny/i.test(voice.name)) score += 1;
  return score;
}

export function sortDevotionTtsVoices(voices: SpeechSynthesisVoice[]) {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const list = english.length > 0 ? english : voices;
  return [...list].sort(
    (left, right) =>
      voiceScore(right) - voiceScore(left) || left.name.localeCompare(right.name),
  );
}

export function pickDefaultDevotionVoice(voices: SpeechSynthesisVoice[]) {
  const sorted = sortDevotionTtsVoices(voices);
  const storedUri = getStoredDevotionTtsVoiceUri();
  if (storedUri) {
    const stored = sorted.find((voice) => voice.voiceURI === storedUri);
    if (stored) return stored;
  }
  return sorted[0] ?? null;
}

export function loadDevotionTtsVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([] as SpeechSynthesisVoice[]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(sortDevotionTtsVoices(existing));
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(sortDevotionTtsVoices(window.speechSynthesis.getVoices()));
    };

    window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    window.setTimeout(finish, 500);
  });
}
