import type { Comment } from "@/lib/member-types";

/** Collect comment id and all reply ids in a flat list. */
export function collectCommentSubtreeIds(flat: Comment[], rootId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const comment of flat) {
    if (!comment.parentId) continue;
    const siblings = childrenByParent.get(comment.parentId) ?? [];
    siblings.push(comment.id);
    childrenByParent.set(comment.parentId, siblings);
  }

  const ids = new Set<string>();
  if (!flat.some((comment) => comment.id === rootId)) {
    return ids;
  }

  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    ids.add(id);
    for (const childId of childrenByParent.get(id) ?? []) {
      stack.push(childId);
    }
  }

  return ids;
}

/** Flat list from the database → top-level comments with nested replies. */
export function nestComments(flat: Comment[]): Comment[] {
  if (flat.length === 0) return [];

  const nodes = new Map<string, Comment>();
  for (const entry of flat) {
    nodes.set(entry.id, { ...entry, replies: [] });
  }

  const roots: Comment[] = [];
  for (const entry of flat) {
    const node = nodes.get(entry.id);
    if (!node) continue;
    if (entry.parentId && nodes.has(entry.parentId)) {
      const parent = nodes.get(entry.parentId)!;
      parent.replies = parent.replies ?? [];
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Count comments including nested replies. */
export function totalCommentCount(comments: Comment[] | undefined): number {
  if (!comments?.length) return 0;
  let total = 0;
  function walk(list: Comment[]) {
    for (const comment of list) {
      total += 1;
      if (comment.replies?.length) walk(comment.replies);
    }
  }
  walk(comments);
  return total;
}

/** Collect every comment id in a nested tree (for batch loads). */
export function collectCommentIds(comments: Comment[]): string[] {
  const ids: string[] = [];
  function walk(list: Comment[]) {
    for (const comment of list) {
      ids.push(comment.id);
      if (comment.replies?.length) walk(comment.replies);
    }
  }
  walk(comments);
  return ids;
}

/** Flatten nested comments (e.g. after nesting) for reaction attachment. */
export function flattenComments(comments: Comment[]): Comment[] {
  const flat: Comment[] = [];
  function walk(list: Comment[]) {
    for (const comment of list) {
      const { replies, ...rest } = comment;
      flat.push(rest);
      if (replies?.length) walk(replies);
    }
  }
  walk(comments);
  return flat;
}
