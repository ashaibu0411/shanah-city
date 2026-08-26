type TimedMessage = {
  senderId: string;
  createdAt: string;
};

export function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function messageGroupMeta<T extends TimedMessage>(
  messages: T[],
  index: number,
): { isFirst: boolean; isLast: boolean; showMeta: boolean } {
  const current = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];
  const sameAsPrev =
    prev &&
    prev.senderId === current.senderId &&
    new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime() < 120_000;
  const sameAsNext =
    next &&
    next.senderId === current.senderId &&
    new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime() < 120_000;

  return {
    isFirst: !sameAsPrev,
    isLast: !sameAsNext,
    showMeta: !sameAsNext,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function chatDateSeparatorLabel(iso: string) {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today - target) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function shouldShowDateSeparator(previousIso: string | undefined, currentIso: string) {
  if (!previousIso) return true;
  return startOfDay(new Date(previousIso)) !== startOfDay(new Date(currentIso));
}

const SENDER_COLORS = [
  "#e542a3",
  "#35cd96",
  "#1f7aec",
  "#fa6535",
  "#986ff0",
  "#00a884",
  "#ffbc38",
  "#5b72ff",
];

export function senderAccentColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return SENDER_COLORS[hash % SENDER_COLORS.length];
}

export function chatInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
