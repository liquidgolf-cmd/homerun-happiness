import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Conversation, Message, BaseProgress, BaseStage, JourneyType } from '@/types/conversation';
import { PreAssessment } from '@/types/user';
import { HOMERUN_PRE_ASSESSMENT_KEY } from '@/utils/constants';
import { generateFocusStatement } from '@/lib/anthropic';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async signInWithGoogle() {
    // Use environment variable for production URL, fallback to current origin for development
    // In production (Vercel), use the production URL; in development, use current origin
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    const appUrl = isProduction 
      ? (import.meta.env.VITE_APP_URL || 'https://homerun-happiness.vercel.app')
      : (import.meta.env.VITE_APP_URL || window.location.origin);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/assessment`,
      },
    });
    return { data, error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Conversation helpers
export const conversations = {
  async createConversation(userId: string, journeyType: JourneyType) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        journey_type: journeyType,
        current_base: 'at_bat',
        is_active: true,
      })
      .select()
      .single();
    return { data, error };
  },

  async getActiveConversation(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  async updateConversation(conversationId: string, updates: Partial<Conversation>) {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();
    return { data, error };
  },

  async getConversation(conversationId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    return { data, error };
  },
};

// Message helpers
export const messages = {
  async addMessage(message: Omit<Message, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (!error && data) {
      // Increment message count
      await supabase.rpc('increment_message_count', {
        conversation_id: message.conversation_id,
      });
    }

    return { data, error };
  },

  async getMessages(conversationId: string, baseStage?: BaseStage) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (baseStage) {
      query = query.eq('base_stage', baseStage);
    }

    const { data, error } = await query
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async updateMessage(messageId: string, updates: { content: string }) {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .maybeSingle();
    return { data, error };
  },
};

// Base progress helpers
export const baseProgress = {
  async updateBaseProgress(
    conversationId: string,
    baseStage: BaseStage,
    updates: Partial<BaseProgress>
  ) {
    const { data, error } = await supabase
      .from('base_progress')
      .upsert({
        conversation_id: conversationId,
        base_stage: baseStage,
        ...updates,
      }, {
        onConflict: 'conversation_id,base_stage',
      })
      .select()
      .single();
    return { data, error };
  },

  async getBaseProgress(conversationId: string, baseStage: BaseStage) {
    const { data, error } = await supabase
      .from('base_progress')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('base_stage', baseStage)
      .maybeSingle();
    return { data, error };
  },

  async getAllBaseProgress(conversationId: string) {
    const { data, error } = await supabase
      .from('base_progress')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('base_stage', { ascending: true });
    return { data, error };
  },
};

// Pre-assessment helpers
export const preAssessments = {
  async createPreAssessment(assessment: Omit<PreAssessment, 'id' | 'created_at'>) {
    // Just insert - allow multiple assessments per user
    const { data, error } = await supabase
      .from('pre_assessments')
      .insert(assessment)
      .select()
      .maybeSingle();
    return { data, error };
  },

  async getPreAssessment(userId: string) {
    const { data, error } = await supabase
      .from('pre_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  /**
   * Create pre-assessment from sessionStorage (B2: for anonymous users who sign up later)
   * Returns the parsed payload for navigation state, or null if no stored assessment
   */
  async createPreAssessmentFromStorage(userId: string, email: string): Promise<{ success: boolean; payload?: any }> {
    try {
      const stored = sessionStorage.getItem(HOMERUN_PRE_ASSESSMENT_KEY);
      if (!stored) {
        return { success: false };
      }

      const payload = JSON.parse(stored);
      if (!payload || typeof payload !== 'object') {
        return { success: false };
      }

      const biggestChallenge = payload.biggestChallenge || '';
      const focusStatement =
        biggestChallenge.length <= 100
          ? biggestChallenge
          : await generateFocusStatement(biggestChallenge);

      // Map to DB shape
      const assessment = {
        user_id: userId,
        email,
        happiness_score: payload.happinessScore,
        clarity_score: payload.clarityScore,
        readiness_score: payload.readinessScore,
        biggest_challenge: biggestChallenge,
        focus_statement: focusStatement,
        recommended_path: payload.recommendedPath || 'personal',
      };

      const { error } = await this.createPreAssessment(assessment);
      if (error) {
        console.error('Failed to create pre-assessment from storage:', error);
        return { success: false };
      }

      // Clear storage on success
      sessionStorage.removeItem(HOMERUN_PRE_ASSESSMENT_KEY);
      return { success: true, payload };
    } catch (err) {
      console.error('Error creating pre-assessment from storage:', err);
      return { success: false };
    }
  },
};