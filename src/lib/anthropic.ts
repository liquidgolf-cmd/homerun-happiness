import Anthropic from '@anthropic-ai/sdk';
import { BaseStage, Message } from '@/types/conversation';
import { COACH_PERSONALITY, BASE_STAGES } from '@/utils/constants';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const model = import.meta.env.VITE_MODEL || 'claude-sonnet-4-20250514';
const maxTokens = parseInt(import.meta.env.VITE_MAX_TOKENS || '2000');

if (!apiKey) {
  console.warn('Missing VITE_ANTHROPIC_API_KEY - AI features will not work');
}

// Initialize client with dangerouslyAllowBrowser for MVP
// TODO: Move to Supabase Edge Function for production
const anthropic = apiKey ? new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true, // MVP only - move to backend for production
}) : null;

export interface CoachingContext {
  baseStage: BaseStage;
  whyLevel: number;
  previousMessages: Message[];
  rootInsights?: {
    root_why?: string;
    root_identity?: string;
    root_desire?: string;
    root_fear?: string;
    root_obstacle?: string;
    root_legacy?: string;
    root_sustainability_threat?: string;
  };
  userName?: string;
}

const BASE_INSTRUCTIONS: Record<BaseStage, string> = {
  at_bat: `You're helping the user discover their deepest WHY - their core motivation for everything they do. This is the foundation of their journey. Use the HomeRun framework to dig into their motivation, values, and what truly drives them.`,
  first_base: `You're helping the user discover WHO they really are - their authentic identity beyond roles and labels. Who are they at their core? What makes them uniquely them?`,
  second_base: `You're helping the user discover WHAT they truly want and what's stopping them. This involves two deep-question sequences - one for desires, one for fears/obstacles.`,
  third_base: `You're helping the user create a sustainable action plan - HOW they'll actually move forward. What are the concrete steps? What obstacles will they face?`,
  home_plate: `You're helping the user understand WHY IT MATTERS - the ripple effect and sustainability of their journey. What's the legacy? What makes it sustainable?`,
  completed: `The journey is complete. Celebrate their insights and growth.`,
};

const NEXT_BASE_GUIDANCE: Record<BaseStage, string> = {
  at_bat: `Ready to discover WHO you really are at First Base`,
  first_base: `Ready to discover WHAT you want at Second Base`,
  second_base: `Ready to map HOW you'll make it happen at Third Base`,
  third_base: `Ready to explore why it MATTERS at Home Plate`,
  home_plate: `Ready to see your complete journey report`,
  completed: ``,
};

export async function generateCoachResponse(
  userMessage: string,
  context: CoachingContext
): Promise<{ response: string; tokens: number }> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const { baseStage, whyLevel, previousMessages, rootInsights, userName } = context;
  const baseInfo = BASE_STAGES.find(b => b.key === baseStage);
  const baseInstruction = BASE_INSTRUCTIONS[baseStage] || '';

  // Determine if we should evaluate for completion
  const shouldEvaluateCompletion = whyLevel >= 4;
  const nextBaseGuidance = NEXT_BASE_GUIDANCE[baseStage];

  // Build system prompt
  const systemPrompt = `${COACH_PERSONALITY}

Current Stage: ${baseInfo?.label || baseStage} - ${baseInfo?.description || ''}
${baseInstruction}

You're at depth ${whyLevel} in the HomeRun framework. Each exchange should go deeper than the last until you reach the root cause or deepest truth.

${whyLevel < 5 ? `Ask the next depth question – make it more specific and deeper than before.` : `You've reached the root – summarize the core insight they've discovered.`}

${shouldEvaluateCompletion ? `
IMPORTANT - Completion Suggestion:
Evaluate if the user has discovered a genuine root insight. If their answer reveals a deep, fundamental truth about their ${baseStage === 'at_bat' ? 'WHY' : baseStage === 'first_base' ? 'WHO' : baseStage === 'second_base' ? 'WHAT' : baseStage === 'third_base' ? 'HOW' : 'WHY IT MATTERS'}, then:

