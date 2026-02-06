import { useState, useEffect } from 'react';
import { preAssessments } from '@/lib/supabase';

export interface PreAssessmentData {
  biggest_challenge: string;
  why_matters?: string;
  what_would_change?: string;
  /** Stored focus statement; falls back to biggest_challenge for old rows */
  focusStatement?: string;
}

export function usePreAssessment(userId: string | undefined) {
  const [preAssessment, setPreAssessment] = useState<PreAssessmentData | null>(null);

  useEffect(() => {
    if (!userId) {
      setPreAssessment(null);
      return;
    }
    preAssessments
      .getPreAssessment(userId)
      .then(({ data, error }) => {
        if (!error && data && data.biggest_challenge) {
          const focusStatement =
            (data as { focus_statement?: string }).focus_statement?.trim() ||
            data.biggest_challenge;
          setPreAssessment({
            biggest_challenge: data.biggest_challenge,
            why_matters: (data as { why_matters?: string }).why_matters,
            what_would_change: (data as { what_would_change?: string }).what_would_change,
            focusStatement,
          });
        } else {
          setPreAssessment(null);
        }
      })
      .catch(() => setPreAssessment(null));
  }, [userId]);

  return preAssessment;
}
