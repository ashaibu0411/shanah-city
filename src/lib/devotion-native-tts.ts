"use client";

import { getNativePlatform, isNativeAppPlatform } from "@/lib/native-app";
import type { DevotionTtsVoiceOption } from "@/lib/devotion-tts-utils";
import { sortDevotionTtsVoices } from "@/lib/devotion-tts-utils";

const nativeVoiceIndexByUri = new Map<string, number>();

export function shouldUseNativeDevotionTts() {
  return isNativeAppPlatform() && getNativePlatform() === "android";
}

async function getTextToSpeechModule() {
  return import("@capacitor-community/text-to-speech");
}

export async function isNativeDevotionTtsAvailable() {
  if (!shouldUseNativeDevotionTts()) return false;

  try {
    const { TextToSpeech } = await getTextToSpeechModule();
    const { voices } = await TextToSpeech.getSupportedVoices();
    if (voices.length > 0) return true;
    const { supported } = await TextToSpeech.isLanguageSupported({ lang: "en-US" });
    return supported;
  } catch {
    return false;
  }
}

export async function loadNativeDevotionTtsVoices(): Promise<DevotionTtsVoiceOption[]> {
  const { TextToSpeech } = await getTextToSpeechModule();
  const { voices } = await TextToSpeech.getSupportedVoices();
  nativeVoiceIndexByUri.clear();

  const mapped = voices.map((voice, index) => {
    const voiceURI = voice.voiceURI || `native-voice-${index}`;
    nativeVoiceIndexByUri.set(voiceURI, index);
    return {
      voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    };
  });

  return sortDevotionTtsVoices(mapped);
}

function resolveNativeVoiceIndex(voiceURI: string) {
  const stored = nativeVoiceIndexByUri.get(voiceURI);
  if (stored !== undefined) return stored;

  const match = voiceURI.match(/^native-voice-(\d+)$/);
  if (match) return Number.parseInt(match[1], 10);

  return undefined;
}

export async function speakNativeDevotionChunk(options: {
  text: string;
  voiceURI: string;
  rate: number;
  queueStrategy: 0 | 1;
}) {
  const { TextToSpeech } = await getTextToSpeechModule();
  const voice = resolveNativeVoiceIndex(options.voiceURI);

  await TextToSpeech.speak({
    text: options.text,
    lang: "en-US",
    rate: Math.min(1.2, Math.max(0.5, options.rate)),
    pitch: 0.98,
    volume: 1,
    ...(voice !== undefined ? { voice } : {}),
    queueStrategy: options.queueStrategy,
  });
}

export async function stopNativeDevotionTts() {
  const { TextToSpeech } = await getTextToSpeechModule();
  await TextToSpeech.stop();
}
