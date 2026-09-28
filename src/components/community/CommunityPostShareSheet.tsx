"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CommunityPost } from "@/lib/member-types";
import {
  communityPostImageUrls,
  communityPostShareCaption,
  communityPostVideoUrls,
  copyCommunityPostCaption,
  copyCommunityPostLink,
  downloadAllCommunityImages,
  downloadCommunityMediaUrl,
  shareCommunityImageOnly,
  shareCommunityImageWithCaption,
  shareCommunityPostLink,
} from "@/lib/community-post-share-client";

type CommunityPostShareSheetProps = {
  open: boolean;
  onClose: () => void;
  post: CommunityPost;
  onNotice?: (message: string) => void;
};

function ShareOption({
  title,
  detail,
  onClick,
  disabled,
}: {
  title: string;
  detail?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-night-900/10 px-4 py-3 text-left transition hover:bg-sand-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
    >
      <p className="font-semibold text-night-900 dark:text-sand-100">{title}</p>
      {detail ? <p className="mt-0.5 text-xs text-night-600 dark:text-sand-400">{detail}</p> : null}
    </button>
  );
}

export function CommunityPostShareSheet({ open, onClose, post, onNotice }: CommunityPostShareSheetProps) {
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const imageUrls = useMemo(() => communityPostImageUrls(post), [post]);
  const videoUrls = useMemo(() => communityPostVideoUrls(post), [post]);
  const primaryImage = imageUrls[0] ?? null;
  const captionPreview = communityPostShareCaption(post);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function run(action: () => Promise<void>, successMessage: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      onNotice?.(successMessage);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Could not complete that share.";
      onNotice?.(message);
    } finally {
      setBusy(false);
    }
  }

  async function runShareResult(
    action: () => Promise<"shared" | "copied" | "downloaded">,
    messages: { shared: string; copied: string; downloaded: string },
  ) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await action();
      onNotice?.(messages[result]);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Could not complete that share.";
      onNotice?.(message);
    } finally {
      setBusy(false);
    }
  }

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="community-composer-modal" role="dialog" aria-modal="true" aria-label="Share post">
      <button
        type="button"
        className="community-composer-backdrop"
        onClick={onClose}
        aria-label="Close share options"
      />
      <div className="community-composer-dialog max-h-[min(90vh,640px)] overflow-y-auto">
        <div className="border-b border-night-900/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-center font-display text-[17px] font-bold text-night-900 dark:text-sand-100">
            Share post
          </h2>
          <p className="mt-1 line-clamp-2 text-center text-xs text-night-600 dark:text-sand-300">
            {captionPreview}
          </p>
        </div>

        {primaryImage ? (
          <div className="border-b border-night-900/8 px-4 py-3 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage}
              alt=""
              className="mx-auto max-h-40 rounded-lg object-contain ring-1 ring-night-900/10"
            />
            {imageUrls.length > 1 ? (
              <p className="mt-2 text-center text-[11px] text-night-500 dark:text-sand-400">
                {imageUrls.length} photos · share actions use the first image; download all saves every photo
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 px-4 py-3">
          <ShareOption
            title="Share link & caption"
            detail="Message apps, email, or copy when share is unavailable"
            disabled={busy}
            onClick={() =>
              void runShareResult(() => shareCommunityPostLink(post), {
                shared: "Shared",
                copied: "Link and caption copied",
                downloaded: "Copied",
              })
            }
          />

          {primaryImage ? (
            <>
              <ShareOption
                title="Share photo & caption"
                detail="Send the image with the post text (where your device supports it)"
                disabled={busy}
                onClick={() =>
                  void runShareResult(
                    () => shareCommunityImageWithCaption(primaryImage, post),
                    {
                      shared: "Shared photo and caption",
                      copied: "Copied",
                      downloaded: "Photo saved · caption copied to clipboard",
                    },
                  )
                }
              />
              <ShareOption
                title="Share photo only"
                detail="Image file only — great for WhatsApp or Instagram"
                disabled={busy}
                onClick={() =>
                  void runShareResult(() => shareCommunityImageOnly(primaryImage), {
                    shared: "Shared photo",
                    copied: "Copied",
                    downloaded: "Photo saved to your device",
                  })
                }
              />
              <ShareOption
                title={imageUrls.length > 1 ? "Download all photos" : "Download photo"}
                detail="Save to your gallery, then share anywhere"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    if (imageUrls.length > 1) {
                      await downloadAllCommunityImages(imageUrls);
                    } else {
                      await downloadCommunityMediaUrl(primaryImage, "image");
                    }
                  }, imageUrls.length > 1 ? "Photos downloaded" : "Photo downloaded")
                }
              />
            </>
          ) : null}

          {videoUrls[0] && !primaryImage ? (
            <ShareOption
              title="Download video"
              detail="Save the video file to share from your gallery"
              disabled={busy}
              onClick={() =>
                void run(
                  () => downloadCommunityMediaUrl(videoUrls[0], "video"),
                  "Video download started",
                )
              }
            />
          ) : null}

          <ShareOption
            title="Copy link"
            disabled={busy}
            onClick={() => void run(() => copyCommunityPostLink(post.id), "Link copied")}
          />
          <ShareOption
            title="Copy caption"
            disabled={busy}
            onClick={() => void run(() => copyCommunityPostCaption(post), "Caption copied")}
          />
        </div>

        <div className="border-t border-night-900/10 px-4 py-3 dark:border-white/10">
          <button
            type="button"
            className="w-full rounded-xl bg-sand-100 py-2.5 text-sm font-semibold text-night-800 dark:bg-night-800 dark:text-sand-100"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
