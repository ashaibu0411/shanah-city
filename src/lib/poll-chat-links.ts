const POLL_MARKER = /\[\[poll:([a-zA-Z0-9_-]+)\]\]/g;

export function buildPollGroupChatContent(pollId: string, question: string) {
  const trimmed = question.trim();
  return `📊 Poll: ${trimmed}\n\nTap the card below to vote — your input helps the team decide.\n[[poll:${pollId}]]`;
}

export function extractPollIdFromChatContent(text: string): string | null {
  const match = text.match(/\[\[poll:([a-zA-Z0-9_-]+)\]\]/);
  return match?.[1] ?? null;
}

export function stripPollMarkerFromChatContent(text: string) {
  return text.replace(POLL_MARKER, "").trim();
}

export function groupPollDeepLink(groupId: string, pollId: string) {
  return `/groups/${encodeURIComponent(groupId)}?polls=1&poll=${encodeURIComponent(pollId)}`;
}
