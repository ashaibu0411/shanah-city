import type { Devotion } from "@/lib/types";
import { richTextToPlain } from "@/lib/rich-text";

export function buildDevotionListenScript(devotion: Devotion) {
  const verse = richTextToPlain(devotion.verse);
  const content = richTextToPlain(devotion.content);
  const prayer = richTextToPlain(devotion.prayer);
  return [
    devotion.title,
    `From ${devotion.reference}.`,
    verse,
    content,
    "Prayer.",
    prayer,
  ]
    .filter((part) => part.trim())
    .join(" ... ");
}

export function splitDevotionListenChunks(script: string, maxLength = 180) {
  const sentences = script.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
