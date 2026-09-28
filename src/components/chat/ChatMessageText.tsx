"use client";

import { MentionText } from "@/components/mentions/MentionText";

export type ChatMessageTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function ChatMessageText({ text, className, linkClassName }: ChatMessageTextProps) {
  return (
    <p className={`[overflow-wrap:anywhere] break-words ${className ?? ""}`}>
      <MentionText text={text} linkClassName={linkClassName} />
    </p>
  );
}
