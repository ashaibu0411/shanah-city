import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ChoirSongSuggestion,
  ChoirSongSuggestionComment,
  ChoirSongSuggestionStatusChange,
  ChoirSongSuggestionStore,
  ChoirSongSuggestionSupport,
} from "@/lib/choir-song-suggestion-types";

const FILE = path.join(process.cwd(), "data", "choir-song-suggestions.json");

const EMPTY: ChoirSongSuggestionStore = {
  suggestions: [],
  supports: [],
  comments: [],
  statusHistory: [],
  guidelinesMarkdown: null,
};

async function readStore(): Promise<ChoirSongSuggestionStore> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ChoirSongSuggestionStore>;
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      supports: Array.isArray(parsed.supports) ? parsed.supports : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      statusHistory: Array.isArray(parsed.statusHistory) ? parsed.statusHistory : [],
      guidelinesMarkdown:
        typeof parsed.guidelinesMarkdown === "string" ? parsed.guidelinesMarkdown : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(store: ChoirSongSuggestionStore) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export async function listChoirSongSuggestionsJson(groupId: string) {
  const store = await readStore();
  return store.suggestions
    .filter((row) => row.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getChoirSongSuggestionJson(groupId: string, id: string) {
  const store = await readStore();
  return store.suggestions.find((row) => row.groupId === groupId && row.id === id) ?? null;
}

export async function upsertChoirSongSuggestionJson(suggestion: ChoirSongSuggestion) {
  const store = await readStore();
  const index = store.suggestions.findIndex((row) => row.id === suggestion.id);
  if (index >= 0) {
    store.suggestions[index] = suggestion;
  } else {
    store.suggestions.push(suggestion);
  }
  await writeStore(store);
  return suggestion;
}

export async function listChoirSongSuggestionSupportsJson(suggestionId?: string) {
  const store = await readStore();
  if (!suggestionId) return store.supports;
  return store.supports.filter((row) => row.suggestionId === suggestionId);
}

export async function toggleChoirSongSuggestionSupportJson(suggestionId: string, userId: string) {
  const store = await readStore();
  const index = store.supports.findIndex(
    (row) => row.suggestionId === suggestionId && row.userId === userId,
  );
  let supported = false;
  if (index >= 0) {
    store.supports.splice(index, 1);
    supported = false;
  } else {
    store.supports.push({
      suggestionId,
      userId,
      createdAt: new Date().toISOString(),
    });
    supported = true;
  }
  await writeStore(store);
  const count = store.supports.filter((row) => row.suggestionId === suggestionId).length;
  return { supported, supportCount: count };
}

export async function listChoirSongSuggestionCommentsJson(suggestionId: string) {
  const store = await readStore();
  return store.comments
    .filter((row) => row.suggestionId === suggestionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addChoirSongSuggestionCommentJson(
  input: Omit<ChoirSongSuggestionComment, "id" | "createdAt" | "updatedAt">,
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const comment: ChoirSongSuggestionComment = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.comments.push(comment);
  await writeStore(store);
  return comment;
}

export async function updateChoirSongSuggestionCommentJson(
  commentId: string,
  userId: string,
  body: string,
) {
  const store = await readStore();
  const index = store.comments.findIndex((row) => row.id === commentId && row.userId === userId);
  if (index < 0) return null;
  store.comments[index] = {
    ...store.comments[index],
    body,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.comments[index];
}

export async function deleteChoirSongSuggestionCommentJson(commentId: string, userId: string, isModerator: boolean) {
  const store = await readStore();
  const index = store.comments.findIndex((row) => {
    if (row.id !== commentId) return false;
    if (isModerator) return true;
    return row.userId === userId;
  });
  if (index < 0) return false;
  store.comments.splice(index, 1);
  await writeStore(store);
  return true;
}

export async function appendChoirSongSuggestionStatusJson(change: Omit<ChoirSongSuggestionStatusChange, "id">) {
  const store = await readStore();
  const record: ChoirSongSuggestionStatusChange = { ...change, id: randomUUID() };
  store.statusHistory.push(record);
  await writeStore(store);
  return record;
}

export async function listChoirSongSuggestionStatusHistoryJson(suggestionId: string) {
  const store = await readStore();
  return store.statusHistory
    .filter((row) => row.suggestionId === suggestionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getChoirSongSuggestionGuidelinesJson() {
  const store = await readStore();
  return store.guidelinesMarkdown;
}

export async function saveChoirSongSuggestionGuidelinesJson(markdown: string) {
  const store = await readStore();
  store.guidelinesMarkdown = markdown;
  await writeStore(store);
  return markdown;
}
