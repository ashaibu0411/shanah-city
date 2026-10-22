"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MARRIAGE_COUNSELOR_CUSTOM_TOPIC_LABEL } from "@/lib/marriage-counselor-session-topics-shared";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  /** Form field name; renders a hidden input with the resolved topic string. */
  name?: string;
  value?: string;
  onChange?: (topic: string) => void;
  inputClassName?: string;
  required?: boolean;
};

export function MarriageCounselorSessionTopicField({
  name = "topic",
  value = "",
  onChange,
  inputClassName = "marriage-c3m-input",
  required,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [topics, setTopics] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const resolvedTopic = customMode ? customText.trim() : value.trim();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marriage/counselor/session-topics", { cache: "no-store" });
      const data = await readJsonResponse<{ topics?: string[]; error?: string }>(res);
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load topics.");
        return;
      }
      setTopics(data.topics ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!value || topics.length === 0) return;
    const match = topics.some((t) => t === value);
    if (match) {
      setCustomMode(false);
      setCustomText("");
      setQuery(value);
    } else {
      setCustomMode(true);
      setCustomText(value);
      setQuery("");
    }
  }, [value, topics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? topics.filter((t) => t.toLowerCase().includes(q)) : topics;
    return base;
  }, [query, topics]);

  const listOptions = useMemo(
    () => [...filtered, MARRIAGE_COUNSELOR_CUSTOM_TOPIC_LABEL],
    [filtered],
  );

  const selectPreset = useCallback(
    (title: string) => {
      setCustomMode(false);
      setCustomText("");
      setQuery(title);
      onChange?.(title);
      setOpen(false);
    },
    [onChange],
  );

  const selectCustom = useCallback(() => {
    setCustomMode(true);
    setOpen(false);
    onChange?.(customText.trim());
    requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLInputElement>("[data-custom-topic]")?.focus();
    });
  }, [customText, onChange]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, listOptions.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && open && listOptions.length > 0) {
      e.preventDefault();
      const pick = listOptions[highlightIndex];
      if (pick === MARRIAGE_COUNSELOR_CUSTOM_TOPIC_LABEL) selectCustom();
      else selectPreset(pick);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="marriage-session-topic-field">
      <label className="text-sm font-semibold text-[#292219] dark:text-sand-100" htmlFor={`${listId}-search`}>
        Session topic
      </label>
      {loadError ? (
        <p className="mt-1 text-xs text-red-800 dark:text-red-300">{loadError}</p>
      ) : null}

      <input type="hidden" name={name} value={resolvedTopic} required={required} />

      {!customMode ? (
        <div className="relative mt-1">
          <input
            id={`${listId}-search`}
            ref={searchRef}
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-listbox`}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Search curriculum modules & topics…"
            className={inputClassName}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlightIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onSearchKeyDown}
          />
          {open && listOptions.length > 0 && (
            <ul
              id={`${listId}-listbox`}
              role="listbox"
              className="marriage-session-topic-list"
            >
              {listOptions.map((option, index) => {
                const isCustom = option === MARRIAGE_COUNSELOR_CUSTOM_TOPIC_LABEL;
                return (
                  <li key={option} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === highlightIndex}
                      className={`marriage-session-topic-option${index === highlightIndex ? " is-active" : ""}${
                        isCustom ? " is-custom" : ""
                      }`}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => {
                        if (isCustom) selectCustom();
                        else selectPreset(option);
                      }}
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-1 space-y-2">
          <input
            data-custom-topic
            type="text"
            className={inputClassName}
            placeholder="Enter custom session topic"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              onChange?.(e.target.value.trim());
            }}
            aria-label="Custom session topic"
          />
          <button
            type="button"
            className="text-sm font-semibold text-[#B85C38]"
            onClick={() => {
              setCustomMode(false);
              setCustomText("");
              setQuery("");
              onChange?.("");
              searchRef.current?.focus();
            }}
          >
            ← Choose from curriculum list
          </button>
        </div>
      )}
    </div>
  );
}
