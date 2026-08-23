"use client";

import { useState } from "react";
import type { ChatMessageReaction } from "@/lib/chat-utils";
import { formatDeletedMessageContent, getChatAttachmentApiUrl } from "@/lib/chat-utils";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { IconMore } from "@/components/chat/ChatIcons";

type ChatMessageBubbleProps = {
  mine: boolean;
  senderName?: string;
  content: string;
  createdAtLabel: string;
  reactions?: ChatMessageReaction[];
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
  attachmentUrl?: string;
  editedAt?: string;
  deletedAt?: string;
  readAt?: string;
  seenCount?: number;
  showReadReceipt?: boolean;
  showSeenCount?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canReport?: boolean;
  canBlock?: boolean;
  isBlocked?: boolean;
  density?: "default" | "compact";
  onEdit?: (content: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onReport?: () => void;
  onBlock?: () => Promise<void> | void;
};

export function ChatMessageBubble({
  mine,
  senderName,
  content,
  createdAtLabel,
  reactions,
  currentUserId,
  onToggleReaction,
  attachmentUrl,
  editedAt,
  deletedAt,
  readAt,
  seenCount,
  showReadReceipt = false,
  showSeenCount = false,
  canEdit = false,
  canDelete = false,
  canReport = false,
  canBlock = false,
  isBlocked = false,
  density = "default",
  onEdit,
  onDelete,
  onReport,
  onBlock,
}: ChatMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(content);
  const [actionBusy, setActionBusy] = useState(false);

  const displayContent = formatDeletedMessageContent(content, deletedAt);
  const imageSrc = getChatAttachmentApiUrl(attachmentUrl);
  const hasActions =
    !deletedAt &&
    ((canEdit && onEdit) ||
      (canDelete && onDelete) ||
      (canReport && onReport) ||
      (canBlock && onBlock && !isBlocked));

  async function saveEdit() {
    if (!onEdit || !editDraft.trim()) return;
    setActionBusy(true);
    await onEdit(editDraft.trim());
    setActionBusy(false);
    setEditing(false);
  }

  const compact = density === "compact";

  return (
    <div
      className={`group flex ${mine ? "justify-end" : "justify-start"} ${compact ? "px-3" : ""}`}
    >
      <div
        className={`${compact ? "max-w-[78%]" : "max-w-[85%]"} ${mine ? "items-end" : "items-start"} flex flex-col`}
      >
        <div className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
          {hasActions && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowActions((current) => !current)}
                className={`flex items-center justify-center rounded-full text-[#8e8e8e] transition hover:bg-[#fafafa] ${
                  compact
                    ? "h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    : "h-6 w-6"
                }`}
                aria-label="Message actions"
              >
                {compact ? <IconMore className="h-4 w-4" /> : <span className="text-[10px] font-semibold">···</span>}
              </button>
              {showActions && (
                <div
                  className={`absolute z-10 mt-1 min-w-[120px] rounded-xl border border-[#dbdbdb] bg-white py-1 shadow-lg ${
                    mine ? "right-0" : "left-0"
                  }`}
                >
                  {canEdit && onEdit && (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#262626] hover:bg-[#fafafa]"
                      onClick={() => {
                        setShowActions(false);
                        setEditing(true);
                        setEditDraft(content);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        setShowActions(false);
                        if (!window.confirm("Delete this message?")) return;
                        setActionBusy(true);
                        await onDelete();
                        setActionBusy(false);
                      }}
                    >
                      Delete
                    </button>
                  )}
                  {canReport && onReport && (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setShowActions(false);
                        onReport();
                      }}
                    >
                      Report
                    </button>
                  )}
                  {canBlock && onBlock && !isBlocked && (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#262626] hover:bg-[#fafafa]"
                      onClick={async () => {
                        setShowActions(false);
                        setActionBusy(true);
                        await onBlock();
                        setActionBusy(false);
                      }}
                    >
                      Block
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            className={`text-[15px] leading-snug ${
              compact
                ? mine
                  ? "rounded-[22px] bg-[#3797f0] px-3.5 py-2 text-white"
                  : "rounded-[22px] bg-[#efefef] px-3.5 py-2 text-[#262626]"
                : mine
                  ? "rounded-2xl bg-night-900 px-4 py-3 text-sm text-sand-50"
                  : "rounded-2xl bg-sand-100 px-4 py-3 text-sm text-night-800"
            } ${deletedAt ? "italic opacity-70" : ""}`}
          >
            {!mine && senderName && !compact && (
              <p className="mb-1 text-xs font-semibold opacity-70">{senderName}</p>
            )}

            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm text-night-900 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionBusy || !editDraft.trim()}
                    onClick={saveEdit}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      compact ? "bg-white/90 text-[#262626]" : "bg-white text-night-900"
                    }`}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditDraft(content);
                    }}
                    className="rounded-full px-3 py-1 text-xs font-semibold opacity-80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {imageSrc && !deletedAt && (
                  <a href={imageSrc} target="_blank" rel="noreferrer" className="mb-2 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="Shared image"
                      className={`max-h-64 object-cover ${compact ? "rounded-[18px]" : "rounded-xl"}`}
                    />
                  </a>
                )}
                {displayContent && <p className="whitespace-pre-wrap">{displayContent}</p>}
              </>
            )}

            {!compact && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] opacity-60">
                <span>{createdAtLabel}</span>
                {editedAt && !deletedAt && <span>· edited</span>}
                {showReadReceipt && mine && !deletedAt && (
                  <span>{readAt ? "· Seen" : "· Delivered"}</span>
                )}
                {showSeenCount &&
                  mine &&
                  !deletedAt &&
                  typeof seenCount === "number" &&
                  seenCount > 0 && <span>· Seen by {seenCount}</span>}
              </div>
            )}
          </div>
        </div>

        {compact && showReadReceipt && mine && !deletedAt && (
          <p className="mt-0.5 pr-1 text-[11px] text-[#8e8e8e]">
            {readAt ? "Seen" : "Delivered"}
            {editedAt ? " · edited" : ""}
          </p>
        )}

        {compact && !showReadReceipt && editedAt && !deletedAt && (
          <p className="mt-0.5 pr-1 text-[11px] text-[#8e8e8e]">edited</p>
        )}

        {!deletedAt && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggle={onToggleReaction}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}
