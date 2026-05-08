
-- Activities table
CREATE TABLE public.atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('provincial','agrupamento')),
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  local text,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT atividades_scope_chk CHECK (
    (scope='provincial' AND agrupamento_id IS NULL) OR
    (scope='agrupamento' AND agrupamento_id IS NOT NULL)
  )
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ativ_read" ON public.atividades FOR SELECT TO authenticated
USING (scope='provincial' OR can_view_agrupamento(auth.uid(), agrupamento_id));

CREATE POLICY "ativ_insert" ON public.atividades FOR INSERT TO authenticated
WITH CHECK (
  (scope='provincial' AND is_provincial_admin(auth.uid()))
  OR (scope='agrupamento' AND can_manage_agrupamento(auth.uid(), agrupamento_id))
);

CREATE POLICY "ativ_update" ON public.atividades FOR UPDATE TO authenticated
USING (
  (scope='provincial' AND is_provincial_admin(auth.uid()))
  OR (scope='agrupamento' AND can_manage_agrupamento(auth.uid(), agrupamento_id))
) WITH CHECK (
  (scope='provincial' AND is_provincial_admin(auth.uid()))
  OR (scope='agrupamento' AND can_manage_agrupamento(auth.uid(), agrupamento_id))
);

CREATE POLICY "ativ_delete" ON public.atividades FOR DELETE TO authenticated
USING (
  is_provincial_admin(auth.uid())
  OR (scope='agrupamento' AND can_manage_agrupamento(auth.uid(), agrupamento_id))
  OR created_by = auth.uid()
);

CREATE TRIGGER atividades_touch BEFORE UPDATE ON public.atividades
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_atividades_data ON public.atividades(data_inicio);
CREATE INDEX idx_atividades_ag ON public.atividades(agrupamento_id);

-- Update handle_new_user to capture agrupamento_numero from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ag_num int;
  _ag_id uuid;
BEGIN
  _ag_num := NULLIF(NEW.raw_user_meta_data->>'agrupamento_numero','')::int;
  IF _ag_num IS NOT NULL THEN
    SELECT id INTO _ag_id FROM public.agrupamentos WHERE numero = _ag_num LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, agrupamento_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, _ag_id);

  IF NEW.email = 'oldumar2026@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
