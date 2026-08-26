"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { insertAtCursor, QUICK_CHAT_EMOJIS } from "@/lib/chat-utils";

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
  density?: "default" | "compact" | "whatsapp";
  onTyping?: (isTyping: boolean) => void;
  onPickAttachment?: (file: File) => Promise<PendingAttachment | null>;
  attachmentBusy?: boolean;
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
  const whatsapp = density === "whatsapp";

  function handleSend() {
    onSend(pendingAttachment ?? undefined);
    setPendingAttachment(null);
    onTyping?.(false);
  }

  if (whatsapp) {
    return (
      <div className="bg-[#f0f2f5] px-2 py-2 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.attachmentName}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#111b21]">
                {pendingAttachment.attachmentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="text-sm font-semibold text-[#667781]"
            >
              ✕
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-2xl bg-white p-2 shadow-sm">
            {QUICK_CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="rounded-lg px-1.5 py-0.5 text-lg hover:bg-[#f0f2f5]"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex min-w-0 items-end gap-2">
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-[#54656f] disabled:opacity-40"
                aria-label="Add photo"
              >
                {attachmentBusy ? "…" : "📎"}
              </button>
            </>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-3xl bg-white px-3 py-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              disabled={disabled}
              className="shrink-0 text-xl disabled:opacity-40"
              aria-label="Add emoji"
            >
              ☺
            </button>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                notifyTyping(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] text-[#111b21] outline-none placeholder:text-[#667781] disabled:opacity-50"
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-lg font-bold text-white disabled:bg-[#8696a0]"
            aria-label={sendLabel}
          >
            {busy ? "…" : "➤"}
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="border-t border-night-900/8 bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-sand-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.attachmentName}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-night-900">
                {pendingAttachment.attachmentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="text-xs font-semibold text-night-600"
            >
              ✕
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-2xl bg-sand-50 p-2">
            {QUICK_CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="rounded-lg px-1.5 py-0.5 text-lg hover:bg-white"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex min-w-0 w-full items-end gap-2">
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
                className="flex h-9 w-9 shrink-0 items-center justify-center text-lg text-night-700 disabled:opacity-40"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center text-lg disabled:opacity-40"
            aria-label="Add emoji"
          >
            😊
          </button>
          <div className="flex min-w-0 flex-1 items-center rounded-full border border-night-900/10 bg-sand-50 px-4 py-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                notifyTyping(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full bg-transparent text-sm text-night-900 outline-none placeholder:text-night-400 disabled:opacity-50"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0095f6] text-sm font-bold text-white disabled:bg-night-300"
            aria-label={sendLabel}
          >
            ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
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
