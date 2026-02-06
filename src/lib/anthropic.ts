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
  preAssessment?: {
    biggest_challenge: string;
    why_matters?: string;
    what_would_change?: string;
  };
  userName?: string;
}

const BASE_INSTRUCTIONS: Record<BaseStage, string> = {
  at_bat: `You're helping the user discover their deepest WHY - their core motivation for everything they do. This is the foundation of their journey. Use the HomeRun Method to dig into their motivation, values, and what truly drives them.`,
  first_base: `You're helping the user discover WHO they really are - their authentic identity beyond roles and labels. Use a moment-based approach: anchor in a specific moment when they felt aligned with their purpose, then explore how they showed up and what allows or blocks that.`,
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

  const { baseStage, whyLevel, previousMessages, rootInsights, preAssessment, userName } = context;
  const baseInfo = BASE_STAGES.find(b => b.key === baseStage);
  const baseInstruction = BASE_INSTRUCTIONS[baseStage] || '';

  // Determine if we should evaluate for completion
  const shouldEvaluateCompletion = whyLevel >= 4;
  const nextBaseGuidance = NEXT_BASE_GUIDANCE[baseStage];

  // Build system prompt
  const systemPrompt = `${COACH_PERSONALITY}

Current Stage: ${baseInfo?.label || baseStage} - ${baseInfo?.description || ''}
${baseInstruction}

Each exchange should go deeper than the last until you reach the root cause or deepest truth. Continue asking deeper questions until the user reveals a genuine root insight, then summarize it.

${shouldEvaluateCompletion ? `
IMPORTANT - Completion Suggestion:
Evaluate if the user has discovered a genuine root insight. If their answer reveals a deep, fundamental truth about their ${baseStage === 'at_bat' ? 'WHY' : baseStage === 'first_base' ? 'WHO' : baseStage === 'second_base' ? 'WHAT' : baseStage === 'third_base' ? 'HOW' : 'WHY IT MATTERS'}, then:

1. Summarize the root insight clearly in 1-2 sentences
2. Acknowledge their discovery: "You've discovered your ${baseStage === 'at_bat' ? 'WHY' : baseStage === 'first_base' ? 'WHO' : baseStage === 'second_base' ? 'WHAT' : baseStage === 'third_base' ? 'HOW' : 'WHY IT MATTERS'}."
3. Suggest next step (but don't force it): "Ready to move forward? ${nextBaseGuidance}? Or would you like to explore this deeper?"
4. Keep it concise, celebratory, and inviting - let them choose to continue or move on

If the insight isn't deep enough yet, use the HomeRun Method to go deeper.
` : ''}

${baseStage === 'first_base' ? `
SPECIAL NOTE: First Base uses a moment-based WHO discovery. The user has already described a moment when they felt aligned with their purpose and how they showed up. Guide them deeper with:
- "What allowed you to show up that way?"
- "What gets in the way of you being that person more often?"
Continue deepening until they reach a root identity insight. Each question should go deeper than the last.
` : ''}

${baseStage === 'second_base' ? `
SPECIAL NOTE: This stage has TWO sequences:
- First sequence: Discover WHAT they want (desires)
- Second sequence: Discover WHAT's stopping them (fears/obstacles)

If you've completed the first sequence (desires), explicitly transition: "Good. You've discovered what you truly want. Now let's explore what's stopping you. What are you afraid of? What obstacles stand in your way?"

Only complete this stage after BOTH sequences are done.
` : ''}

${rootInsights && Object.keys(rootInsights).length > 0 ? `\nPrevious insights they've discovered:\n${JSON.stringify(rootInsights, null, 2)}` : ''}

${preAssessment ? `\nThe user's pre-assessment: biggest challenge: ${preAssessment.biggest_challenge}${preAssessment.why_matters ? `; why it matters to them: ${preAssessment.why_matters}` : ''}${preAssessment.what_would_change ? `; what would change if they overcame it: ${preAssessment.what_would_change}` : ''}. Use this to ground the WHY conversation when relevant; don't merely repeat it.` : ''}

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

/**
 * Turn the user's (possibly long) challenge description into a 1-2 sentence actionable focus statement
 * for display in the conversation header.
 */
export async function generateFocusStatement(rawChallenge: string): Promise<string> {
  if (!anthropic) {
    return rawChallenge.length > 120 ? `${rawChallenge.slice(0, 120).trim()}…` : rawChallenge;
  }
  const systemPrompt = `Condense the user's challenge to 1–2 sentences for display as a focus statement.

Rules:
- Keep it to 1-2 sentences only. No more.
- Use their exact words where possible. Do NOT interpret, infer, or replace their phrasing with synonyms.
- If the input is already 1-2 clear sentences, return it as-is or with minimal editing.
- Strip rambling, repetition, and tangents only—preserve their core meaning and tone.
- Do not add advice or questions. Output only the condensed focus statement.`;

  const userContent = `User's description of their biggest challenge:\n\n${rawChallenge}\n\nWrite the 1-2 sentence focus statement now. No preamble.`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });
    const content = response.content[0];
    if (content.type !== 'text') {
      return rawChallenge.length > 120 ? `${rawChallenge.slice(0, 120).trim()}…` : rawChallenge;
    }
    return content.text.trim() || rawChallenge;
  } catch (error) {
    console.warn('Focus statement generation failed, using raw text:', error);
    return rawChallenge.length > 120 ? `${rawChallenge.slice(0, 120).trim()}…` : rawChallenge;
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

  const systemPrompt = `You are a thoughtful life coach using the HomeRun Method. Your task is to write a "HomeRun Snapshot" from a pre-assessment. Use the same reflective, WHY-focused style as the "at bat" breakthrough summary: warm, second person ("you"), interpretive—not a repeat of their answers.

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

export interface ReportConclusionParams {
  focusStatement: string;
  atBatSummary?: string;
  firstBaseSummary?: string;
  secondBaseSummary?: string;
  thirdBaseSummary?: string;
  homePlateSummary?: string;
  rootWhy?: string;
  rootIdentity?: string;
  rootDesire?: string;
  rootFear?: string;
  rootObstacle?: string;
  rootLegacy?: string;
}

export interface ReportConclusion {
  /** Short paragraph restating the problem and tying it to the journey */
  restatement: string;
  /** Paragraph synthesizing WHY, WHO, WHAT, HOW, and why it MATTERS */
  synthesis: string;
  /** Actionable plan: 3–5 concrete next steps */
  plan: string;
  /** Closing paragraph summarizing the whole process and their transformation */
  overallSummary: string;
}

/**
 * Generate the concluding section of the final report: restate problem, synthesize modules,
 * provide a plan, and an overall summary of the journey.
 */
export async function generateReportConclusion(params: ReportConclusionParams): Promise<ReportConclusion | null> {
  if (!anthropic) return null;

  const systemPrompt = `You are a life coach writing the concluding section of a client's HomeRun journey report.

You will receive:
1. The client's original focus (what they set out to work on)
2. Their breakthrough summaries and root insights from each base (At Bat = WHY, First Base = WHO, Second Base = WHAT, Third Base = HOW, Home Plate = why it MATTERS)

Your task is to output four distinct sections in the following format. Use the exact labels and separate each section with "---SECTION---".

1. RESTATEMENT (2-4 sentences)
Restate the client's original problem or focus in clear, compassionate language. Connect it to the journey they just completed.

2. SYNTHESIS (one short paragraph, 3-5 sentences)
Synthesize what they discovered across the modules: how their WHY fuels their WHO, how their WHO informs what they want (WHAT), how their HOW gets them there, and why it MATTERS. Tie it into one coherent narrative.

3. PLAN (3-5 bullet points or short numbered steps)
Give them a concrete, actionable plan. Each item should be a clear next step they can take. Use their actual insights (WHY, WHO, WHAT, HOW, legacy) so the plan feels personal. Format as short lines, e.g. "• Step one..." or "1. ..."

4. OVERALL SUMMARY (one short paragraph, 2-4 sentences)
Close with an overall summary of the whole process: what they did, what they discovered, and what they can carry forward. Warm and encouraging.`;

  const parts: string[] = [
    `Original focus: ${params.focusStatement}`,
    params.rootWhy ? `Root WHY (At Bat): ${params.rootWhy}` : '',
    params.atBatSummary ? `At Bat breakthrough summary: ${params.atBatSummary}` : '',
    params.rootIdentity ? `Root WHO (First Base): ${params.rootIdentity}` : '',
    params.firstBaseSummary ? `First Base breakthrough summary: ${params.firstBaseSummary}` : '',
    params.rootDesire ? `Root WHAT - desire (Second Base): ${params.rootDesire}` : '',
    params.rootFear ? `Root WHAT - fear (Second Base): ${params.rootFear}` : '',
    params.secondBaseSummary ? `Second Base breakthrough summary: ${params.secondBaseSummary}` : '',
    params.rootObstacle ? `Root HOW (Third Base): ${params.rootObstacle}` : '',
    params.thirdBaseSummary ? `Third Base breakthrough summary: ${params.thirdBaseSummary}` : '',
    params.rootLegacy ? `Root legacy (Home Plate): ${params.rootLegacy}` : '',
    params.homePlateSummary ? `Home Plate breakthrough summary: ${params.homePlateSummary}` : '',
  ].filter(Boolean);

  const userContent = `Client's journey data:\n\n${parts.join('\n\n')}\n\nWrite the four sections now. Use "---SECTION---" between each section.`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });
    const content = response.content[0];
    if (content.type !== 'text') return null;
    const text = content.text.trim();
    const sections = text.split('---SECTION---').map((s) => s.trim()).filter(Boolean);
    const [restatement = '', synthesis = '', plan = '', overallSummary = ''] = sections;
    return { restatement, synthesis, plan, overallSummary };
  } catch (error) {
    console.warn('Report conclusion generation failed:', error);
    return null;
  }
}