import { Message } from '@/types/conversation';
import { ExclamationTriangleIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useTTS } from '@/contexts/TTSContext';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const { speakText, ttsEnabled } = useTTS();

  const handleReplay = () => {
    speakText(message.content);
  };

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

        <div className="flex items-start gap-2">
          <div className="flex-1 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {isAssistant && ttsEnabled && (
            <button
              onClick={handleReplay}
              className="flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Replay message"
              title="Replay message"
            >
              <SpeakerWaveIcon className="w-4 h-4 text-loam-brown" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}