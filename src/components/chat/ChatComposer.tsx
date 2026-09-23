"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ChatReplyComposerBanner } from "@/components/chat/ChatReplyComposerBanner";
import { chatPremium } from "@/components/chat/chat-premium";
import { insertAtCursor, QUICK_CHAT_EMOJIS } from "@/lib/chat-utils";
import type { ChatReplyDraft } from "@/lib/chat-reply-types";

type PendingAttachment = {
  attachmentUrl: string;
  attachmentType: string;
  attachmentName: string;
  previewUrl: string;
};

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachment?: PendingAttachment) => void;
  busy?: boolean;
  disabled?: boolean;
  placeholder?: string;
  sendLabel?: string;
  allowAttachment?: boolean;
  density?: "default" | "compact" | "whatsapp" | "instagram";
  vanishMode?: boolean;
  onTyping?: (isTyping: boolean) => void;
  onPickAttachment?: (file: File) => Promise<PendingAttachment | null>;
  attachmentBusy?: boolean;
  replyDraft?: ChatReplyDraft | null;
  onClearReply?: () => void;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  busy = false,
  disabled = false,
  placeholder = "Type a message…",
  sendLabel = "Send",
  allowAttachment = true,
  density = "default",
  onTyping,
  onPickAttachment,
  attachmentBusy = false,
  replyDraft,
  onClearReply,
  vanishMode = false,
}: ChatComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      onTyping?.(false);
    };
  }, [onTyping]);

  function notifyTyping(nextValue: string) {
    if (!onTyping) return;
    onTyping(nextValue.trim().length > 0);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 2500);
  }

  function appendEmoji(emoji: string) {
    const input = inputRef.current;
    if (!input) {
      onChange(`${value}${emoji}`);
      notifyTyping(`${value}${emoji}`);
      return;
    }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = insertAtCursor(value, emoji, start, end);
    onChange(next);
    notifyTyping(next);
    setShowEmojiPicker(false);
    window.setTimeout(() => input.focus(), 0);
  }

  async function handleAttachmentPick(file: File | null) {
    if (!file || !onPickAttachment) return;
    const attachment = await onPickAttachment(file);
    if (attachment) {
      setPendingAttachment(attachment);
    }
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  const canSend = Boolean(value.trim() || pendingAttachment);
  const compact = density === "compact";
  const hub = density === "whatsapp" || density === "instagram";

  function handleSend() {
    onSend(pendingAttachment ?? undefined);
    setPendingAttachment(null);
    onTyping?.(false);
  }

  if (hub) {
    return (
      <div className="messages-hub-composer px-3 py-2 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {replyDraft && onClearReply ? (
          <ChatReplyComposerBanner reply={replyDraft} onClear={onClearReply} />
        ) : null}
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-night-900/8 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.attachmentName}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-night-900 dark:text-sand-100">
                {pendingAttachment.attachmentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="text-sm font-semibold text-night-500 dark:text-sand-400"
            >
              ✕
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-2xl border border-night-900/8 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]">
            {QUICK_CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="rounded-lg px-1.5 py-0.5 text-lg hover:bg-sand-50 dark:hover:bg-[var(--color-bg-muted)]"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex min-w-0 items-center gap-2">
          {allowAttachment && onPickAttachment && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleAttachmentPick(event.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || attachmentBusy}
                className="messages-hub-camera-btn"
                aria-label="Camera"
              >
                <HubCameraIcon />
              </button>
            </>
          )}

          <div
            className={`messages-hub-composer-field flex min-w-0 flex-1 items-center gap-0.5 rounded-full px-3 py-1 ${vanishMode ? "is-vanish" : ""}`}
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                notifyTyping(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[var(--color-ink)] caret-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)] disabled:opacity-50"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !disabled && canSend) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (canSend && !busy && !disabled) {
                  handleSend();
                }
              }}
              disabled={disabled}
              className="messages-hub-composer-icon disabled:opacity-40"
              aria-label={canSend ? sendLabel : "Voice message"}
            >
              <HubMicIcon />
            </button>
            {allowAttachment && onPickAttachment ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || attachmentBusy}
                className="messages-hub-composer-icon disabled:opacity-40"
                aria-label="Add photo"
              >
                <HubGalleryIcon />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              disabled={disabled}
              className="messages-hub-composer-icon disabled:opacity-40"
              aria-label="Stickers"
            >
              <HubStickerIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              disabled={disabled}
              className="messages-hub-composer-icon disabled:opacity-40"
              aria-label="More"
            >
              <HubPlusIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <>
        {replyDraft && onClearReply ? (
          <ChatReplyComposerBanner reply={replyDraft} onClear={onClearReply} />
        ) : null}
        {pendingAttachment && (
          <div className={`${chatPremium.attachmentPreview} mb-2 flex items-center gap-2`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.attachmentName}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-night-900 dark:text-sand-100">
                {pendingAttachment.attachmentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="text-xs font-semibold text-night-600 dark:text-sand-400"
            >
              ✕
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className={`${chatPremium.emojiTray} mb-2`}>
            {QUICK_CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className={chatPremium.emojiTrayBtn}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className={chatPremium.composerRow}>
          {allowAttachment && onPickAttachment && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleAttachmentPick(event.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || attachmentBusy}
                className={chatPremium.composerIconButton}
                aria-label="Add photo"
              >
                {attachmentBusy ? "…" : "📷"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((current) => !current)}
            disabled={disabled}
            className={chatPremium.composerIconButton}
            aria-label="Add emoji"
          >
            😊
          </button>
          <div className={chatPremium.composerField}>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                notifyTyping(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className={chatPremium.composerInput}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !disabled && canSend) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || disabled || !canSend}
            className={chatPremium.sendButton}
            aria-label={sendLabel}
          >
            ↑
          </button>
        </div>
      </>
    );
  }

  return (
    <div>
      {replyDraft && onClearReply ? (
        <ChatReplyComposerBanner reply={replyDraft} onClear={onClearReply} />
      ) : null}
      {pendingAttachment && (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-night-900/10 bg-sand-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingAttachment.previewUrl}
            alt={pendingAttachment.attachmentName}
            className="h-16 w-16 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-night-900">
              {pendingAttachment.attachmentName}
            </p>
            <p className="text-xs text-night-500">Ready to send</p>
          </div>
          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="rounded-full px-2 py-1 text-xs font-semibold text-night-600"
          >
            Remove
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="mb-2 flex flex-wrap gap-1 rounded-xl bg-sand-50 p-2">
          {QUICK_CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => appendEmoji(emoji)}
              className="rounded-lg px-2 py-1 text-lg hover:bg-white"
              aria-label={`Insert ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((current) => !current)}
          disabled={disabled}
          className="shrink-0 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-lg disabled:opacity-50"
          aria-label="Add emoji"
        >
          😊
        </button>
        {allowAttachment && onPickAttachment && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleAttachmentPick(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || attachmentBusy}
              className="shrink-0 rounded-xl border border-night-900/10 bg-white px-2.5 py-2.5 text-sm font-semibold text-night-700 disabled:opacity-50 sm:px-3"
              aria-label="Add photo"
            >
              <span className="sm:hidden">{attachmentBusy ? "…" : "📷"}</span>
              <span className="hidden sm:inline">{attachmentBusy ? "…" : "Photo"}</span>
            </button>
          </>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            notifyTyping(event.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-50"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !disabled && canSend) {
              event.preventDefault();
              onSend(pendingAttachment ?? undefined);
              setPendingAttachment(null);
              onTyping?.(false);
            }
          }}
        />
        <Button
          onClick={() => {
            onSend(pendingAttachment ?? undefined);
            setPendingAttachment(null);
            onTyping?.(false);
          }}
          disabled={busy || disabled || !canSend}
          className="shrink-0"
        >
          {busy ? "Sending…" : sendLabel}
        </Button>
      </div>
    </div>
  );
}

export type { PendingAttachment };

function HubCameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 7.5h5l1.5 2.5H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.5L9.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function HubMicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14.5a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4.5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M6 11.5v1a6 6 0 0 0 12 0v-1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 18.5v2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function HubGalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="m8 14 2.5-2.5L14 15l2-2 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
    </svg>
  );
}

function HubStickerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9.5 14.5c.75 1.25 2 2 2.5 2s1.75-.75 2.5-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function HubPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
