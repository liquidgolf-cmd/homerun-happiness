import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API – not in TS lib; minimal types for dictation
interface SRResultItem {
  isFinal: boolean;
  length: number;
  0?: { transcript: string };
}
interface SRResultList {
  length: number;
  [i: number]: SRResultItem;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: SRResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

/**
 * Hook for dictation via Web Speech API. Calls onResult with each chunk of recognized text
 * (caller should append to their text state).
 */
export function useDictation(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<{ stop(): void } | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, []);

  const toggleMic = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    if (isListening) {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: { resultIndex: number; results: SRResultList }) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const transcript = r[0]?.transcript ?? '';
        if (r.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      const added = (final || interim).trim();
      if (added) {
        onResultRef.current(added);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, speechSupported, toggleMic };
}
