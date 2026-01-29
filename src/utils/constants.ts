import { BaseStage } from '@/types/conversation';

export const COACH_PERSONALITY = `You are a direct, professional life coach who helps people discover their deepest truths using the HomeRun Method. 

Your personality:
- Direct and honest - you cut through surface-level answers
- Empathetic but persistent - you care deeply but won't let them settle
- Short, punchy responses (under 100 words) - no rambling
- Challenge vague answers immediately - never accept generic responses
- Use their name occasionally - creates connection
- Acknowledge when they're digging deep - celebrate breakthroughs

Your voice examples:
- "That's a safe answer. Let's go deeper."
- "Be honest with yourself. What do you actually want?"
- "I hear you, but that's still surface level. Why does that matter to YOU?"
- "Good - we're getting somewhere. Now push deeper."
- "That's what you think you should want. What do you REALLY want?"

Your job is to guide them through the HomeRun Method to get to core issues and root motivation. Use the method's depth process: each question should go deeper than the last until you reach the root.`;

export const BASE_STAGES: Array<{
  key: BaseStage;
  label: string;
  description: string;
}> = [
  {
    key: 'at_bat',
    label: 'At Bat',
    description: 'Discovering WHY - Your deepest motivation',
  },
  {
    key: 'first_base',
    label: 'First Base',
    description: 'Discovering WHO - Your authentic identity',
  },
  {
    key: 'second_base',
    label: 'Second Base',
    description: 'Discovering WHAT - Your desires and fears',
  },
  {
    key: 'third_base',
    label: 'Third Base',
    description: 'Mapping HOW - Your action plan',
  },
  {
    key: 'home_plate',
    label: 'Home Plate',
    description: 'Why it MATTERS - Your legacy and sustainability',
  },
];

export const VAGUE_PATTERNS = [
  {
    pattern: /(?:i want to be|want to be|i want|i hope|i wish)(?:\s+to be)?\s+(?:happy|successful|fulfilled|content|satisfied|better|good)/i,
    keywords: ['happy', 'successful', 'fulfilled', 'content', 'satisfied', 'better', 'good'],
    reason: 'Generic happiness/success statements',
    challenge: "Everyone wants to be happy. That's not what you want - that's what you think you should want. What does happiness actually mean for YOU?",
  },
  {
    pattern: /(?:i don't know|don't know|i'm not sure|not sure|maybe|perhaps|i guess)/i,
    keywords: ["don't know", "not sure", 'maybe', 'perhaps', 'guess'],
    reason: 'Avoidance or uncertainty',
    challenge: "I don't accept 'I don't know.' You know more than you think. Take a guess. What's the first thing that comes to mind?",
  },
  {
    pattern: /(?:should|supposed to|have to|need to|must|ought to)/i,
    keywords: ['should', 'supposed', 'have to', 'need to', 'must', 'ought'],
    reason: 'Should statements indicate external expectations',
    challenge: "Stop saying 'should.' That's what others expect. What do YOU actually want? Forget what you 'should' want.",
  },
  {
    pattern: /(?:make a difference|help people|impact|change the world|give back)/i,
    keywords: ['make a difference', 'help people', 'impact', 'change the world', 'give back'],
    reason: 'Vague altruistic statements',
    challenge: "That's nice, but everyone wants to help people. What specifically? Who exactly? What problem keeps you up at night?",
  },
  {
    pattern: /(?:financial freedom|financial security|money|wealth|rich|financially free)/i,
    keywords: ['financial freedom', 'financial security', 'money', 'wealth', 'rich', 'financially free'],
    reason: 'Generic financial goals',
    challenge: "Money is a means, not an end. What would financial freedom actually let you DO? What are you buying with that freedom?",
  },
  {
    pattern: /(?:good person|better person|good human|become better)/i,
    keywords: ['good person', 'better person', 'good human', 'become better'],
    reason: 'Vague self-improvement',
    challenge: "Good by whose standards? What does 'good' actually mean to you? What would being a 'better person' look like in your daily life?",
  },
  {
    pattern: /(?:no time|too busy|overwhelmed|don't have time|never have time)/i,
    keywords: ['no time', 'too busy', 'overwhelmed', "don't have time", 'never have time'],
    reason: 'Time constraints as excuses',
    challenge: "Time is a choice. What are you prioritizing over this? Why is that more important? What would need to change for this to matter enough?",
  },
];

export const PROGRESS_STEPS: Record<BaseStage, number> = {
  at_bat: 20,
  first_base: 40,
  second_base: 60,
  third_base: 80,
  home_plate: 100,
  completed: 100,
};

/** Shared copy for conversion (summary step, snapshot-sent, Purchase page) */
export const CONVERSION_COPY = {
  SCARCITY_LINE: '$59 for a limited time (regular $299).',
  TRUST_LINE: 'No subscription — one-time purchase. Full access to all 5 bases and your journey report.',
  WHAT_YOU_GET_LINE: '5 bases of AI coaching + your full journey report.',
} as const;

/** SessionStorage key for pre-assessment data */
export const HOMERUN_PRE_ASSESSMENT_KEY = 'homerun_pre_assessment';