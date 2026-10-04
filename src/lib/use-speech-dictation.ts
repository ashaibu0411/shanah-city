"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useSpeechDictation() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onPhrase: (transcript: string, isFinal: boolean) => void) => {
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        setError("Speech-to-text is not supported in this browser.");
        return false;
      }

      setError(null);
      recognitionRef.current?.abort();

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript?.trim();
          if (!transcript) continue;
          onPhrase(transcript, result.isFinal);
        }
      };
      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          setError("Could not transcribe speech. Try again or type your message.");
        }
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setListening(true);
        return true;
      } catch {
        setError("Could not start speech-to-text.");
        return false;
      }
    },
    [],
  );

  return { listening, error, setError, start, stop };
}
