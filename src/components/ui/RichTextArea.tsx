"use client";

import { useRef } from "react";
import { applyHeaderBold, applyRichTextFormat, type RichTextFormat } from "@/lib/rich-text";
import { FormTextarea } from "@/components/ui/form-fields";

type RichTextAreaProps = {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  hint?: string;
  /** header = B bolds the current line only (section titles). inline = wrap selection. none = hide B. */
  boldMode?: "header" | "inline" | "none";
};

export function RichTextArea({
  id,
  label,
  value,
  onValueChange,
  rows = 4,
  hint,
  boldMode = "inline",
}: RichTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(format: RichTextFormat) {
    const field = textareaRef.current;
    if (!field) return;

    const result =
      format === "bold" && boldMode === "header"
        ? applyHeaderBold(value, field.selectionStart, field.selectionEnd)
        : applyRichTextFormat(value, field.selectionStart, field.selectionEnd, format);

    onValueChange(result.next);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(result.cursor, result.cursor);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-night-800">
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-xl bg-sand-100 p-1 ring-1 ring-night-900/10">
          {boldMode !== "none" ? (
            <button
              type="button"
              onClick={() => applyFormat("bold")}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-night-800 transition hover:bg-white"
              aria-label={
                boldMode === "header" ? "Bold section header" : "Bold selected text"
              }
              title={
                boldMode === "header"
                  ? "Bold header (current line)"
                  : "Bold (**text**)"
              }
            >
              B
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => applyFormat("italic")}
            className="rounded-lg px-2.5 py-1 text-xs italic text-night-800 transition hover:bg-white"
            aria-label="Italicize selected text"
            title="Italic (*text*)"
          >
            I
          </button>
        </div>
      </div>
      <FormTextarea
        ref={textareaRef}
        id={id}
        value={value}
        onValueChange={onValueChange}
        rows={rows}
      />
      <p className="mt-1 text-xs text-night-500">
        {hint ??
          (boldMode === "header"
            ? "Put the cursor on a section title line, then tap B to bold that header only."
            : boldMode === "none"
              ? "Select words, then tap I for italics."
              : "Select words, then tap B or I. Use **bold** or *italic* markers.")}
      </p>
    </div>
  );
}
