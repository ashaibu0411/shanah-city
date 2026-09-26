"use client";

import { useEffect, useRef, useState } from "react";
import {
  extensionForRecorderMime,
  pickMediaRecorderMimeType,
} from "@/lib/worship-audio-shared";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hasCapture, setHasCapture] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function clearCapture() {
    chunksRef.current = [];
    setHasCapture(false);
    setElapsed(0);
  }

  async function start() {
    setError(null);
    clearCapture();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMediaRecorderMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setHasCapture(chunksRef.current.length > 0);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => current + 1);
      }, 1000);
      return true;
    } catch {
      setError("Microphone access was denied. Allow the mic to record.");
      return false;
    }
  }

  function stop() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  function buildFile(namePrefix: string) {
    const chunks = chunksRef.current;
    if (chunks.length === 0) return null;
    const mimeType =
      mimeTypeRef.current ||
      chunks[0]?.type ||
      pickMediaRecorderMimeType() ||
      "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });
    const ext = extensionForRecorderMime(mimeType);
    return new File([blob], `${namePrefix}-${Date.now()}${ext}`, { type: mimeType });
  }

  return {
    recording,
    elapsed,
    hasCapture,
    error,
    setError,
    start,
    stop,
    buildFile,
    clearCapture,
  };
}

export function formatRecordingElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
