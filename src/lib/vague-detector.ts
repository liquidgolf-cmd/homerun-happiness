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
  // Only flag if answer is long enough and has significant imbalance
  const thinkCount = (answer.match(/\bi think\b|\bi believe\b|\bi suppose\b/gi) || []).length;
  const feelCount = (answer.match(/\bi feel\b|\bi sense\b|\bit feels\b/gi) || []).length;
  
  // Only flag intellectualizing if answer is substantial and has major imbalance
  if (answer.split(/\s+/).length > 20 && thinkCount > 3 && feelCount === 0) {
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