"use client";

import { useRef, useState, useMemo } from "react";
import type { ChatMessageReaction } from "@/lib/chat-utils";
import { formatDeletedMessageContent, getChatAttachmentApiUrl, messageIsUnsent } from "@/lib/chat-utils";
import { ChatMessageText } from "@/components/chat/ChatMessageText";
import { ChatMessageReplyQuote } from "@/components/chat/ChatMessageReplyQuote";
import { ChatReactionEmojiPicker } from "@/components/chat/ChatReactionEmojiPicker";
import { MessageReactions } from "@/components/chat/MessageReactions";
import { buildChatMessageReply } from "@/lib/chat-reply-utils";
import type { ChatMessageReply } from "@/lib/chat-reply-types";
import { senderAccentColor } from "@/lib/chat-ui-utils";
import { chatPremium } from "@/components/chat/chat-premium";
import { ChatYouTubeEmbed } from "@/components/chat/ChatYouTubeEmbed";
import { extractYouTubeVideoIdsFromText } from "@/lib/media-clips-utils";

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
  density?: "default" | "compact" | "whatsapp" | "instagram";
  senderAccent?: string;
  onEdit?: (content: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onReport?: () => void;
  onBlock?: () => Promise<void> | void;
  canMessagePrivately?: boolean;
  onMessagePrivately?: () => void;
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
  canMessagePrivately = false,
  onMessagePrivately,
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
  const unsent = messageIsUnsent(deletedAt, content);
  const imageSrc = getChatAttachmentApiUrl(attachmentUrl);
  const youtubeVideoIds = useMemo(
    () => (unsent ? [] : extractYouTubeVideoIdsFromText(displayContent)),
    [displayContent, unsent],
  );
  const hasActions =
    !unsent &&
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
  const hub = density === "whatsapp" || density === "instagram";

  const hubRadius = mine ? "rounded-[22px] rounded-br-md" : "rounded-[22px] rounded-bl-md";

  function openReactionPicker() {
    if (unsent || editing) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    setReactionPickerOpen(true);
  }

  function beginReply(excerptOverride?: string) {
    if (!onStartReply || unsent) return;
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
    if ((!compact && !hub) || unsent) return;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      if (hasActions || !unsent) {
        if (hasActions) {
          openActionsMenu();
        } else {
          openReactionPicker();
        }
      }
    }, 480);
  }

  const actionsMenu = showActions && (hasActions || !unsent) && (
    <div className={`${chatPremium.contextMenu} ${mine ? "right-0" : "left-0"}`}>
      {canEdit && onEdit && (
        <button
          type="button"
          className={chatPremium.contextMenuItem}
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
          className={chatPremium.contextMenuItemDanger}
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
          className={chatPremium.contextMenuItemDanger}
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
          className={chatPremium.contextMenuItem}
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
      {!unsent && onStartReply ? (
        <button type="button" className={chatPremium.contextMenuItem} onClick={() => beginReply()}>
          Reply
        </button>
      ) : null}
      {canMessagePrivately && onMessagePrivately ? (
        <button
          type="button"
          className={chatPremium.contextMenuItem}
          onClick={() => {
            setShowActions(false);
            onMessagePrivately();
          }}
        >
          Message privately
        </button>
      ) : null}
      {!unsent ? (
        <button
          type="button"
          className={chatPremium.contextMenuItem}
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

  if (unsent) {
    return (
      <div
        id={`chat-msg-${messageId}`}
        className="pointer-events-none h-0 scroll-mt-24 overflow-hidden"
        aria-hidden
      />
    );
  }

  return (
    <div
      id={`chat-msg-${messageId}`}
      className={`flex w-full min-w-0 scroll-mt-24 ${mine ? "justify-end" : "justify-start"} ${compact || hub ? "px-3" : ""}`}
    >
      <div
        className={`min-w-0 ${compact || hub ? "max-w-[82%]" : "max-w-[85%]"} ${mine ? "items-end" : "items-start"} flex flex-col`}
      >
        {compact && !mine && senderName && (
          <p
            className="mb-0.5 px-1 text-[11px] font-semibold text-night-500 dark:text-sand-400"
            style={{ color: senderAccent ?? senderAccentColor(senderName) }}
          >
            {senderName}
          </p>
        )}

        {hub && !mine && senderName && (
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
            hub
              ? `${hubRadius} px-3 py-2 ${
                  mine ? "messages-hub-bubble-out" : "messages-hub-bubble-in"
                } ${(imageSrc || youtubeVideoIds.length > 0) && !unsent ? "!bg-transparent !p-0 !shadow-none" : ""}`
              : compact
              ? mine
                ? chatPremium.bubbleOut
                : chatPremium.bubbleIn
              : mine
                ? "rounded-2xl bg-night-900 px-4 py-3 text-sand-50"
                : "rounded-2xl bg-sand-100 px-4 py-3 text-night-800"
          } ${unsent ? "italic opacity-70" : "cursor-pointer"}`}
          onContextMenu={(event) => {
            if ((!compact && !hub) || unsent) return;
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
            if (unsent || editing) return;
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
          {!mine && senderName && !compact && !hub && (
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
                <ChatMessageReplyQuote reply={reply} mine={mine} compact={compact || hub} />
              ) : null}
              {imageSrc && !unsent && (
                <a href={imageSrc} target="_blank" rel="noreferrer" className="messages-hub-attachment mb-0 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="Shared image" />
                </a>
              )}
              {displayContent ? (
                <ChatMessageText
                  text={displayContent}
                  className="whitespace-pre-wrap break-words"
                  linkClassName={
                    hub
                      ? mine
                        ? "font-semibold text-white underline decoration-white/45 underline-offset-2"
                        : "font-semibold text-[#0095f6] underline decoration-[#0095f6]/35 underline-offset-2"
                      : mine && compact
                      ? "font-semibold text-[#027eb5] underline decoration-[#027eb5]/35 underline-offset-2 dark:text-[#53bdeb] dark:decoration-[#53bdeb]/40"
                      : compact
                        ? "font-semibold text-[#027eb5] underline decoration-[#027eb5]/35 underline-offset-2 dark:text-[#53bdeb] dark:decoration-[#53bdeb]/40"
                        : mine
                          ? "font-semibold text-sand-50 underline decoration-sand-50/50 underline-offset-2"
                          : "font-semibold text-night-900 underline decoration-night-900/30 underline-offset-2"
                  }
                />
              ) : null}
              {youtubeVideoIds.map((videoId) => (
                <ChatYouTubeEmbed key={videoId} videoId={videoId} vertical={hub} />
              ))}
            </div>
          )}

          <div
            className={`mt-1 flex flex-wrap items-center gap-1.5 ${
              hub
                ? `justify-end text-[11px] leading-none ${
                    mine ? "text-white/75" : "text-night-500 dark:text-sand-400"
                  }`
                : compact
                  ? `${chatPremium.bubbleMeta} ${mine ? "justify-end" : ""}`
                  : "text-[10px] opacity-60"
            } ${showMeta ? "" : "hidden"} ${imageSrc && hub ? "!text-night-500 dark:!text-sand-400" : ""}`}
          >
            <span>{createdAtLabel}</span>
            {editedAt && !unsent && <span>· edited</span>}
            {showReadReceipt && mine && !unsent && !hub && (
              <span>{readAt ? "· Seen" : "· Delivered"}</span>
            )}
            {showSeenCount && mine && !unsent && typeof seenCount === "number" && seenCount > 0 && (
              <span>· Seen by {seenCount}</span>
            )}
          </div>

          {compact && actionsMenu}

          {selectionExcerpt && onStartReply && !unsent ? (
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

        {!unsent && (
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
