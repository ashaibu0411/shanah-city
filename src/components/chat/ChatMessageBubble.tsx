"use client";

import { useState } from "react";
import type { ChatMessageReaction } from "@/lib/chat-utils";
import { formatDeletedMessageContent, getChatAttachmentApiUrl } from "@/lib/chat-utils";
import { MessageReactions } from "@/components/chat/MessageReactions";

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

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            mine ? "bg-night-900 text-sand-50" : "bg-sand-100 text-night-800"
          } ${deletedAt ? "italic opacity-70" : ""}`}
        >
          {!mine && senderName && (
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
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-night-900"
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
                    className="max-h-64 rounded-xl object-cover"
                  />
                </a>
              )}
              {displayContent && <p className="whitespace-pre-wrap">{displayContent}</p>}
            </>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] opacity-60">
            <span>{createdAtLabel}</span>
            {editedAt && !deletedAt && <span>· edited</span>}
            {showReadReceipt && mine && !deletedAt && (
              <span>{readAt ? "· Read" : "· Delivered"}</span>
            )}
            {showSeenCount && mine && !deletedAt && typeof seenCount === "number" && seenCount > 0 && (
              <span>· Seen by {seenCount}</span>
            )}
          </div>
        </div>

        {hasActions && (
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setShowActions((current) => !current)}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-night-500 hover:bg-sand-50"
            >
              •••
            </button>
            {showActions && (
              <div className="absolute left-0 z-10 mt-1 min-w-[120px] rounded-xl border border-night-900/10 bg-white py-1 shadow-lg">
                {canEdit && onEdit && (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50"
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
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50"
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

        {!deletedAt && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggle={onToggleReaction}
            compact
          />
        )}
      </div>
    </div>
  );
}
