# Google Cloud Text-to-Speech Setup Guide

This app uses Google Cloud Text-to-Speech to provide voice narration for the coach's messages.

## Features

- **Google Cloud TTS**: High-quality neural voices for professional narration
- **Browser Fallback**: Automatically falls back to browser's built-in TTS if Google Cloud TTS fails
- **Toggle Control**: Users can turn voice narration on/off anytime
- **Auto-Speak**: Coach messages are automatically narrated when TTS is enabled

## Quick Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. **Enable billing** (required - free tier includes 0-4 million characters/month)

### 2. Enable Text-to-Speech API

1. Go to [Text-to-Speech API](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com)
2. Select your project
3. Click "Enable"

### 3. Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **"Create Service Account"**
3. Name it: `homerun-tts-service`
4. Click **"Create and Continue"**
5. Select role: **"Cloud Text-to-Speech API User"**
6. Click **"Done"**

### 4. Generate JSON Key

1. Click on the service account you created
2. Go to **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"** (file downloads automatically)

### 5. Minify JSON for Vercel

Vercel requires JSON on a single line. Use one of these methods:

**Option A: Using jq (recommended)**
```bash
cat ~/Downloads/your-service-account.json | jq -c .
```

**Option B: Using Node.js**
```bash
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('~/Downloads/your-service-account.json', 'utf8'))))"
```

**Option C: Online tool**
- Go to https://jsonformatter.org/json-minify
- Paste your JSON, click "Minify", copy result

### 6. Add to Vercel Environment Variables

1. Go to your Vercel project
2. **Settings** > **Environment Variables**
3. Add `GOOGLE_TTS_CREDENTIALS` with the minified JSON
4. Select all environments (Production, Preview, Development)
5. **Important:** Redeploy after adding variables!

## Voice Options

| Voice Name | Gender | Type | Description |
|------------|--------|------|-------------|
| `en-US-Neural2-D` | Male | Neural | Natural, clear (default) |
| `en-US-Neural2-F` | Female | Neural | Natural, clear |
| `en-US-Neural2-J` | Male | Neural | Expressive, conversational |
| `en-US-Neural2-A` | Male | Neural | Warm, friendly |
| `en-US-Neural2-C` | Female | Neural | Professional |

See [all available voices](https://cloud.google.com/text-to-speech/docs/voices)

## Environment Variables

### Required
```env
GOOGLE_TTS_CREDENTIALS={"type":"service_account","project_id":"..."}
```

### Optional (with defaults)
```env
GOOGLE_TTS_VOICE_NAME=en-US-Neural2-D
GOOGLE_TTS_VOICE_GENDER=MALE
GOOGLE_TTS_SPEAKING_RATE=1.0    # 0.25-4.0 (1.0 = normal)
GOOGLE_TTS_PITCH=0.0             # -20.0 to 20.0
GOOGLE_TTS_VOLUME=0.0            # Volume gain in dB
```

## Testing

After deployment:

1. ✅ Navigate to At Bat or First Base
2. ✅ See "Voice ON" button in chat header
3. ✅ Send a message - coach's response should be spoken
4. ✅ Click "Voice OFF" to disable
5. ✅ Check browser console for TTS logs

## Troubleshooting

### "TTS service not configured"
- Verify `GOOGLE_TTS_CREDENTIALS` is set in Vercel
- Ensure JSON is minified (all on one line)
- Redeploy application

### "Permission denied"
- Check service account has "Cloud Text-to-Speech API User" role
- Wait 1-2 minutes for changes to propagate

### "API not enabled"
- Enable Text-to-Speech API in Google Cloud Console
- Wait for API to be enabled (~30 seconds)

### Works locally but not in production
- Verify environment variables are set for "Production"
- Check Vercel deployment logs
- Trigger a new deployment

### Audio doesn't play
- Check browser console for errors
- Browser fallback TTS should work even if Google TTS fails
- Verify autoplay is allowed in browser settings

## Pricing

**Google Cloud Text-to-Speech:**
- **Free tier**: 0-4 million characters/month
- **Neural2 voices**: $16/million characters after free tier

**Estimated usage:**
- 1,000 messages/month × 100 chars = 100,000 chars = **FREE**
- 10,000 messages/month × 100 chars = 1M chars = **FREE**

[Current pricing](https://cloud.google.com/text-to-speech/pricing)

## How It Works

1. User sends a message
2. Coach responds with text
3. If TTS is enabled:
   - Try Google Cloud TTS first (high quality)
   - If that fails, use browser TTS (fallback)
4. Audio plays automatically
5. User can toggle TTS on/off anytime

---

**Need help?** Check the [full implementation guide](TTS_IMPLEMENTATION_GUIDE.md) or Google Cloud documentation.
