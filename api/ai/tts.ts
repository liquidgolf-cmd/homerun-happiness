import { VercelRequest, VercelResponse } from '@vercel/node';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize Google TTS client
let ttsClient: TextToSpeechClient | null = null;

function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    const credentialsJson = process.env.GOOGLE_TTS_CREDENTIALS;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (credentialsJson) {
      try {
        const credentials = JSON.parse(credentialsJson);
        ttsClient = new TextToSpeechClient({
          credentials: credentials,
          projectId: credentials.project_id,
        });
      } catch (error: any) {
        console.error('Error parsing GOOGLE_TTS_CREDENTIALS:', error);
        throw new Error(`GOOGLE_TTS_CREDENTIALS must be valid JSON: ${error.message}`);
      }
    } else if (credentialsPath) {
      ttsClient = new TextToSpeechClient({
        keyFilename: credentialsPath,
      });
    } else {
      try {
        ttsClient = new TextToSpeechClient();
      } catch (error: any) {
        console.error('Failed to initialize TTS client:', error);
        throw new Error('Google TTS not configured. Please set GOOGLE_TTS_CREDENTIALS');
      }
    }
  }
  return ttsClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const client = getTTSClient();
    const voiceName = process.env.GOOGLE_TTS_VOICE_NAME || 'en-US-Neural2-D';
    
    // Auto-detect gender from voice name
    let ssmlGender: 'MALE' | 'FEMALE';
    if (process.env.GOOGLE_TTS_VOICE_GENDER) {
      const envGender = process.env.GOOGLE_TTS_VOICE_GENDER.toUpperCase();
      if (envGender === 'MALE' || envGender === 'FEMALE') {
        ssmlGender = envGender as 'MALE' | 'FEMALE';
      } else {
        ssmlGender = voiceName.includes('-F') || voiceName.includes('-C') ? 'FEMALE' : 'MALE';
      }
    } else {
      ssmlGender = voiceName.includes('-F') || voiceName.includes('-C') ? 'FEMALE' : 'MALE';
    }
    
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'en-US',
        ssmlGender: ssmlGender,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: parseFloat(process.env.GOOGLE_TTS_SPEAKING_RATE || '1.0'),
        pitch: parseFloat(process.env.GOOGLE_TTS_PITCH || '0.0'),
        volumeGainDb: parseFloat(process.env.GOOGLE_TTS_VOLUME || '0.0'),
      },
    });

    if (!response.audioContent) {
      return res.status(500).json({ error: 'Failed to generate audio' });
    }

    const audioBase64 = (response.audioContent as Buffer).toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

    return res.status(200).json({ audioDataUrl });
  } catch (error: any) {
    console.error('TTS Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    
    if (error.message?.includes('GOOGLE_TTS_CREDENTIALS') || 
        error.message?.includes('credentials') ||
        error.message?.includes('not configured')) {
      return res.status(500).json({ 
        error: 'TTS service not configured. Please set GOOGLE_TTS_CREDENTIALS environment variable.',
        details: error.message 
      });
    }
    
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      return res.status(500).json({ 
        error: 'TTS API permission denied. Please check service account has Text-to-Speech API User role.',
        details: error.message 
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.code || 'Unknown error'
    });
  }
}
