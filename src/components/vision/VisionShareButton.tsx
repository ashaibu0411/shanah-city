"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildVisionShareInvitation,
  buildVisionShareInvitationBody,
  visionPlanCanonicalPath,
  visionPlanShareUrl,
  visionShareDocumentTitle,
} from "@/lib/vision-center-share";

type VisionShareButtonProps = {
  planId: string;
  planTitle: string;
  onNotice?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
};

const primary =
  "rounded-xl bg-blue-700 px-5 py-3 text-base font-bold leading-snug text-white shadow-sm disabled:opacity-50";
const secondary =
  "rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-bold leading-snug text-slate-900 disabled:opacity-50";

export function VisionShareButton({
  planId,
  planTitle,
  onNotice,
  onError,
  className = "",
}: VisionShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [invitationCopied, setInvitationCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return visionPlanCanonicalPath(planId);
    return visionPlanShareUrl(window.location.origin, planId);
  }, [planId]);

  const invitationBody = useMemo(() => buildVisionShareInvitationBody(planTitle), [planTitle]);
  const invitation = useMemo(
    () => buildVisionShareInvitation(planTitle, shareUrl),
    [planTitle, shareUrl],
  );

  const shareTitle = useMemo(() => visionShareDocumentTitle(planTitle), [planTitle]);

  const copyText = useCallback(
    async (text: string, kind: "link" | "invitation") => {
      try {
        await navigator.clipboard.writeText(text);
        if (kind === "link") {
          setLinkCopied(true);
          window.setTimeout(() => setLinkCopied(false), 2500);
        } else {
          setInvitationCopied(true);
          window.setTimeout(() => setInvitationCopied(false), 2500);
        }
        onNotice?.(
          kind === "link"
            ? "Vision link copied. Only invited leaders can open it after sign-in."
            : "Invitation message copied. Paste it into any messaging app.",
        );
      } catch {
        onError?.("Unable to copy on this device. Try Share Vision instead.");
      }
    },
    [onError, onNotice],
  );

  async function shareNative() {
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: invitationBody,
          url: shareUrl,
        });
        onNotice?.("Share sheet opened.");
        return;
      }
      await copyText(shareUrl, "link");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      onError?.("Could not open the device share menu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={
        "w-full min-w-0 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6 " + className
      }
      aria-label="Share vision proposal"
    >
      <h3 className="text-xl font-extrabold text-slate-950">Share Vision</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
        Assign pastors and ministry leaders in Vision Center first, then share through WhatsApp, Messenger,
        SMS, email, or any app. The link only works for people who already have an assignment after sign-in.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primary} disabled={busy} onClick={() => void shareNative()}>
          Share Vision
        </button>
        <button type="button" className={secondary} disabled={busy} onClick={() => void copyText(shareUrl, "link")}>
          {linkCopied ? "Link copied" : "Copy link"}
        </button>
        <button
          type="button"
          className={secondary}
          disabled={busy}
          onClick={() => void copyText(invitation, "invitation")}
        >
          {invitationCopied ? "Invitation copied" : "Copy invitation"}
        </button>
      </div>
    </section>
  );
}