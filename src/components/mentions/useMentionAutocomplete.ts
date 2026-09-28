"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterMentionMembers,
  findActiveMentionQuery,
  formatMentionAllToken,
  formatMentionToken,
  insertMentionAt,
  type MentionMember,
} from "@/lib/mentions";

type UseMentionAutocompleteOptions = {
  value: string;
  onChange: (value: string) => void;
  members: MentionMember[];
  allowAll?: boolean;
  enabled?: boolean;
  getCursor?: () => number;
  setCursor?: (index: number) => void;
};

export function useMentionAutocomplete({
  value,
  onChange,
  members,
  allowAll = false,
  enabled = true,
  getCursor,
  setCursor,
}: UseMentionAutocompleteOptions) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [cursor, setLocalCursor] = useState(0);

  const activeQuery = useMemo(() => {
    if (!enabled) return null;
    const position = getCursor?.() ?? cursor;
    return findActiveMentionQuery(value, position);
  }, [cursor, enabled, getCursor, value]);

  const filteredMembers = useMemo(
    () => (activeQuery ? filterMentionMembers(members, activeQuery.query) : []),
    [activeQuery, members],
  );

  const rowCount = filteredMembers.length + (allowAll && activeQuery ? 1 : 0);

  useEffect(() => {
    if (activeQuery) {
      setOpen(true);
      setHighlightIndex(0);
    } else {
      setOpen(false);
    }
  }, [activeQuery?.atIndex, activeQuery?.query]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const applyMember = useCallback(
    (member: MentionMember) => {
      if (!activeQuery) return;
      const token = formatMentionToken(member.name, member.id);
      const next = insertMentionAt(value, activeQuery.atIndex, activeQuery.query.length, token);
      onChange(next);
      const nextCursor = activeQuery.atIndex + token.length + 1;
      setCursor?.(nextCursor);
      setLocalCursor(nextCursor);
      close();
    },
    [activeQuery, close, onChange, setCursor, value],
  );

  const applyAll = useCallback(() => {
    if (!activeQuery || !allowAll) return;
    const token = formatMentionAllToken();
    const next = insertMentionAt(value, activeQuery.atIndex, activeQuery.query.length, token);
    onChange(next);
    const nextCursor = activeQuery.atIndex + token.length + 1;
    setCursor?.(nextCursor);
    setLocalCursor(nextCursor);
    close();
  }, [activeQuery, allowAll, close, onChange, setCursor, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open || !activeQuery || rowCount === 0) return false;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((current) => (current + 1) % rowCount);
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((current) => (current - 1 + rowCount) % rowCount);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        if (allowAll && highlightIndex === 0) {
          applyAll();
        } else {
          const memberIndex = allowAll ? highlightIndex - 1 : highlightIndex;
          const member = filteredMembers[memberIndex];
          if (member) applyMember(member);
        }
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return true;
      }
      return false;
    },
    [
      activeQuery,
      allowAll,
      applyAll,
      applyMember,
      close,
      filteredMembers,
      highlightIndex,
      open,
      rowCount,
    ],
  );

  function onSelectFromPicker(member: MentionMember) {
    applyMember(member);
  }

  function onSelectAllFromPicker() {
    applyAll();
  }

  function trackMentionCursor(index: number) {
    setLocalCursor(index);
  }

  return {
    mentionOpen: open && Boolean(activeQuery),
    mentionMembers: filteredMembers,
    mentionHighlightIndex: highlightIndex,
    setMentionHighlightIndex: setHighlightIndex,
    onMentionKeyDown: handleKeyDown,
    onMentionSelect: onSelectFromPicker,
    onMentionSelectAll: allowAll ? onSelectAllFromPicker : undefined,
    trackMentionCursor,
    closeMentionPicker: close,
  };
}

export function useMentionMembers(groupId?: string) {
  const [members, setMembers] = useState<MentionMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", groupId);
    fetch(`/api/members/mentionable?${params.toString()}`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setMembers(data.members ?? []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  return { members, loading };
}
