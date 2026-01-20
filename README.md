# HomeRun to Happiness - MVP

AI-powered conversational coaching application that guides users through a 5-stage framework using The 5 Whys methodology with a direct, empathetic coaching voice.

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth)
- **AI**: Anthropic Claude Sonnet 4
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Build Tool**: Vite

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_APP_URL=http://localhost:5173
VITE_MODEL=claude-sonnet-4-20250514
VITE_MAX_TOKENS=2000
```

### 3. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the migration SQL from `../homerun-mvp-package/database-schema.sql`
4. Copy your project URL and anon key to `.env`

### 4. Setup Anthropic

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env` as `VITE_ANTHROPIC_API_KEY`

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

- **Direct AI Coaching**: No-BS coaching personality that challenges vague answers
- **The 5 Whys Method**: Asks "why" 5 times to reach root motivations
- **Vague Answer Detection**: Automatically detects and challenges surface-level responses
- **Progress Tracking**: Visual baseball diamond showing journey progress
- **Conversation Persistence**: All progress saved in Supabase
- **Mobile Responsive**: Works beautifully on all devices

## Project Structure

```
homerun-app/
├── src/
│   ├── components/
│   │   ├── auth/          # Login & Signup forms
│   │   ├── chat/          # Chat interface components
│   │   └── progress/      # Progress tracking components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core libraries (Supabase, Anthropic)
│   ├── pages/             # Page components
│   ├── types/             # TypeScript types
│   └── utils/             # Constants and utilities
├── .env                   # Environment variables (create this)
└── package.json
```

## User Journey

1. **Landing** → Introduction and framework explanation
2. **Assessment** → Pre-assessment quiz (4 questions)
3. **Path Selection** → Choose Business or Personal journey
4. **At Bat** → Discover WHY (5 Whys sequence)
5. **First Base** → Discover WHO (5 Whys sequence)
6. **Report** → View all insights discovered

## Security Note

⚠️ **IMPORTANT**: This MVP uses `dangerouslyAllowBrowser: true` for Anthropic API calls. This is only for development/testing. For production:

1. Create Supabase Edge Functions
2. Move Anthropic API calls to the backend
3. Never expose API keys in frontend code

## Deployment

### Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

All environment variables from `.env` should be added to your deployment platform.

## License

Proprietary - Mike Hill / Loam Strategy