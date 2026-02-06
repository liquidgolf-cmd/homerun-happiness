export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PreAssessment {
  id: string;
  user_id?: string;
  email: string;
  happiness_score?: number;
  clarity_score?: number;
  readiness_score?: number;
  biggest_challenge?: string;
  focus_statement?: string;
  recommended_path?: 'business' | 'personal';
  created_at: string;
}