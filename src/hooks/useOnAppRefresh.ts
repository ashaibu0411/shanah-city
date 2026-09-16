"use client";

import { useEffect, useRef } from "react";
import { subscribeAppRefresh } from "@/lib/app-refresh";

export function useOnAppRefresh(handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => subscribeAppRefresh(() => handlerRef.current()), []);
}
