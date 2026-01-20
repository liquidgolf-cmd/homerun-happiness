import { createContext, useContext, useState, ReactNode } from 'react';

interface TTSContextType {
  ttsEnabled: boolean;
  toggleTTS: () => Promise<void>;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

let currentAudio: HTMLAudioElement | null = null;

// Fallback to browser's Web Speech API if Google TTS fails
const speakWithBrowserTTS = (text: string): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
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

    console.log('[TTS] Attempting Google Cloud TTS for text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
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
        speakWithBrowserTTS(text);
      };
      
      await audio.play();
      console.log('[TTS] Google Cloud TTS audio playing');
      return;
    } catch (apiError: any) {
      console.warn('[TTS] Google Cloud TTS failed, using browser fallback:', apiError?.message);
      console.log('[TTS] Using browser built-in TTS as fallback');
      speakWithBrowserTTS(text);
    }
  } catch (error: any) {
    console.error('[TTS] Unexpected error:', error);
    speakWithBrowserTTS(text);
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
