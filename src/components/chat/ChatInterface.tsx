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
}

export default function ChatInterface({ messages, loading, onSendMessage }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speakText, ttsEnabled } = useTTS();
  const lastMessageRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-speak coach messages
  useEffect(() => {
    if (messages.length > 0 && ttsEnabled) {
      const lastMessage = messages[messages.length - 1];
      // Only speak assistant messages that are new
      if (lastMessage.role === 'assistant' && lastMessage.content !== lastMessageRef.current) {
        lastMessageRef.current = lastMessage.content;
        speakText(lastMessage.content);
      }
    }
  }, [messages, ttsEnabled, speakText]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with TTS Toggle */}
      <div className="bg-gradient-to-r from-homerun-blue to-blue-600 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-semibold">Conversation</h3>
        <TTSToggle />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">Start your conversation</p>
            <p className="text-sm">The coach will guide you through The 5 Whys to discover your deepest truths.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      <InputBar onSend={onSendMessage} disabled={loading} />
    </div>
  );
}