-- Add focus_statement column to pre_assessments
-- Run this in Supabase SQL Editor after applying the base schema

ALTER TABLE public.pre_assessments ADD COLUMN IF NOT EXISTS focus_statement TEXT;
