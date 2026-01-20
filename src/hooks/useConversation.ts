import { useState, useEffect } from 'react';
import { Conversation, BaseStage, JourneyType } from '@/types/conversation';
import { conversations } from '@/lib/supabase';

export function useConversation(userId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadActiveConversation();
  }, [userId]);

  const loadActiveConversation = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    const { data, error } = await conversations.getActiveConversation(userId);
    
    if (error) {
      setError(error);
    } else {
      setConversation(data || null);
    }
    setLoading(false);
  };

  const startNewConversation = async (journeyType: JourneyType) => {
    if (!userId) {
      throw new Error('User ID required');
    }

    setLoading(true);
    setError(null);
    
    // First, check if there's already an active conversation
    const { data: existing } = await conversations.getActiveConversation(userId);
    
    if (existing) {
      // Reuse existing conversation
      setConversation(existing);
      setLoading(false);
      return { data: existing, error: null };
    }
    
    // If no existing conversation, create a new one
    const { data, error } = await conversations.createConversation(userId, journeyType);
    
    if (error) {
      // If creation fails, try to get any conversation as fallback
      const { data: fallback } = await conversations.getActiveConversation(userId);
      if (fallback) {
        setConversation(fallback);
        setLoading(false);
        return { data: fallback, error: null };
      }
      setError(error);
      setLoading(false);
      return { error };
    }
    
    setConversation(data);
    setLoading(false);
    return { data, error: null };
  };

  const updateBase = async (newBase: BaseStage) => {
    if (!conversation) {
      throw new Error('No active conversation');
    }

    setLoading(true);
    setError(null);
    const { data, error } = await conversations.updateConversation(conversation.id, {
      current_base: newBase,
    });

    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }

    setConversation(data);
    setLoading(false);
    return { data, error: null };
  };

  const saveRootInsight = async (field: string, value: string) => {
    if (!conversation) {
      throw new Error('No active conversation');
    }

    setError(null);
    const updates: Record<string, string> = {};
    updates[field] = value;

    const { data, error } = await conversations.updateConversation(conversation.id, updates as Partial<Conversation>);

    if (error) {
      setError(error);
      return { error };
    }

    if (data) {
      setConversation(data);
    }
    return { data, error: null };
  };

  const reload = async () => {
    await loadActiveConversation();
  };

  return {
    conversation,
    loading,
    error,
    startNewConversation,
    updateBase,
    saveRootInsight,
    reload,
  };
}