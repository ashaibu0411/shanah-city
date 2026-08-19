"use client";

import { useRef } from "react";
import { applyRichTextFormat, type RichTextFormat } from "@/lib/rich-text";
import { FormTextarea } from "@/components/ui/form-fields";

type RichTextAreaProps = {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  hint?: string;
};

export function RichTextArea({
  id,
  label,
  value,
  onValueChange,
  rows = 4,
  hint,
}: RichTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(format: RichTextFormat) {
    const field = textareaRef.current;
    if (!field) return;

    const { next, cursor } = applyRichTextFormat(
      value,
      field.selectionStart,
      field.selectionEnd,
      format,
    );
    onValueChange(next);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-night-800">
          {label}
        </label>
        <div className="flex items-center gap-1 rounded-xl bg-sand-100 p-1 ring-1 ring-night-900/10">
          <button
            type="button"
            onClick={() => applyFormat("bold")}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-night-800 transition hover:bg-white"
            aria-label="Bold selected text"
            title="Bold (**text**)"
          >
            B
          </button>
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
        {hint ?? "Select words, then tap B or I. Use **bold** or *italic* markers."}
      </p>
    </div>
  );
}
