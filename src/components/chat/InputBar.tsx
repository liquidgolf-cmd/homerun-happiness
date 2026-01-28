import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

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

export default function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<{ stop(): void } | null>(null);

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const toggleMic = () => {
    const SR = getSpeechRecognition();
    if (!SR || disabled) return;

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
        setMessage((prev) => (prev ? `${prev} ${added}` : added));
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
    } catch (err) {
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              speechSupported
                ? 'Type your answer or use the mic to dictate... (Enter to send, Shift+Enter for new line)'
                : 'Type your answer... (Enter to send, Shift+Enter for new line)'
            }
            className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled || !speechSupported}
            aria-label={
              !speechSupported
                ? 'Dictation not supported in this browser'
                : isListening
                  ? 'Stop dictation'
                  : 'Start dictation'
            }
            title={
              !speechSupported
                ? 'Dictation not supported in this browser'
                : isListening
                  ? 'Stop dictation'
                  : 'Dictate your answer'
            }
            className={`flex-shrink-0 self-end flex items-center justify-center w-12 h-12 rounded-loam font-medium transition ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isListening ? (
              <StopIcon className="w-6 h-6" aria-hidden />
            ) : (
              <MicrophoneIcon className="w-6 h-6" aria-hidden />
            )}
          </button>
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-3 bg-loam-green text-white rounded-loam font-medium hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {speechSupported ? 'Type or use the mic to dictate. Press Enter to send, Shift+Enter for new line.' : 'Press Enter to send, Shift+Enter for new line'}
      </p>
      {isListening && (
        <p className="mt-1 text-xs text-red-600 font-medium" role="status">
          Listening… speak now. Click the mic again to stop.
        </p>
      )}
    </form>
  );
}
