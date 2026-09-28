"use client";

import Link from "next/link";
import { Fragment, useMemo, type ReactNode } from "react";
import { splitTextWithMentionTokens } from "@/lib/mentions";
import {
  appPathFromAbsoluteUrl,
  isValidAppNavigationHref,
  normalizeWorshipChatHref,
  trimChatLinkTrailingPunctuation,
} from "@/lib/worship-chat-links";

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>\[\]{}|\\^`"]+/gi;

const APP_PATH_PATTERN =
  /(?:^|\s)(\/(?:worship|groups)(?:\/[^\s<>\[\]{}|\\^`"]*)?(?:\?[^\s<>\[\]{}|\\^`"]*)?)/gi;

function hrefForExternalUrl(url: string) {
  return url.toLowerCase().startsWith("www.") ? `https://${url}` : url;
}

function linkifySegment(text: string, linkClassName?: string): ReactNode[] {
  type Match = { index: number; length: number; href: string; label: string; external: boolean };
  const matches: Match[] = [];

  const urlRegex = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const raw = urlMatch[0];
    const url = trimChatLinkTrailingPunctuation(raw);
    const inApp = appPathFromAbsoluteUrl(hrefForExternalUrl(url));
    if (inApp?.startsWith("/worship") || inApp?.startsWith("/groups")) {
      const href = inApp.startsWith("/worship") ? normalizeWorshipChatHref(inApp) : inApp;
      matches.push({
        index: urlMatch.index,
        length: raw.length,
        href,
        label: url,
        external: false,
      });
    } else {
      matches.push({
        index: urlMatch.index,
        length: raw.length,
        href: hrefForExternalUrl(url),
        label: url,
        external: true,
      });
    }
  }

  const pathRegex = new RegExp(APP_PATH_PATTERN.source, APP_PATH_PATTERN.flags);
  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = pathRegex.exec(text)) !== null) {
    const path = trimChatLinkTrailingPunctuation(pathMatch[1] ?? pathMatch[0].trim());
    const href = path.startsWith("/worship") ? normalizeWorshipChatHref(path) : path;
    const startIndex = pathMatch.index + pathMatch[0].length - path.length;
    const overlaps = matches.some(
      (entry) => startIndex >= entry.index && startIndex < entry.index + entry.length,
    );
    if (!overlaps) {
      matches.push({
        index: startIndex,
        length: path.length,
        href,
        label: path,
        external: false,
      });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  const linkClass = `${linkClassName ?? ""} break-all`;

  for (const match of matches) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (!match.external && !isValidAppNavigationHref(match.href)) {
      parts.push(match.label);
    } else if (match.external) {
      parts.push(
        <a
          key={`${match.index}-${match.href}`}
          href={match.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={(event) => event.stopPropagation()}
        >
          {match.label}
        </a>,
      );
    } else {
      parts.push(
        <Link
          key={`${match.index}-${match.href}`}
          href={match.href}
          className={linkClass}
          onClick={(event) => event.stopPropagation()}
        >
          {match.label}
        </Link>,
      );
    }

    lastIndex = match.index + match.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

type MentionTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
  mentionClassName?: string;
};

export function MentionText({
  text,
  className,
  linkClassName,
  mentionClassName = "font-semibold text-violet-700 dark:text-violet-300",
}: MentionTextProps) {
  const nodes = useMemo(() => {
    const segments = splitTextWithMentionTokens(text);
    const parts: ReactNode[] = [];

    for (const segment of segments) {
      if (segment.type === "mention") {
        parts.push(
          <span key={`${segment.userId}-${parts.length}`} className={mentionClassName}>
            @{segment.label}
          </span>,
        );
      } else if (segment.value) {
        parts.push(...linkifySegment(segment.value, linkClassName));
      }
    }

    return parts.length > 0 ? parts : [text];
  }, [linkClassName, mentionClassName, text]);

  return (
    <span className={`[overflow-wrap:anywhere] break-words ${className ?? ""}`}>
      {nodes.map((node, index) => (
        <Fragment key={index}>{node}</Fragment>
      ))}
    </span>
  );
}
