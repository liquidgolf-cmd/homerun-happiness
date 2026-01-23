import { useState, useEffect } from 'react';
import { BaseStage } from '@/types/conversation';
import { baseProgress } from '@/lib/supabase';

export interface CompletedStages {
  at_bat: boolean;
  first_base: boolean;
  second_base: boolean;
  third_base: boolean;
  home_plate: boolean;
}

export function useBaseProgress(conversationId: string | undefined) {
  const [completedStages, setCompletedStages] = useState<CompletedStages>({
    at_bat: false,
    first_base: false,
    second_base: false,
    third_base: false,
    home_plate: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    loadBaseProgress();
  }, [conversationId]);

  const loadBaseProgress = async () => {
    if (!conversationId) return;

    setLoading(true);
    const { data, error } = await baseProgress.getAllBaseProgress(conversationId);

    if (error) {
      console.error('Error loading base progress:', error);
      setLoading(false);
      return;
    }

    if (data) {
      const completed: CompletedStages = {
        at_bat: false,
        first_base: false,
        second_base: false,
        third_base: false,
        home_plate: false,
      };

      data.forEach((progress) => {
        const stage = progress.base_stage as BaseStage;
        // A stage is completed if it has a completed_at timestamp
        if (progress.completed_at && stage in completed) {
          completed[stage as keyof CompletedStages] = true;
        }
      });

      setCompletedStages(completed);
    }

    setLoading(false);
  };

  const isStageCompleted = (stage: BaseStage): boolean => {
    if (stage === 'completed') return false;
    return completedStages[stage as keyof CompletedStages] || false;
  };

  return {
    completedStages,
    loading,
    isStageCompleted,
    reload: loadBaseProgress,
  };
}
