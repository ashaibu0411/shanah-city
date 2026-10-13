export const GROUP_STORY_AUTHOR_PREFIX = "group:";

export function groupStoryAuthorId(groupId: string) {
  return `${GROUP_STORY_AUTHOR_PREFIX}${groupId}`;
}

export function parseGroupStoryAuthorId(authorId: string): string | null {
  if (!authorId.startsWith(GROUP_STORY_AUTHOR_PREFIX)) return null;
  const groupId = authorId.slice(GROUP_STORY_AUTHOR_PREFIX.length).trim();
  return groupId || null;
}
