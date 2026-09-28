"use client";

import type { MentionMember } from "@/lib/mentions";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";

type MentionPickerProps = {
  open: boolean;
  members: MentionMember[];
  highlightIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (member: MentionMember) => void;
  onSelectAll?: () => void;
  allowAll?: boolean;
  loading?: boolean;
  className?: string;
};

export function MentionPicker({
  open,
  members,
  highlightIndex,
  onHighlight,
  onSelect,
  onSelectAll,
  allowAll = false,
  loading = false,
  className = "",
}: MentionPickerProps) {
  if (!open) return null;

  const totalRows = members.length + (allowAll ? 1 : 0);

  return (
    <div
      className={`mention-picker z-20 max-h-52 overflow-y-auto rounded-2xl border border-night-900/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[var(--color-surface)] ${className}`}
      role="listbox"
      aria-label="Tag a member"
    >
      {loading ? (
        <p className="px-3 py-2 text-xs text-night-500 dark:text-sand-400">Loading members…</p>
      ) : null}
      {allowAll && onSelectAll ? (
        <button
          type="button"
          role="option"
          aria-selected={highlightIndex === 0}
          onMouseEnter={() => onHighlight(0)}
          onClick={onSelectAll}
          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
            highlightIndex === 0
              ? "bg-violet-50 dark:bg-violet-500/15"
              : "hover:bg-sand-50 dark:hover:bg-white/5"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-500/25 dark:text-violet-100">
            @
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-night-900 dark:text-sand-100">Everyone</p>
            <p className="text-xs text-night-500 dark:text-sand-400">Notify all members</p>
          </div>
        </button>
      ) : null}
      {members.length === 0 && !loading ? (
        <p className="px-3 py-2 text-xs text-night-500 dark:text-sand-400">No members match.</p>
      ) : null}
      {members.map((member, index) => {
        const rowIndex = allowAll ? index + 1 : index;
        return (
          <button
            key={member.id}
            type="button"
            role="option"
            aria-selected={highlightIndex === rowIndex}
            onMouseEnter={() => onHighlight(rowIndex)}
            onClick={() => onSelect(member)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
              highlightIndex === rowIndex
                ? "bg-violet-50 dark:bg-violet-500/15"
                : "hover:bg-sand-50 dark:hover:bg-white/5"
            }`}
          >
            <CommunityAvatar name={member.name} authorId={member.id} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-night-900 dark:text-sand-100">
                {member.name}
              </p>
              {member.subtitle ? (
                <p className="truncate text-xs text-night-500 dark:text-sand-400">
                  {member.subtitle}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
      {totalRows === 0 && !loading ? (
        <p className="px-3 py-2 text-xs text-night-500 dark:text-sand-400">Type a name after @</p>
      ) : null}
    </div>
  );
}
