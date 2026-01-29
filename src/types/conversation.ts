export type JourneyType = 'business' | 'personal';

export type BaseStage = 'at_bat' | 'first_base' | 'second_base' | 'third_base' | 'home_plate' | 'completed';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  base_stage: BaseStage;
  why_level?: number;
  is_vague?: boolean;
  challenged?: boolean;
  tokens_used?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  journey_type: JourneyType;
  current_base: BaseStage;
  started_at: string;
  completed_at?: string;
  paused_at?: string;
  is_active: boolean;
  
  // Core insights extracted from HomeRun Method dialogue
  root_why?: string;
  root_identity?: string;
  root_desire?: string;
  root_fear?: string;
  root_obstacle?: string;
  root_legacy?: string;
  root_sustainability_threat?: string;
  
  // Breakthrough summaries for each section
  at_bat_summary?: string;
  first_base_summary?: string;
  second_base_summary?: string;
  third_base_summary?: string;
  home_plate_summary?: string;
  
  // Final deliverables
  why_statement?: string;
  identity_statement?: string;
  vision_statement?: string;
  opportunity_map?: Record<string, unknown>;
  action_plan?: Record<string, unknown>;
  ripple_statement?: string;
  
  // Metadata
  total_messages: number;
  completion_percentage: number;
  
  created_at: string;
  updated_at: string;
}

export interface BaseProgress {
  id: string;
  conversation_id: string;
  base_stage: BaseStage;
  started_at: string;
  completed_at?: string;
  
  // Progress within each base
  why_sequence_complete: boolean;
  confirmation_received: boolean;
  action_assigned: boolean;
  
  // Base-specific data
  responses?: Record<string, unknown>;
}

export interface VagueResponse {
  is_vague: boolean;
  reason?: string;
  challenge?: string;
}

export interface WhySequence {
  current_level: number;
  max_level: number;
  responses: string[];
  completed: boolean;
}