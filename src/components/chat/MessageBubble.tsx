import { Message } from '@/types/conversation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-loam px-4 py-3 ${
          isUser
            ? 'bg-loam-brown text-white'
            : 'bg-loam-neutral text-loam-charcoal'
        }`}
      >
        {isAssistant && message.why_level && (
          <div className="text-xs font-medium mb-1 text-gray-600">
            Why Level {message.why_level}/5
          </div>
        )}
        
        {message.is_vague && (
          <div className="flex items-center gap-1 mb-2 text-amber-600 text-xs font-medium">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>Vague answer detected</span>
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}