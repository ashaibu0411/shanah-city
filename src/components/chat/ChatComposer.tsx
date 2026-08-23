"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { insertAtCursor, QUICK_CHAT_EMOJIS } from "@/lib/chat-utils";
import { IconCamera, IconClose, IconEmoji } from "@/components/chat/ChatIcons";

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
  density?: "default" | "compact";
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

  function handleSend() {
    onSend(pendingAttachment ?? undefined);
    setPendingAttachment(null);
    onTyping?.(false);
  }

  if (compact) {
    return (
      <div className="border-t border-[#efefef] bg-white px-3 py-2.5">
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-[#fafafa] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingAttachment.previewUrl}
              alt={pendingAttachment.attachmentName}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#262626]">
                {pendingAttachment.attachmentName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8e8e8e] hover:bg-[#efefef]"
              aria-label="Remove attachment"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="mb-2 flex flex-wrap gap-1 rounded-2xl bg-[#fafafa] p-2">
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

        <div className="flex items-center gap-2">
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
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[#262626] disabled:opacity-40"
                aria-label="Add photo"
              >
                {attachmentBusy ? (
                  <span className="text-sm text-[#8e8e8e]">…</span>
                ) : (
                  <IconCamera className="h-6 w-6" />
                )}
              </button>
            </>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-[#dbdbdb] bg-white py-1.5 pl-3.5 pr-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                notifyTyping(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#262626] outline-none placeholder:text-[#8e8e8e] disabled:opacity-50"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !disabled && canSend) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              disabled={disabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#262626] disabled:opacity-40"
              aria-label="Add emoji"
            >
              <IconEmoji className="h-5 w-5" />
            </button>
            {canSend ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={busy || disabled}
                className="shrink-0 px-1.5 text-[14px] font-semibold text-[#3797f0] disabled:opacity-40"
              >
                {busy ? "…" : sendLabel}
              </button>
            ) : null}
          </div>
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
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-night-600"
            aria-label="Remove attachment"
          >
            <IconClose className="h-3.5 w-3.5" />
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((current) => !current)}
          disabled={disabled}
          className="flex items-center justify-center rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-night-700 disabled:opacity-50"
          aria-label="Add emoji"
        >
          <IconEmoji className="h-5 w-5" />
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
              className="flex items-center gap-1.5 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm font-semibold text-night-700 disabled:opacity-50"
            >
              <IconCamera className="h-4 w-4" />
              {attachmentBusy ? "…" : "Photo"}
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
          className="flex-1 rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-50"
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
        >
          {busy ? "Sending…" : sendLabel}
        </Button>
      </div>
    </div>
  );
}

export type { PendingAttachment };
