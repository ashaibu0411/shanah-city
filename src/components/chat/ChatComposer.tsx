"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { ChatReplyComposerBanner } from "@/components/chat/ChatReplyComposerBanner";
import { chatPremium } from "@/components/chat/chat-premium";
import { ChatAttachmentSheet } from "@/components/chat/ChatAttachmentSheet";
import { messagingUi } from "@/lib/messaging-ui";
import { MentionPicker } from "@/components/mentions/MentionPicker";
import { useMentionAutocomplete } from "@/components/mentions/useMentionAutocomplete";
import { insertAtCursor, isChatAudioAttachment, QUICK_CHAT_EMOJIS } from "@/lib/chat-utils";
import { formatRecordingElapsed, useAudioRecorder } from "@/lib/use-audio-recorder";
import { useSpeechDictation } from "@/lib/use-speech-dictation";
import type { ChatReplyDraft } from "@/lib/chat-reply-types";
import type { MentionMember } from "@/lib/mentions";

const COMPOSER_TEXTAREA_MAX_HEIGHT_PX = 280;

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
  density?: "default" | "compact" | "whatsapp" | "instagram" | "messaging" | "choir-home";
  vanishMode?: boolean;
  onTyping?: (isTyping: boolean) => void;
  onPickAttachment?: (file: File) => Promise<PendingAttachment | null>;
  attachmentBusy?: boolean;
  replyDraft?: ChatReplyDraft | null;
  onClearReply?: () => void;
  mentionMembers?: MentionMember[];
  mentionAllowAll?: boolean;
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
  mentionMembers = [],
  mentionAllowAll = false,
}: ChatComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const mentionCursorRef = useRef(0);
  const skipMicClickRef = useRef(false);
  const pointerDownAtRef = useRef(0);
  const voice = useAudioRecorder();
  const dictation = useSpeechDictation();
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);

  const canUseVoice = Boolean(onPickAttachment) && !disabled && !busy && !attachmentBusy;

  const mentionEnabled = mentionMembers.length > 0 || mentionAllowAll;
  const {
    mentionOpen,
    mentionMembers: mentionMatches,
    mentionHighlightIndex,
    setMentionHighlightIndex,
    onMentionKeyDown,
    onMentionSelect,
    onMentionSelectAll,
    trackMentionCursor,
  } = useMentionAutocomplete({
    value,
    onChange,
    members: mentionMembers,
    allowAll: mentionAllowAll,
    enabled: mentionEnabled,
    getCursor: () => mentionCursorRef.current,
    setCursor: (index) => {
      mentionCursorRef.current = index;
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.setSelectionRange(index, index);
      }
    },
  });

  function syncMentionCursor() {
    const input = inputRef.current;
    if (!input) return;
    mentionCursorRef.current = input.selectionStart ?? value.length;
    trackMentionCursor(mentionCursorRef.current);
  }

  function mentionPicker(className = "") {
    if (!mentionOpen) return null;
    return (
      <MentionPicker
        open
        members={mentionMatches}
        highlightIndex={mentionHighlightIndex}
        onHighlight={setMentionHighlightIndex}
        onSelect={onMentionSelect}
        onSelectAll={onMentionSelectAll}
        allowAll={mentionAllowAll}
        className={className}
      />
    );
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      onTyping?.(false);
    };
  }, [onTyping]);

  const resizeComposerField = useCallback(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "0px";
    const nextHeight = Math.min(field.scrollHeight, COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
    field.style.height = `${nextHeight}px`;
    field.style.overflowY = field.scrollHeight > COMPOSER_TEXTAREA_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeComposerField();
  }, [value, resizeComposerField]);

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
  const choirHome = density === "choir-home";
  const hub =
    density === "whatsapp" || density === "instagram" || density === "messaging";
  const messagingLayout = density === "messaging" || density === "instagram" || density === "whatsapp";
  /** Instagram-style hub: trailing icons steal width from the text field while composing. */
  const composerTypingActive = value.trim().length > 0;
  const hideHubFieldIcons = composerTypingActive;

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (onMentionKeyDown(event)) return;
    if (event.key === "Enter" && !event.shiftKey && !disabled && canSend) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleComposerChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    notifyTyping(event.target.value);
    syncMentionCursor();
    if (event.target.value.trim() && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  }

  function handleSend() {
    if (busy || disabled || attachmentBusy || voiceBusy) return;
    if (!value.trim() && !pendingAttachment) return;
    onSend(pendingAttachment ?? undefined);
    setPendingAttachment(null);
    onTyping?.(false);
  }

  async function uploadAndSendVoice() {
    if (!onPickAttachment) return;
    const file = voice.buildFile("voice-message");
    voice.clearCapture();
    if (!file) return;
    setVoiceBusy(true);
    try {
      const attachment = await onPickAttachment(file);
      if (attachment) {
        onSend(attachment);
        onTyping?.(false);
      }
    } finally {
      setVoiceBusy(false);
    }
  }

  function handleMicPointerDown() {
    if (!canUseVoice || voiceBusy || dictation.listening) return;
    skipMicClickRef.current = false;
    pointerDownAtRef.current = Date.now();
    void voice.start();
  }

  async function handleMicPointerUp() {
    if (!canUseVoice) return;
    const heldMs = Date.now() - pointerDownAtRef.current;
    if (!voice.recording) return;
    voice.stop();
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    if (heldMs >= 400) {
      skipMicClickRef.current = true;
      await uploadAndSendVoice();
    } else {
      voice.clearCapture();
    }
  }

  function handleMicClick() {
    if (skipMicClickRef.current) {
      skipMicClickRef.current = false;
      return;
    }
    if (!canUseVoice || voice.recording || voiceBusy) return;
    if (dictation.listening) {
      dictation.stop();
      return;
    }
    dictation.setError(null);
    dictation.start((text, isFinal) => {
      if (!isFinal) return;
      const next = value.trim() ? `${value.trim()} ${text}` : text;
      onChange(next);
      notifyTyping(next);
    });
  }

  function renderPendingAttachmentPreview(className: string) {
    if (!pendingAttachment) return null;
    const isAudio = isChatAudioAttachment(
      pendingAttachment.attachmentType,
      pendingAttachment.attachmentName,
    );
    return (
      <div className={className}>
        {isAudio ? (
          <audio controls preload="metadata" src={pendingAttachment.previewUrl} className="min-w-0 flex-1" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pendingAttachment.previewUrl}
            alt={pendingAttachment.attachmentName}
            className="h-14 w-14 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-night-900 dark:text-sand-100">
            {isAudio ? "Voice message" : pendingAttachment.attachmentName}
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
    );
  }

  function renderVoiceStatusBanner() {
    const message =
      voice.error ??
      dictation.error ??
      (voiceBusy
        ? "Sending voice message…"
        : voice.recording
          ? `Recording ${formatRecordingElapsed(voice.elapsed)} · release to send`
          : dictation.listening
            ? "Listening… tap mic to stop · speech fills the text box"
            : null);
    if (!message) return null;
    return (
      <p className="mb-2 text-center text-xs font-semibold text-clay-700 dark:text-clay-300">
        {message}
      </p>
    );
  }

  const micActive = voice.recording || dictation.listening;

  if (hub && messagingLayout) {
    const showSend = composerTypingActive || Boolean(pendingAttachment);
    return (
      <div className={messagingUi.composerBar}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,audio/*"
          className="hidden"
          onChange={(event) => handleAttachmentPick(event.target.files?.[0] ?? null)}
        />
        {replyDraft && onClearReply ? (
          <ChatReplyComposerBanner reply={replyDraft} onClear={onClearReply} />
        ) : null}
        {renderVoiceStatusBanner()}
        {renderPendingAttachmentPreview(
          "mb-2 flex items-center gap-2 rounded-xl border border-[#E8E2DA] bg-[#F7F4EF] p-2",
        )}
        {showEmojiPicker ? (
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
        ) : null}
        <div className={messagingUi.composerRow}>
          {allowAttachment && onPickAttachment ? (
            <button
              type="button"
              className={messagingUi.composerPlus}
              disabled={disabled}
              aria-label="Add attachment"
              onClick={() => setAttachSheetOpen(true)}
            >
              +
            </button>
          ) : null}
          <div className="relative min-w-0 flex-1">
            {mentionPicker("absolute bottom-full left-0 mb-1 w-[min(100vw-2rem,18rem)]")}
            <div className={`${messagingUi.composerField} ${vanishMode ? "ring-1 ring-amber-400/40" : ""}`}>
              <textarea
                ref={inputRef}
                rows={1}
                value={value}
                onChange={handleComposerChange}
                onClick={syncMentionCursor}
                onKeyUp={syncMentionCursor}
                placeholder={placeholder}
                disabled={disabled}
                className={`${chatPremium.composerInput} chat-premium-composer-textarea block min-h-[2.25rem] max-h-[280px] w-full resize-none py-1.5`}
                onKeyDown={handleComposerKeyDown}
              />
            </div>
          </div>
          {!showSend ? (
            <>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((current) => !current)}
                disabled={disabled}
                className={messagingUi.composerIcon}
                aria-label="Emoji"
              >
                <HubStickerIcon />
              </button>
              {allowAttachment && onPickAttachment ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled || attachmentBusy}
                  className={messagingUi.composerIcon}
                  aria-label="Photos"
                >
                  <HubGalleryIcon />
                </button>
              ) : null}
              <button
                type="button"
                onPointerDown={handleMicPointerDown}
                onPointerUp={() => void handleMicPointerUp()}
                onPointerLeave={() => void handleMicPointerUp()}
                onClick={handleMicClick}
                disabled={!canUseVoice || voiceBusy}
                className={`${messagingUi.composerVoice} ${micActive ? "messages-hub-composer-icon-recording" : ""}`}
                aria-label="Voice message"
              >
                <HubMicIcon />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={busy || disabled || !canSend}
              className={messagingUi.composerSend}
              aria-label={sendLabel}
            >
              {busy ? "…" : <HubSendIcon />}
            </button>
          )}
        </div>
        <ChatAttachmentSheet
          open={attachSheetOpen}
          onClose={() => setAttachSheetOpen(false)}
          allowPhoto={allowAttachment && Boolean(onPickAttachment)}
          allowVoice={canUseVoice}
          onPickPhoto={() => fileRef.current?.click()}
          onPickCamera={() => fileRef.current?.click()}
          onPickVoice={() => {
            void handleMicPointerDown();
          }}
        />
      </div>
    );
  }

  if (choirHome) {
    return (
      <div className="choir-home-composer-root">
        {replyDraft && onClearReply ? (
          <ChatReplyComposerBanner reply={replyDraft} onClear={onClearReply} />
        ) : null}
        {renderVoiceStatusBanner()}
        {renderPendingAttachmentPreview("choir-home-composer-attachment mb-2 flex items-center gap-2")}

        {showEmojiPicker ? (
          <div className="choir-home-composer-emoji mb-2 flex flex-wrap gap-1">
            {QUICK_CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="rounded-lg px-2 py-1 text-lg hover:bg-black/5"
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="choir-home-composer-row">
          <div className="choir-home-composer-field">
            {mentionPicker("absolute bottom-full left-0 z-10 mb-1 w-[min(100vw-2.5rem,18rem)]")}
            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              onChange={handleComposerChange}
              onClick={syncMentionCursor}
              onKeyUp={syncMentionCursor}
              placeholder={placeholder}
              disabled={disabled}
              className="choir-home-composer-input"
              onKeyDown={handleComposerKeyDown}
            />
            <div className="choir-home-composer-inline-actions">
              {allowAttachment && onPickAttachment ? (
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
                    className="choir-home-composer-inline-btn"
                    aria-label="Add photo"
                  >
                    {attachmentBusy ? "…" : <HubGalleryIcon />}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((current) => !current)}
                disabled={disabled}
                className="choir-home-composer-inline-btn"
                aria-label="Add emoji"
              >
                <HubStickerIcon />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || disabled || !canSend}
            className="choir-home-composer-send"
            aria-label={busy ? "Sending…" : sendLabel}
          >
            {busy ? <span className="text-sm font-bold">…</span> : <HubSendIcon />}
          </button>
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
        {renderVoiceStatusBanner()}
        {renderPendingAttachmentPreview(`${chatPremium.attachmentPreview} mb-2 flex items-center gap-2`)}

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
          <button
            type="button"
            onPointerDown={handleMicPointerDown}
            onPointerUp={() => void handleMicPointerUp()}
            onPointerLeave={() => void handleMicPointerUp()}
            onClick={handleMicClick}
            disabled={!canUseVoice || voiceBusy}
            className={`${chatPremium.composerIconButton} ${micActive ? "messages-hub-composer-icon-recording" : ""}`}
            aria-label="Hold for voice, tap for speech to text"
          >
            🎙
          </button>
          <div
            className={`${chatPremium.composerField} relative ${composerTypingActive ? "chat-premium-composer-field--typing items-start" : "items-center"}`}
          >
            {mentionPicker("absolute bottom-full left-0 mb-1 w-full min-w-[14rem]")}
            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              onChange={handleComposerChange}
              onClick={syncMentionCursor}
              onKeyUp={syncMentionCursor}
              placeholder={placeholder}
              disabled={disabled}
              className={`${chatPremium.composerInput} chat-premium-composer-textarea resize-none`}
              onKeyDown={handleComposerKeyDown}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || disabled || !canSend}
            className={chatPremium.sendButton}
            aria-label={sendLabel}
          >
            {busy ? "…" : <HubSendIcon />}
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
      {renderVoiceStatusBanner()}
      {renderPendingAttachmentPreview(
        "mb-2 flex items-center gap-3 rounded-xl border border-night-900/10 bg-sand-50 p-2",
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
              onPointerDown={handleMicPointerDown}
              onPointerUp={() => void handleMicPointerUp()}
              onPointerLeave={() => void handleMicPointerUp()}
              onClick={handleMicClick}
              disabled={!canUseVoice || voiceBusy}
              className={`shrink-0 rounded-xl border border-night-900/10 bg-white px-2.5 py-2.5 text-sm font-semibold text-night-700 disabled:opacity-50 ${micActive ? "messages-hub-composer-icon-recording" : ""}`}
              aria-label="Hold for voice, tap for speech to text"
            >
              🎙
            </button>
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
        <div className="relative min-w-0 flex-1">
          {mentionPicker("absolute bottom-full left-0 mb-1 w-full min-w-[14rem]")}
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={handleComposerChange}
          onClick={syncMentionCursor}
          onKeyUp={syncMentionCursor}
          placeholder={placeholder}
          disabled={disabled}
          className="chat-premium-composer-textarea min-w-0 flex-1 resize-none rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm leading-snug outline-none ring-night-900/5 focus:ring-2 disabled:opacity-50"
          onKeyDown={handleComposerKeyDown}
        />
        </div>
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

function HubSendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.4 20.4 20.8 12 3.4 3.6l2.8 7.2 7.2 1-7.2 1-2.8 7.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
