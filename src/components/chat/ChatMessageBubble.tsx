"use client";

import { useRef, useState } from "react";
import type { ChatMessageReaction } from "@/lib/chat-utils";
import { formatDeletedMessageContent, getChatAttachmentApiUrl } from "@/lib/chat-utils";
import { ChatMessageText } from "@/components/chat/ChatMessageText";
import { ChatMessageReplyQuote } from "@/components/chat/ChatMessageReplyQuote";
import { ChatReactionEmojiPicker } from "@/components/chat/ChatReactionEmojiPicker";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { buildChatMessageReply } from "@/lib/chat-reply-utils";
import type { ChatMessageReply } from "@/lib/chat-reply-types";
import { senderAccentColor } from "@/lib/chat-ui-utils";

type ChatMessageBubbleProps = {
  messageId: string;
  messageSenderId: string;
  messageSenderName: string;
  mine: boolean;
  senderName?: string;
  content: string;
  createdAtLabel: string;
  reactions?: ChatMessageReaction[];
  reply?: ChatMessageReply;
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
  onStartReply?: (reply: ChatMessageReply) => void;
  attachmentUrl?: string;
  attachmentName?: string;
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
  messageId,
  messageSenderId,
  messageSenderName,
  mine,
  senderName,
  content,
  createdAtLabel,
  reactions,
  reply,
  currentUserId,
  onToggleReaction,
  onStartReply,
  attachmentUrl,
  attachmentName,
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
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(content);
  const [actionBusy, setActionBusy] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [selectionExcerpt, setSelectionExcerpt] = useState<string | null>(null);

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

  function openReactionPicker() {
    if (deletedAt || editing) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    setReactionPickerOpen(true);
  }

  function beginReply(excerptOverride?: string) {
    if (!onStartReply || deletedAt) return;
    setShowActions(false);
    setSelectionExcerpt(null);
    window.getSelection()?.removeAllRanges();
    onStartReply(
      buildChatMessageReply({
        messageId,
        senderId: messageSenderId,
        senderName: messageSenderName,
        content,
        deletedAt,
        attachmentName,
        attachmentUrl,
        excerptOverride,
      }),
    );
  }

  function captureSelectionExcerpt() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setSelectionExcerpt(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      setSelectionExcerpt(null);
      return;
    }
    const text = selection.toString().replace(/\s+/g, " ").trim();
    setSelectionExcerpt(text.length >= 2 ? text : null);
  }

  function openActionsMenu() {
    if (!hasActions) return;
    setShowActions(true);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPress() {
    if ((!compact && !whatsapp) || deletedAt) return;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      if (hasActions || !deletedAt) {
        if (hasActions) {
          openActionsMenu();
        } else {
          openReactionPicker();
        }
      }
    }, 480);
  }

  const actionsMenu = showActions && (hasActions || !deletedAt) && (
    <div
      className={`absolute z-10 mt-1 min-w-[120px] rounded-xl border border-night-900/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[var(--color-surface)] ${
        mine ? "right-0" : "left-0"
      }`}
    >
      {canEdit && onEdit && (
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50 dark:text-sand-100 dark:hover:bg-white/5"
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
          className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50 dark:text-sand-100 dark:hover:bg-white/5"
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
      {!deletedAt && onStartReply ? (
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50 dark:text-sand-100 dark:hover:bg-white/5"
          onClick={() => beginReply()}
        >
          Reply
        </button>
      ) : null}
      {!deletedAt ? (
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs font-semibold text-night-700 hover:bg-sand-50 dark:text-sand-100 dark:hover:bg-white/5"
          onClick={() => {
            setShowActions(false);
            openReactionPicker();
          }}
        >
          React
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      id={`chat-msg-${messageId}`}
      className={`flex w-full min-w-0 scroll-mt-24 ${mine ? "justify-end" : "justify-start"} ${compact || whatsapp ? "px-3" : ""}`}
    >
      <div
        className={`min-w-0 ${compact || whatsapp ? "max-w-[82%]" : "max-w-[85%]"} ${mine ? "items-end" : "items-start"} flex flex-col`}
      >
        {compact && !mine && senderName && (
          <p
            className="mb-0.5 px-1 text-[11px] font-semibold text-night-500 dark:text-sand-400"
            style={{ color: senderAccent ?? senderAccentColor(senderName) }}
          >
            {senderName}
          </p>
        )}

        {whatsapp && !mine && senderName && (
          <p
            className="mb-0.5 px-1 text-[12.5px] font-semibold"
            style={{ color: senderAccent ?? "#1f7aec" }}
          >
            {senderName}
          </p>
        )}

        <div className="relative min-w-0 max-w-full">
          <ChatReactionEmojiPicker
            open={reactionPickerOpen}
            onClose={() => setReactionPickerOpen(false)}
            onSelect={onToggleReaction}
            align={mine ? "end" : "start"}
          />

        <div
          className={`relative min-w-0 max-w-full text-sm ${
            whatsapp
              ? `${whatsappRadius} px-2 py-1.5 shadow-sm ${
                  mine ? "messages-hub-bubble-out" : "messages-hub-bubble-in"
                }`
              : compact
              ? mine
                ? "rounded-[22px] rounded-br-md bg-[#3797F0] px-3.5 py-2 text-white shadow-sm"
                : "rounded-[22px] rounded-bl-md bg-[#efefef] px-3.5 py-2 text-[#262626] dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:ring-1 dark:ring-white/10"
              : mine
                ? "rounded-2xl bg-night-900 px-4 py-3 text-sand-50"
                : "rounded-2xl bg-sand-100 px-4 py-3 text-night-800"
          } ${deletedAt ? "italic opacity-70" : "cursor-pointer"}`}
          onContextMenu={(event) => {
            if ((!compact && !whatsapp) || deletedAt) return;
            event.preventDefault();
            if (hasActions) {
              openActionsMenu();
            } else {
              openReactionPicker();
            }
          }}
          onClick={(event) => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            if (deletedAt || editing) return;
            if ((event.target as HTMLElement).closest("a, button, textarea, input")) return;
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) return;
            openReactionPicker();
          }}
          onMouseUp={captureSelectionExcerpt}
          onTouchStart={startLongPress}
          onTouchEnd={(event) => {
            clearLongPressTimer();
            captureSelectionExcerpt();
          }}
          onTouchMove={clearLongPressTimer}
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
            <div ref={contentRef}>
              {reply ? (
                <ChatMessageReplyQuote reply={reply} mine={mine} compact={compact || whatsapp} />
              ) : null}
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
              {displayContent ? (
                <ChatMessageText
                  text={displayContent}
                  className="whitespace-pre-wrap break-words"
                  linkClassName={
                    mine && compact
                      ? "font-semibold text-white underline decoration-white/60 underline-offset-2"
                      : compact
                        ? "font-semibold text-[#00376B] underline decoration-[#00376B]/35 underline-offset-2 dark:text-sky-300 dark:decoration-sky-300/40"
                        : mine
                          ? "font-semibold text-sand-50 underline decoration-sand-50/50 underline-offset-2"
                          : "font-semibold text-night-900 underline decoration-night-900/30 underline-offset-2"
                  }
                />
              ) : null}
            </div>
          )}

          <div
            className={`mt-1 flex flex-wrap items-center gap-1.5 ${
              whatsapp
                ? "justify-end text-[11px] leading-none text-night-500 dark:text-sand-400"
                : compact
                ? "text-[10px] text-night-500"
                : "text-[10px] opacity-60"
            } ${mine && compact ? "justify-end text-white/75" : ""} ${showMeta ? "" : "hidden"}`}
          >
            <span>{createdAtLabel}</span>
            {editedAt && !deletedAt && <span>· edited</span>}
            {showReadReceipt && mine && !deletedAt && whatsapp && (
              <span className={readAt ? "text-sky-600 dark:text-sky-300" : "text-night-500 dark:text-sand-400"}>
                {readAt ? " ✓✓" : " ✓"}
              </span>
            )}
            {showReadReceipt && mine && !deletedAt && !whatsapp && (
              <span>{readAt ? "· Seen" : "· Delivered"}</span>
            )}
            {showSeenCount && mine && !deletedAt && typeof seenCount === "number" && seenCount > 0 && (
              <span>· Seen by {seenCount}</span>
            )}
          </div>

          {compact && actionsMenu}

          {selectionExcerpt && onStartReply && !deletedAt ? (
            <div className={`absolute z-10 ${mine ? "right-0 top-0 -translate-y-full pb-1" : "left-0 top-0 -translate-y-full pb-1"}`}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  beginReply(selectionExcerpt);
                }}
                className="rounded-full bg-night-900 px-3 py-1 text-[11px] font-semibold text-white shadow-md dark:bg-[var(--color-surface)] dark:ring-1 dark:ring-white/15"
              >
                Quote selection
              </button>
            </div>
          ) : null}
        </div>
        </div>

        {hasActions && !compact && (
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
            {actionsMenu}
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
