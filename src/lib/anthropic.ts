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
  at_bat: `You're helping the user discover their deepest WHY - their core motivation for everything they do. This is the foundation of their journey. Ask "why" questions that dig into their motivation, values, and what truly drives them.`,
  first_base: `You're helping the user discover WHO they really are - their authentic identity beyond roles and labels. Who are they at their core? What makes them uniquely them?`,
  second_base: `You're helping the user discover WHAT they truly want and what's stopping them. This involves two 5 Whys sequences - one for desires, one for fears/obstacles.`,
  third_base: `You're helping the user create a sustainable action plan - HOW they'll actually move forward. What are the concrete steps? What obstacles will they face?`,
  home_plate: `You're helping the user understand WHY IT MATTERS - the ripple effect and sustainability of their journey. What's the legacy? What makes it sustainable?`,
  completed: `The journey is complete. Celebrate their insights and growth.`,
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

  // Build system prompt
  const systemPrompt = `${COACH_PERSONALITY}

Current Stage: ${baseInfo?.label || baseStage} - ${baseInfo?.description || ''}
${baseInstruction}

You're at Why Level ${whyLevel} of 5. Each "why" should go deeper than the last. By level 5, you should reach the root cause or deepest truth.

${whyLevel < 5 ? `Ask the next "why" question. Make it more specific and deeper than before.` : `You've reached the 5th "why" - summarize the root insight they've discovered.`}

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