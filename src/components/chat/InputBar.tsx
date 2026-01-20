import { useState, FormEvent, KeyboardEvent } from 'react';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [message, setMessage] = useState('');

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

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-3 items-end">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
          className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 border border-gray-300 rounded-loam focus:ring-2 focus:ring-loam-brown focus:border-transparent resize-none transition disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-3 bg-loam-green text-white rounded-loam font-medium hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}