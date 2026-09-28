"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { MentionPicker } from "@/components/mentions/MentionPicker";
import { useMentionAutocomplete } from "@/components/mentions/useMentionAutocomplete";
import type { MentionMember } from "@/lib/mentions";

type MentionFieldBaseProps = {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  allowAll?: boolean;
  mentionEnabled?: boolean;
  pickerClassName?: string;
};

type MentionInputProps = MentionFieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

type MentionTextareaProps = MentionFieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">;

function useMentionFieldCore(props: MentionFieldBaseProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const cursorRef = useRef(0);

  const {
    mentionOpen,
    mentionMembers,
    mentionHighlightIndex,
    setMentionHighlightIndex,
    onMentionKeyDown,
    onMentionSelect,
    onMentionSelectAll,
    trackMentionCursor,
  } = useMentionAutocomplete({
    value: props.value,
    onChange: props.onChange,
    members: props.members,
    allowAll: props.allowAll,
    enabled: props.mentionEnabled !== false,
    getCursor: () => cursorRef.current,
    setCursor: (index) => {
      cursorRef.current = index;
      const node = inputRef.current;
      if (node) {
        node.focus();
        node.setSelectionRange(index, index);
      }
    },
  });

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    cursorRef.current = node.selectionStart ?? props.value.length;
  }, [props.value]);

  function syncCursor() {
    const node = inputRef.current;
    if (!node) return;
    const index = node.selectionStart ?? props.value.length;
    cursorRef.current = index;
    trackMentionCursor(index);
  }

  return {
    inputRef,
    syncCursor,
    mentionOpen,
    mentionMembers,
    mentionHighlightIndex,
    setMentionHighlightIndex,
    onMentionKeyDown,
    onMentionSelect,
    onMentionSelectAll,
  };
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(function MentionInput(
  {
    value,
    onChange,
    members,
    allowAll = false,
    mentionEnabled = true,
    pickerClassName,
    className,
    onKeyDown,
    ...rest
  },
  forwardedRef,
) {
  const core = useMentionFieldCore({
    value,
    onChange,
    members,
    allowAll,
    mentionEnabled,
  });

  function setInputRef(node: HTMLInputElement | null) {
    core.inputRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      {core.mentionOpen ? (
        <MentionPicker
          open
          members={core.mentionMembers}
          highlightIndex={core.mentionHighlightIndex}
          onHighlight={core.setMentionHighlightIndex}
          onSelect={core.onMentionSelect}
          onSelectAll={core.onMentionSelectAll}
          allowAll={allowAll}
          className={`absolute bottom-full left-0 mb-1 w-full min-w-[14rem] ${pickerClassName ?? ""}`}
        />
      ) : null}
      <input
        {...rest}
        ref={setInputRef}
        value={value}
        className={className}
        onChange={(event) => {
          onChange(event.target.value);
          core.syncCursor();
        }}
        onClick={core.syncCursor}
        onKeyUp={core.syncCursor}
        onKeyDown={(event) => {
          if (core.onMentionKeyDown(event)) return;
          onKeyDown?.(event);
        }}
      />
    </div>
  );
});

export function MentionTextarea({
  value,
  onChange,
  members,
  allowAll = false,
  mentionEnabled = true,
  pickerClassName,
  className,
  onKeyDown,
  ...rest
}: MentionTextareaProps) {
  const core = useMentionFieldCore({
    value,
    onChange,
    members,
    allowAll,
    mentionEnabled,
  });

  return (
    <div className="relative min-w-0">
      {core.mentionOpen ? (
        <MentionPicker
          open
          members={core.mentionMembers}
          highlightIndex={core.mentionHighlightIndex}
          onHighlight={core.setMentionHighlightIndex}
          onSelect={core.onMentionSelect}
          onSelectAll={core.onMentionSelectAll}
          allowAll={allowAll}
          className={`absolute bottom-full left-0 mb-1 w-full min-w-[14rem] ${pickerClassName ?? ""}`}
        />
      ) : null}
      <textarea
        {...rest}
        ref={core.inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        className={className}
        onChange={(event) => {
          onChange(event.target.value);
          core.syncCursor();
        }}
        onClick={core.syncCursor}
        onKeyUp={core.syncCursor}
        onKeyDown={(event) => {
          if (core.onMentionKeyDown(event)) return;
          onKeyDown?.(event);
        }}
      />
    </div>
  );
}
