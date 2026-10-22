"use client";

import { useEffect } from "react";
import { messagingUi } from "@/lib/messaging-ui";

type ChatAttachmentSheetProps = {
  open: boolean;
  onClose: () => void;
  onPickPhoto: () => void;
  onPickCamera?: () => void;
  onPickVoice?: () => void;
  allowPhoto?: boolean;
  allowVoice?: boolean;
};

function AttachIconPhotos() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L3 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AttachIconCamera() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.25" />
    </svg>
  );
}

function AttachIconMic() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
      <path d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v2" strokeLinecap="round" />
    </svg>
  );
}

export function ChatAttachmentSheet({
  open,
  onClose,
  onPickPhoto,
  onPickCamera,
  onPickVoice,
  allowPhoto = true,
  allowVoice = true,
}: ChatAttachmentSheetProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={messagingUi.actionBackdrop}
        aria-label="Close attachments"
        onClick={onClose}
      />
      <div
        className={messagingUi.attachSheet}
        role="dialog"
        aria-modal="true"
        aria-label="Add attachment"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#E8E2DA] dark:bg-white/20" aria-hidden />
        <div className={messagingUi.attachGrid}>
          {allowPhoto ? (
            <button
              type="button"
              className={messagingUi.attachTile}
              onClick={() => {
                onClose();
                onPickPhoto();
              }}
            >
              <span className="messaging-v2-attach-icon messaging-v2-attach-icon-photos" aria-hidden>
                <AttachIconPhotos />
              </span>
              <span>Photos</span>
            </button>
          ) : null}
          {allowPhoto && onPickCamera ? (
            <button
              type="button"
              className={messagingUi.attachTile}
              onClick={() => {
                onClose();
                onPickCamera();
              }}
            >
              <span className="messaging-v2-attach-icon" aria-hidden>
                <AttachIconCamera />
              </span>
              <span>Camera</span>
            </button>
          ) : null}
          {allowVoice && onPickVoice ? (
            <button
              type="button"
              className={messagingUi.attachTile}
              onClick={() => {
                onClose();
                onPickVoice();
              }}
            >
              <span className="messaging-v2-attach-icon messaging-v2-attach-icon-voice" aria-hidden>
                <AttachIconMic />
              </span>
              <span>Voice</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
