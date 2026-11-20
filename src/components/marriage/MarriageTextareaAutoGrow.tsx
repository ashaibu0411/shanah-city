"use client";

import { useEffect } from "react";

/**
 * Keep narrative answer fields visible across the Marriage Counseling workspace.
 * Does not touch inputs, change form values, trigger saves, or affect other app pages.
 * Handles both controlled and defaultValue textareas, including those added later.
 */
export function MarriageTextareaAutoGrow() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".marriage-prep-layout");
    if (!root) return;

    const expand = (field: HTMLTextAreaElement) => {
      if (field.dataset.noAutogrow === "true") return;
      // Do not overwrite the text or dispatch synthetic events.
      field.style.height = "auto";
      const styles = window.getComputedStyle(field);
      const minimum = Math.max(128, parseFloat(styles.minHeight) || 0);
      field.style.height = Math.max(minimum, field.scrollHeight) + "px";
    };

    const expandAll = () => {
      root.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(expand);
    };

    let frame = 0;
    const queue = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        expandAll();
      });
    };
    const handleInput = (event: Event) => {
      if (event.target instanceof HTMLTextAreaElement && root.contains(event.target)) {
        expand(event.target);
      }
    };

    // Newly mounted forms and loaded drafts need sizing even before input.
    const observer = new MutationObserver(queue);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleInput);
    root.addEventListener("focusin", handleInput);
    window.addEventListener("resize", queue);
    queue();

    return () => {
      observer.disconnect();
      root.removeEventListener("input", handleInput);
      root.removeEventListener("change", handleInput);
      root.removeEventListener("focusin", handleInput);
      window.removeEventListener("resize", queue);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
