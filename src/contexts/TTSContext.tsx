import { createContext, useContext, useState, ReactNode } from 'react';

interface TTSContextType {
  ttsEnabled: boolean;
  toggleTTS: () => Promise<void>;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

let currentAudio: HTMLAudioElement | null = null;

// Normalize text to prevent TTS from spelling out all-caps words
const normalizeTextForTTS = (text: string): string => {
  // Convert common all-caps words to proper case
  const normalized = text
    .replace(/\b(WHO|WHAT|WHY|HOW|MATTERS)\b/g, (match) => {
      const word = match.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    // Also handle other all-caps words (3+ letters) that might be spelled out
    .replace(/\b([A-Z]{3,})\b/g, (match) => {
      // Only convert if it's not an acronym (all caps, 3+ letters, but not common acronyms)
      const commonAcronyms = ['AI', 'API', 'PDF', 'URL', 'TTS', 'MVP'];
      if (commonAcronyms.includes(match)) return match;
      // Convert to title case
      return match.charAt(0) + match.slice(1).toLowerCase();
    });
  
  return normalized;
};

// Fallback to browser's Web Speech API if Google TTS fails
const speakWithBrowserTTS = (text: string): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const normalizedText = normalizeTextForTTS(text);
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
};

const speakTextImpl = async (text: string): Promise<void> => {
  try {
    // Stop any ongoing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Normalize text before sending to TTS
    const normalizedText = normalizeTextForTTS(text);
    
    console.log('[TTS] Attempting Google Cloud TTS for text:', normalizedText.substring(0, 50) + (normalizedText.length > 50 ? '...' : ''));
    
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: normalizedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS API request failed');
      }

      const data = await response.json();
      const audioDataUrl = data.audioDataUrl;
      
      if (!audioDataUrl) {
        throw new Error('TTS API returned empty audio data');
      }
      
      console.log('[TTS] Received audio data from Google Cloud TTS');
      
      const audio = new Audio(audioDataUrl);
      currentAudio = audio;
      
      audio.onended = () => {
        console.log('[TTS] Google Cloud TTS audio playback completed');
        currentAudio = null;
      };
      
      audio.onerror = (error) => {
        console.error('[TTS] Audio playback error:', error);
        currentAudio = null;
        console.log('[TTS] Falling back to browser TTS due to playback error');
        speakWithBrowserTTS(normalizedText);
      };
      
      await audio.play();
      console.log('[TTS] Google Cloud TTS audio playing');
      return;
    } catch (apiError: any) {
      console.warn('[TTS] Google Cloud TTS failed, using browser fallback:', apiError?.message);
      console.log('[TTS] Using browser built-in TTS as fallback');
      speakWithBrowserTTS(normalizedText);
    }
  } catch (error: any) {
    console.error('[TTS] Unexpected error:', error);
    speakWithBrowserTTS(normalizeTextForTTS(text));
  }
};

const stopSpeakingImpl = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export function TTSProvider({ children }: { children: ReactNode }) {
  const [ttsEnabled, setTtsEnabled] = useState(true); // TTS enabled by default

  const toggleTTS = async () => {
    stopSpeakingImpl();
    
    const newTtsEnabled = !ttsEnabled;
    setTtsEnabled(newTtsEnabled);
    console.log('[TTS] Toggle TTS:', newTtsEnabled ? 'ON' : 'OFF');
    
    const announcement = newTtsEnabled ? 'Text to speech on' : 'Text to speech off';
    await speakTextImpl(announcement);
  };

  const speakText = async (text: string) => {
    if (ttsEnabled) {
      await speakTextImpl(text);
    }
  };

  const stopSpeaking = stopSpeakingImpl;

  return (
    <TTSContext.Provider value={{ ttsEnabled, toggleTTS, speakText, stopSpeaking }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
}
