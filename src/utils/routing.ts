import { conversations, preAssessments } from '@/lib/supabase';
import { BaseStage } from '@/types/conversation';

/**
 * Maps base stage enum values to their corresponding route paths
 */
const baseStageToRoute: Record<BaseStage, string> = {
  at_bat: '/at-bat',
  first_base: '/first-base',
  second_base: '/second-base',
  third_base: '/third-base',
  home_plate: '/home-plate',
  completed: '/report',
};

/**
 * Determines the appropriate redirect path for a user based on their progress
 * Priority: Active conversation > Pre-assessment > Assessment
 * 
 * @param userId - The user's ID
 * @returns Promise resolving to the route path string
 */
export async function getRedirectPath(userId: string): Promise<string> {
  try {
    // Priority 1: Check for active conversation
    const { data: conversation, error: convError } = await conversations.getActiveConversation(userId);
    
    if (!convError && conversation) {
      // User has an active conversation - redirect to their current base
      const route = baseStageToRoute[conversation.current_base];
      if (route) {
        return route;
      }
      // Fallback if base stage doesn't match (shouldn't happen, but safe)
      return '/at-bat';
    }

    // Priority 2: Check for pre-assessment
    const { data: preAssessment, error: preAssessmentError } = await preAssessments.getPreAssessment(userId);
    
    if (!preAssessmentError && preAssessment) {
      // User has completed pre-assessment but no conversation yet
      return '/path-selection';
    }

    // Priority 3: No progress - start at assessment
    return '/assessment';
  } catch (error) {
    // If anything fails, default to assessment (safest fallback)
    console.error('Error determining redirect path:', error);
    return '/assessment';
  }
}
