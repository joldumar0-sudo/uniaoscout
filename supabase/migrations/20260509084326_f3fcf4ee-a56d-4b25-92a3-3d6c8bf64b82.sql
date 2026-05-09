
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

ALTER TABLE public.chat_messages ALTER COLUMN content DROP NOT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_att_read" ON storage.objects;
CREATE POLICY "chat_att_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_att_insert" ON storage.objects;
CREATE POLICY "chat_att_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "chat_att_delete" ON storage.objects;
CREATE POLICY "chat_att_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_provincial_admin(auth.uid())));
