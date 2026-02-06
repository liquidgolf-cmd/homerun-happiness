-- Migration: Add UPDATE policy for messages table
-- Required for First Base opening migration (replace old initial message in place)
-- Run this in Supabase SQL Editor

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );
