import { useEffect, useRef } from 'react';
import { Message } from '@/types/conversation';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import TypingIndicator from './TypingIndicator';
import { TTSToggle } from './TTSToggle';
import { useTTS } from '@/contexts/TTSContext';

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
}

export default function ChatInterface({ messages, loading, onSendMessage, disabled = false, disabledMessage }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speakText, ttsEnabled } = useTTS();
  const lastMessageRef = useRef<string>('');
  const lastMessageIdRef = useRef<string>('');
  const isInitialLoadRef = useRef<boolean>(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Reset tracking when messages array changes significantly (new base stage)
  useEffect(() => {
    if (messages.length === 0) {
      // Reset refs when starting fresh on a new base
      lastMessageRef.current = '';
      lastMessageIdRef.current = '';
      isInitialLoadRef.current = true;
    }
  }, [messages.length]);

  // Auto-speak coach messages - only for NEW messages, not loaded ones
  useEffect(() => {
    if (messages.length > 0 && ttsEnabled && !loading) {
      const lastMessage = messages[messages.length - 1];
      
      // Handle initial load: speak if it's the first message (initial greeting for new base)
      if (isInitialLoadRef.current) {
        // Mark that we've processed initial load
        isInitialLoadRef.current = false;
        
        // If this is the first message and it's from the assistant, speak it (initial greeting)
        if (messages.length === 1 && lastMessage.role === 'assistant') {
          lastMessageRef.current = lastMessage.content;
          lastMessageIdRef.current = lastMessage.id;
          speakText(lastMessage.content);
          return;
        }
        
        // Otherwise, it's loading old messages - don't speak them
        lastMessageRef.current = lastMessage.content;
        lastMessageIdRef.current = lastMessage.id;
        return;
      }
      
      // Only speak assistant messages that are truly new (different ID or content)
      if (
        lastMessage.role === 'assistant' && 
        (lastMessage.id !== lastMessageIdRef.current || lastMessage.content !== lastMessageRef.current)
      ) {
        lastMessageRef.current = lastMessage.content;
        lastMessageIdRef.current = lastMessage.id;
        speakText(lastMessage.content);
      }
    }
  }, [messages, ttsEnabled, loading, speakText]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with TTS Toggle */}
      <div className="bg-loam-brown px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-semibold">Conversation</h3>
        <TTSToggle />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">Start your conversation</p>
            <p className="text-sm">The coach will guide you through the HomeRun Method to discover your deepest truths.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      {disabled && disabledMessage && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-sm text-amber-800 text-center">{disabledMessage}</p>
        </div>
      )}
      
      <InputBar onSend={onSendMessage} disabled={loading || disabled} />
    </div>
  );
}