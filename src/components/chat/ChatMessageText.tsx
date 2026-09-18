"use client";

import { Fragment, useMemo, type ReactNode } from "react";

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>\[\]{}|\\^`"]+/gi;

function trimTrailingUrlPunctuation(url: string) {
  let trimmed = url;
  while (/[.,;:!?)}\]'"\u201d]$/.test(trimmed)) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

function hrefForUrl(url: string) {
  return url.toLowerCase().startsWith("www.") ? `https://${url}` : url;
}

export type ChatMessageTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function ChatMessageText({ text, className, linkClassName }: ChatMessageTextProps) {
  const nodes = useMemo(() => {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    const regex = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const raw = match[0];
      const url = trimTrailingUrlPunctuation(raw);
      const trailing = raw.slice(url.length);
      parts.push(
        <a
          key={`${match.index}-${url}`}
          href={hrefForUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClassName ?? ""} break-all`}
          onClick={(event) => event.stopPropagation()}
        >
          {url}
        </a>,
      );
      if (trailing) {
        parts.push(trailing);
      }
      lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  }, [text, linkClassName]);

  return (
    <p className={`[overflow-wrap:anywhere] break-words ${className ?? ""}`}>
      {nodes.map((node, index) => (
        <Fragment key={index}>{node}</Fragment>
      ))}
    </p>
  );
}
