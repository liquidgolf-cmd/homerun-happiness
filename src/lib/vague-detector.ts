import { VAGUE_PATTERNS } from '@/utils/constants';
import { VagueResponse } from '@/types/conversation';

export { VAGUE_PATTERNS };

export function detectVagueAnswer(answer: string): VagueResponse {
  const trimmedAnswer = answer.trim().toLowerCase();

  // Check if answer is too short
  if (trimmedAnswer.split(/\s+/).length < 5) {
    return {
      is_vague: true,
      reason: 'Answer too short',
      challenge: "That's not enough. Give me more. What are you really trying to say?",
    };
  }

  // Check against vague patterns
  for (const vaguePattern of VAGUE_PATTERNS) {
    if (vaguePattern.pattern.test(answer)) {
      return {
        is_vague: true,
        reason: vaguePattern.reason,
        challenge: vaguePattern.challenge,
      };
    }
  }

  // Check for intellectualizing (lots of "I think" but no "I feel")
  const thinkCount = (answer.match(/i think|i believe|i suppose/gi) || []).length;
  const feelCount = (answer.match(/i feel|i sense|it feels/gi) || []).length;
  
  if (thinkCount > 2 && feelCount === 0) {
    return {
      is_vague: true,
      reason: 'Too much intellectualizing, not enough feeling',
      challenge: "You're thinking too much. What do you FEEL? Forget what you think you should feel. What's the actual feeling?",
    };
  }

  // Answer is not vague
  return {
    is_vague: false,
  };
}