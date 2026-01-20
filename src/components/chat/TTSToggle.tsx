import { useTTS } from '@/contexts/TTSContext';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

export function TTSToggle() {
  const { ttsEnabled, toggleTTS } = useTTS();

  return (
    <button
      onClick={toggleTTS}
      className={`
        relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-all duration-200 shadow-sm hover:shadow-md
        ${ttsEnabled 
          ? 'bg-homerun-green hover:bg-green-600 text-white' 
          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
        }
      `}
      aria-label="Toggle text-to-speech"
      aria-pressed={ttsEnabled}
      title={ttsEnabled ? 'Turn off voice narration' : 'Turn on voice narration'}
    >
      {ttsEnabled ? (
        <SpeakerWaveIcon className="w-5 h-5" />
      ) : (
        <SpeakerXMarkIcon className="w-5 h-5" />
      )}
      <span className="hidden sm:inline">
        Voice {ttsEnabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