1. Summarize the root insight clearly in 1-2 sentences
2. Acknowledge their discovery: "You've discovered your ${baseStage === 'at_bat' ? 'WHY' : baseStage === 'first_base' ? 'WHO' : baseStage === 'second_base' ? 'WHAT' : baseStage === 'third_base' ? 'HOW' : 'WHY IT MATTERS'}."
3. Suggest next step (but don't force it): "Ready to move forward? ${nextBaseGuidance}? Or would you like to explore this deeper?"
4. Keep it concise, celebratory, and inviting - let them choose to continue or move on

If the insight isn't deep enough yet, use the HomeRun framework to go deeper.
` : ''}

${baseStage === 'second_base' ? `
SPECIAL NOTE: This stage has TWO sequences:
- First sequence: Discover WHAT they want (desires)
- Second sequence: Discover WHAT's stopping them (fears/obstacles)

If you've completed the first sequence (desires), explicitly transition: "Good. You've discovered what you truly want. Now let's explore what's stopping you. What are you afraid of? What obstacles stand in your way?"

Only complete this stage after BOTH sequences are done.
` : ''}

${rootInsights && Object.keys(rootInsights).length > 0 ? `\nPrevious insights they've discovered:\n${JSON.stringify(rootInsights, null, 2)}` : ''}

${userName ? `\nThe user's name is ${userName}. Use it occasionally to create connection.` : ''}

Keep responses under 100 words. Be direct, empathetic, and push them deeper.`;

  // Build message history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Add recent messages for context (last 10 messages to stay within token limits)
  const recentMessages = previousMessages.slice(-10);
  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const assistantMessage = content.text;
    const tokensUsed = response.usage?.input_tokens && response.usage?.output_tokens
      ? response.usage.input_tokens + response.usage.output_tokens
      : 0;

    return {
      response: assistantMessage,
      tokens: tokensUsed,
    };
  } catch (error) {
    console.error('Error generating coach response:', error);
    throw error;
  }
}

export async function generateBreakthroughSummary(
  messages: Message[],
  baseStage: BaseStage,
  rootInsight: string
): Promise<string> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const baseInfo = BASE_STAGES.find(b => b.key === baseStage);
  const baseLabel = baseInfo?.label || baseStage;
  const baseDescription = baseInfo?.description || '';

  // Build system prompt for summary generation
  const systemPrompt = `You are a thoughtful life coach who helps people recognize and celebrate their breakthroughs. Your task is to write a powerful, inspirational summary of a user's discovery journey.

Analyze the conversation and create a 2-3 paragraph summary that captures:
1. What the user discovered (the breakthrough/insight)
2. Why this discovery is significant and transformative
3. The shift or transformation that occurred in their thinking

The summary should:
- Be warm, celebratory, and inspiring
- Focus on the "aha moment" and personal growth
- Use second person ("you") to speak directly to the user
- Be concise but meaningful (approximately 200-300 words)
- Feel like a milestone achievement worth celebrating

Current Stage: ${baseLabel} - ${baseDescription}
Root Insight: ${rootInsight.substring(0, 500)}${rootInsight.length > 500 ? '...' : ''}

Write the summary now. Do not include any meta-commentary or instructions - just the summary itself.`;

  // Build message history for context
  const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Include all messages from this base stage to understand the full journey
  for (const msg of messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add a final instruction message
  conversationMessages.push({
    role: 'user',
    content: `Based on this entire conversation, write a powerful summary of my breakthrough discovery. Focus on what I learned about myself, why it matters, and how this represents a transformation in my understanding.`,
  });

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    return content.text.trim();
  } catch (error) {
    console.error('Error generating breakthrough summary:', error);
    throw error;
  }
}

export interface PreAssessmentSnapshotParams {
  happinessScore: number;
  clarityScore: number;
  readinessScore: number;
  biggestChallenge: string;
  whyMatters: string;
  whatWouldChange: string;
  recommendedPath: 'business' | 'personal';
}

export async function generatePreAssessmentSnapshot(params: PreAssessmentSnapshotParams): Promise<string> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const pathLabel = params.recommendedPath === 'business' ? 'Business Journey' : 'Personal Life Journey';

  const systemPrompt = `You are a thoughtful life coach using the HomeRun framework. Your task is to write a "HomeRun Snapshot" from a pre-assessment. Use the same reflective, WHY-focused style as the "at bat" breakthrough summary: warm, second person ("you"), interpretive—not a repeat of their answers.

Do NOT simply restate scores and answers. Instead:
1. Synthesize what they shared into themes (their challenge, what's at stake, the change they imagine).
2. Offer brief interpretation: what this suggests about their motivation, readiness, or what to work on first.
3. Give 1–2 concrete, helpful takeaways or focus areas for their next steps.
Use the HomeRun "at bat / why" lens: connection to motivation, values, and what truly matters.
Tone: warm, celebratory but grounded. Length: approximately 200–300 words, 2–3 paragraphs.
Output only the snapshot text. No meta-commentary, headers, or instructions.`;

  const userContent = `Pre-assessment inputs:
- Happiness (1–10): ${params.happinessScore}
- Clarity on goals (1–10): ${params.clarityScore}
- Readiness to change (1–10): ${params.readinessScore}
- Biggest challenge: ${params.biggestChallenge}
- Why it matters to them: ${params.whyMatters}
${params.whatWouldChange ? `- What would change if they overcame it: ${params.whatWouldChange}` : ''}
- Recommended path: ${pathLabel}

Write the HomeRun Snapshot now.`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    return content.text.trim();
  } catch (error) {
    console.error('Error generating pre-assessment snapshot:', error);
    throw error;
  }
}