-- Migration: Add UPDATE policy for messages table
-- Required for First Base opening migration (replace old initial message in place)
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)

-- Drop existing policy if it exists (allows re-running)
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

-- Create policy so users can update messages for their own conversations
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );
