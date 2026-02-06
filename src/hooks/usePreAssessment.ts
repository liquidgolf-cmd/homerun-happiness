import { useState, useEffect, useRef } from 'react';
import { preAssessments } from '@/lib/supabase';
import { generateFocusStatement } from '@/lib/anthropic';

export interface PreAssessmentData {
  biggest_challenge: string;
  why_matters?: string;
  what_would_change?: string;
  /** AI-summarized 1-2 sentence actionable statement; may be undefined until generated */
  focusStatement?: string;
}

const SHORT_CHALLENGE_MAX = 100;

export function usePreAssessment(userId: string | undefined) {
  const [preAssessment, setPreAssessment] = useState<PreAssessmentData | null>(null);
  const focusRequestedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setPreAssessment(null);
      focusRequestedRef.current = false;
      return;
    }
    preAssessments
      .getPreAssessment(userId)
      .then(({ data, error }) => {
        if (!error && data && data.biggest_challenge) {
          const base = {
            biggest_challenge: data.biggest_challenge,
            why_matters: (data as { why_matters?: string }).why_matters,
            what_would_change: (data as { what_would_change?: string }).what_would_change,
          };
          setPreAssessment(base);
          focusRequestedRef.current = false;
        } else {
          setPreAssessment(null);
        }
      })
      .catch(() => setPreAssessment(null));
  }, [userId]);

  // Generate actionable focus statement when we have a challenge (skip if already short)
  useEffect(() => {
    if (!preAssessment?.biggest_challenge || focusRequestedRef.current) return;
    if (preAssessment.biggest_challenge.length <= SHORT_CHALLENGE_MAX) {
      focusRequestedRef.current = true;
      setPreAssessment((prev) => (prev ? { ...prev, focusStatement: prev.biggest_challenge } : null));
      return;
    }
    focusRequestedRef.current = true;
    generateFocusStatement(preAssessment.biggest_challenge)
      .then((statement) => {
        setPreAssessment((prev) => (prev ? { ...prev, focusStatement: statement } : null));
      })
      .catch(() => {
        focusRequestedRef.current = false;
        setPreAssessment((prev) => (prev ? { ...prev, focusStatement: prev.biggest_challenge } : null));
      });
  }, [preAssessment?.biggest_challenge]);

  return preAssessment;
}
