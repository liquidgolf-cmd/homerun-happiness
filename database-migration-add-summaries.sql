-- Migration: Add summary columns to conversations table
-- Run this in Supabase SQL Editor

ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS at_bat_summary TEXT,
ADD COLUMN IF NOT EXISTS first_base_summary TEXT,
ADD COLUMN IF NOT EXISTS second_base_summary TEXT,
ADD COLUMN IF NOT EXISTS third_base_summary TEXT,
ADD COLUMN IF NOT EXISTS home_plate_summary TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.conversations.at_bat_summary IS 'AI-generated breakthrough summary for At Bat section';
COMMENT ON COLUMN public.conversations.first_base_summary IS 'AI-generated breakthrough summary for First Base section';
COMMENT ON COLUMN public.conversations.second_base_summary IS 'AI-generated breakthrough summary for Second Base section';
COMMENT ON COLUMN public.conversations.third_base_summary IS 'AI-generated breakthrough summary for Third Base section';
COMMENT ON COLUMN public.conversations.home_plate_summary IS 'AI-generated breakthrough summary for Home Plate section';
