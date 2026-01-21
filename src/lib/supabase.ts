import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Conversation, Message, BaseProgress, BaseStage, JourneyType } from '@/types/conversation';
import { PreAssessment } from '@/types/user';

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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/assessment`,
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
};