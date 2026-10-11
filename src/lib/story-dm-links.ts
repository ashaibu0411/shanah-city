const STORY_MARKER = /\[\[story:([a-zA-Z0-9_-]+)\]\]/g;

export function buildStoryDmContent(text: string, statusId: string) {
  const trimmed = text.trim();
  const marker = `[[story:${statusId}]]`;
  if (trimmed.includes(marker)) return trimmed;
  return `${trimmed}\n${marker}`;
}

export function extractStoryIdFromChatContent(text: string): string | null {
  const match = text.match(/\[\[story:([a-zA-Z0-9_-]+)\]\]/);
  return match?.[1] ?? null;
}

export function stripStoryMarkerFromChatContent(text: string) {
  return text.replace(STORY_MARKER, "").trim();
}

export function communityStoryDeepLink(statusId: string) {
  return `/community?story=${encodeURIComponent(statusId)}`;
}
