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
  showMeta?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canReport?: boolean;
  canBlock?: boolean;
  isBlocked?: boolean;
  density?: "default" | "compact" | "whatsapp";
  senderAccent?: string;
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
  showMeta = true,
  canEdit = false,
  canDelete = false,
  canReport = false,
  canBlock = false,
  isBlocked = false,
  density = "default",
  senderAccent,
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
  const whatsapp = density === "whatsapp";

  const whatsappRadius = mine
    ? "rounded-lg rounded-br-none"
    : "rounded-lg rounded-bl-none";

  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} ${compact || whatsapp ? "px-3" : ""}`}
    >
      <div
        className={`${compact || whatsapp ? "max-w-[82%]" : "max-w-[85%]"} ${mine ? "items-end" : "items-start"} flex flex-col`}
      >
        {whatsapp && !mine && senderName && (
          <p
            className="mb-0.5 px-1 text-[12.5px] font-semibold"
            style={{ color: senderAccent ?? "#1f7aec" }}
          >
            {senderName}
          </p>
        )}

        <div
          className={`text-sm ${
            whatsapp
              ? `${whatsappRadius} px-2 py-1.5 shadow-sm ${
                  mine ? "bg-[#d9fdd3] text-[#111b21]" : "bg-white text-[#111b21]"
                }`
              : compact
              ? mine
                ? "rounded-[22px] rounded-br-md bg-[#3797F0] px-3.5 py-2 text-white shadow-sm"
                : "rounded-[22px] rounded-bl-md bg-[#efefef] px-3.5 py-2 text-[#262626]"
              : mine
                ? "rounded-2xl bg-night-900 px-4 py-3 text-sand-50"
                : "rounded-2xl bg-sand-100 px-4 py-3 text-night-800"
          } ${deletedAt ? "italic opacity-70" : ""}`}
        >
          {!mine && senderName && !compact && !whatsapp && (
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

          <div
            className={`mt-1 flex flex-wrap items-center gap-1.5 ${
              whatsapp
                ? "justify-end text-[11px] leading-none text-[#667781]"
                : compact
                ? "text-[10px] text-night-500"
                : "text-[10px] opacity-60"
            } ${mine && compact ? "justify-end text-white/75" : ""} ${showMeta ? "" : "hidden"}`}
          >
            <span>{createdAtLabel}</span>
            {editedAt && !deletedAt && <span>· edited</span>}
            {showReadReceipt && mine && !deletedAt && (
              <span>{readAt ? "· Seen" : "· Delivered"}</span>
            )}
            {showSeenCount && mine && !deletedAt && typeof seenCount === "number" && seenCount > 0 && (
              <span>· Seen by {seenCount}</span>
            )}
          </div>
        </div>

        {hasActions && (
          <div className={`relative ${compact ? "mt-0.5" : "mt-1"}`}>
            <button
              type="button"
              onClick={() => setShowActions((current) => !current)}
              className={`rounded-full font-semibold text-night-500 hover:bg-sand-50 ${
                compact ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
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
