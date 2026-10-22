"use client";

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

export function ChatAttachmentSheet({
  open,
  onClose,
  onPickPhoto,
  onPickCamera,
  onPickVoice,
  allowPhoto = true,
  allowVoice = true,
}: ChatAttachmentSheetProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={messagingUi.actionBackdrop}
        aria-label="Close attachments"
        onClick={onClose}
      />
      <div className={messagingUi.attachSheet} role="dialog" aria-label="Add attachment">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E8E2DA]" aria-hidden />
        <div className={messagingUi.attachGrid}>
          {allowPhoto ? (
            <button type="button" className={messagingUi.attachTile} onClick={() => { onClose(); onPickPhoto(); }}>
              <span className="messaging-v2-attach-icon messaging-v2-attach-icon-photos" aria-hidden>
                🖼
              </span>
              <span>Photos</span>
            </button>
          ) : null}
          {allowPhoto && onPickCamera ? (
            <button type="button" className={messagingUi.attachTile} onClick={() => { onClose(); onPickCamera(); }}>
              <span className="messaging-v2-attach-icon" aria-hidden>
                📷
              </span>
              <span>Camera</span>
            </button>
          ) : null}
          {allowVoice && onPickVoice ? (
            <button type="button" className={messagingUi.attachTile} onClick={() => { onClose(); onPickVoice(); }}>
              <span className="messaging-v2-attach-icon messaging-v2-attach-icon-voice" aria-hidden>
                🎙
              </span>
              <span>Voice</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
