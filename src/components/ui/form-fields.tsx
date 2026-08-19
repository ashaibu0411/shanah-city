"use client";

import { forwardRef } from "react";
import type { ClipboardEvent, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClassName =
  "mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-base outline-none ring-night-900/5 selection:bg-violet-200 selection:text-night-900 focus:ring-2 md:text-sm";

export function mergePastedText(
  current: string,
  pasted: string,
  selectionStart: number | null,
  selectionEnd: number | null,
) {
  const start = selectionStart ?? current.length;
  const end = selectionEnd ?? current.length;
  return `${current.slice(0, start)}${pasted}${current.slice(end)}`;
}

function handlePaste(
  value: string,
  onValueChange: (next: string) => void,
) {
  return (event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text/plain");
    if (!pasted) return;

    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    onValueChange(mergePastedText(value, pasted, selectionStart, selectionEnd));
  };
}

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function FormInput({ value, onValueChange, className = "", ...props }: FormInputProps) {
  return (
    <input
      {...props}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onPaste={handlePaste(value, onValueChange)}
      autoComplete="off"
      autoCorrect="off"
      spellCheck
      className={`${fieldClassName} ${className}`.trim()}
    />
  );
}

type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ value, onValueChange, className = "", ...props }, ref) {
    return (
      <textarea
        {...props}
        ref={ref}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onPaste={handlePaste(value, onValueChange)}
        autoComplete="off"
        autoCorrect="on"
        spellCheck
        className={`${fieldClassName} ${className}`.trim()}
      />
    );
  },
);
