
-- Add explicit FK to public.profiles so PostgREST can embed
ALTER TABLE public.nominations
  ADD CONSTRAINT nominations_user_id_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_user_id_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
