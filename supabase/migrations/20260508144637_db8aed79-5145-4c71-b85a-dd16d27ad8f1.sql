
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TYPE public.cargo AS ENUM (
  'padre',
  'coord_provincial','adj_coord_provincial','secretaria_provincial','tesoureiro_provincial',
  'chefe_campo_provincial','balu_provincial','akela_provincial',
  'pai_provincial','mae_provincial','conselheiro_provincial',
  'responsavel_agrupamento','adj_responsavel_agrupamento','secretaria_agrupamento','tesoureiro_agrupamento',
  'chefe_campo_agrupamento','balu_agrupamento','akela_agrupamento','assistente_agrupamento',
  'pai_agrupamento','mae_agrupamento','conselheiro_agrupamento'
);

-- ============ TABLES ============
CREATE TABLE public.agrupamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero int UNIQUE NOT NULL CHECK (numero BETWEEN 1 AND 100),
  nome text NOT NULL,
  paroquia text,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE SET NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cargo public.cargo NOT NULL,
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  nominated_by uuid REFERENCES auth.users(id),
  nominated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
CREATE INDEX ON public.nominations(agrupamento_id);
CREATE INDEX ON public.nominations(user_id);

CREATE TABLE public.equipamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero int UNIQUE NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id uuid NOT NULL REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id uuid NOT NULL REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'agrupamento' CHECK (scope IN ('agrupamento','provincial')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.chat_messages(agrupamento_id, created_at DESC);

CREATE TABLE public.alcateia_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('mistica','progressao')),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_divergences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id uuid REFERENCES public.agrupamentos(id) ON DELETE CASCADE,
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','resolvido')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ SECURITY DEFINER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.is_provincial_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='admin')
      OR EXISTS (SELECT 1 FROM public.nominations WHERE user_id=_user_id
                  AND cargo IN ('coord_provincial','adj_coord_provincial'));
$$;

CREATE OR REPLACE FUNCTION public.user_agrupamento_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT agrupamento_id FROM public.profiles WHERE id=_user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_agrupamento(_user_id uuid, _ag_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_provincial_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.nominations
                  WHERE user_id=_user_id AND agrupamento_id=_ag_id
                    AND cargo IN ('responsavel_agrupamento','adj_responsavel_agrupamento'));
$$;

CREATE OR REPLACE FUNCTION public.can_view_agrupamento(_user_id uuid, _ag_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_provincial_admin(_user_id)
      OR public.user_agrupamento_id(_user_id) = _ag_id
      OR EXISTS (SELECT 1 FROM public.nominations WHERE user_id=_user_id AND agrupamento_id=_ag_id);
$$;

-- ============ PROFILE TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  -- Auto-promote bootstrap admin
  IF NEW.email = 'oldumar2026@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_equipamentos_updated BEFORE UPDATE ON public.equipamentos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ENABLE RLS ============
ALTER TABLE public.agrupamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alcateia_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_divergences ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- agrupamentos: everyone authenticated can read; only admin can edit
CREATE POLICY "ag_read" ON public.agrupamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ag_admin_write" ON public.agrupamentos FOR ALL TO authenticated
  USING (public.is_provincial_admin(auth.uid())) WITH CHECK (public.is_provincial_admin(auth.uid()));

-- profiles: user reads own; admin reads all; same agrupamento can read each other
CREATE POLICY "profile_self" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_provincial_admin(auth.uid())
         OR (agrupamento_id IS NOT NULL AND agrupamento_id = public.user_agrupamento_id(auth.uid())));
CREATE POLICY "profile_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_provincial_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_provincial_admin(auth.uid()));
CREATE POLICY "profile_admin_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_provincial_admin(auth.uid()));

-- user_roles: admin only
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_provincial_admin(auth.uid())) WITH CHECK (public.is_provincial_admin(auth.uid()));
CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- nominations: read if can view agrupamento or admin or provincial cargo (ag_id null)
CREATE POLICY "nom_read" ON public.nominations FOR SELECT TO authenticated USING (
  agrupamento_id IS NULL
  OR public.can_view_agrupamento(auth.uid(), agrupamento_id)
);
-- write: admin OR responsavel of that agrupamento
CREATE POLICY "nom_write" ON public.nominations FOR INSERT TO authenticated WITH CHECK (
  public.is_provincial_admin(auth.uid())
  OR (agrupamento_id IS NOT NULL AND public.can_manage_agrupamento(auth.uid(), agrupamento_id))
);
CREATE POLICY "nom_update" ON public.nominations FOR UPDATE TO authenticated USING (
  public.is_provincial_admin(auth.uid())
  OR (agrupamento_id IS NOT NULL AND public.can_manage_agrupamento(auth.uid(), agrupamento_id))
) WITH CHECK (
  public.is_provincial_admin(auth.uid())
  OR (agrupamento_id IS NOT NULL AND public.can_manage_agrupamento(auth.uid(), agrupamento_id))
);
CREATE POLICY "nom_delete" ON public.nominations FOR DELETE TO authenticated USING (
  public.is_provincial_admin(auth.uid())
  OR (agrupamento_id IS NOT NULL AND public.can_manage_agrupamento(auth.uid(), agrupamento_id))
);

-- equipamentos: all authenticated read; only provincial admin write
CREATE POLICY "eq_read" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "eq_admin_write" ON public.equipamentos FOR ALL TO authenticated
  USING (public.is_provincial_admin(auth.uid())) WITH CHECK (public.is_provincial_admin(auth.uid()));

-- documents
CREATE POLICY "doc_read" ON public.documents FOR SELECT TO authenticated
  USING (public.can_view_agrupamento(auth.uid(), agrupamento_id));
CREATE POLICY "doc_write" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.can_view_agrupamento(auth.uid(), agrupamento_id));
CREATE POLICY "doc_delete" ON public.documents FOR DELETE TO authenticated
  USING (public.can_manage_agrupamento(auth.uid(), agrupamento_id) OR uploaded_by = auth.uid());

-- photos
CREATE POLICY "ph_read" ON public.photos FOR SELECT TO authenticated
  USING (public.can_view_agrupamento(auth.uid(), agrupamento_id));
CREATE POLICY "ph_write" ON public.photos FOR INSERT TO authenticated
  WITH CHECK (public.can_view_agrupamento(auth.uid(), agrupamento_id));
CREATE POLICY "ph_delete" ON public.photos FOR DELETE TO authenticated
  USING (public.can_manage_agrupamento(auth.uid(), agrupamento_id) OR uploaded_by = auth.uid());

-- chat_messages
CREATE POLICY "chat_read" ON public.chat_messages FOR SELECT TO authenticated USING (
  (scope='provincial')
  OR (scope='agrupamento' AND agrupamento_id IS NOT NULL AND public.can_view_agrupamento(auth.uid(), agrupamento_id))
);
CREATE POLICY "chat_write" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND (
    (scope='provincial')
    OR (scope='agrupamento' AND agrupamento_id IS NOT NULL AND public.can_view_agrupamento(auth.uid(), agrupamento_id))
  )
);
CREATE POLICY "chat_delete" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_provincial_admin(auth.uid()));

-- alcateia_posts
CREATE POLICY "alc_read" ON public.alcateia_posts FOR SELECT TO authenticated USING (
  agrupamento_id IS NULL OR public.can_view_agrupamento(auth.uid(), agrupamento_id)
);
CREATE POLICY "alc_write" ON public.alcateia_posts FOR INSERT TO authenticated WITH CHECK (
  public.is_provincial_admin(auth.uid())
  OR (agrupamento_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.nominations
    WHERE user_id=auth.uid() AND agrupamento_id=alcateia_posts.agrupamento_id
      AND cargo IN ('balu_agrupamento','akela_agrupamento','responsavel_agrupamento','adj_responsavel_agrupamento')
  ))
);
CREATE POLICY "alc_delete" ON public.alcateia_posts FOR DELETE TO authenticated USING (
  public.is_provincial_admin(auth.uid()) OR created_by = auth.uid()
);

-- audit
CREATE POLICY "audit_read" ON public.audit_divergences FOR SELECT TO authenticated
  USING (public.is_provincial_admin(auth.uid()));
CREATE POLICY "audit_write" ON public.audit_divergences FOR ALL TO authenticated
  USING (public.is_provincial_admin(auth.uid())) WITH CHECK (public.is_provincial_admin(auth.uid()));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('documents','documents', false),
  ('photos','photos', true),
  ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies. Path convention: '<agrupamento_id>/<filename>'
CREATE POLICY "docs_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id='documents' AND public.can_view_agrupamento(auth.uid(), (split_part(name,'/',1))::uuid)
);
CREATE POLICY "docs_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='documents' AND public.can_view_agrupamento(auth.uid(), (split_part(name,'/',1))::uuid)
);
CREATE POLICY "docs_del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='documents' AND (
    public.can_manage_agrupamento(auth.uid(), (split_part(name,'/',1))::uuid)
    OR owner = auth.uid()
  )
);

CREATE POLICY "photos_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='photos');
CREATE POLICY "photos_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='photos' AND public.can_view_agrupamento(auth.uid(), (split_part(name,'/',1))::uuid)
);
CREATE POLICY "photos_del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='photos' AND (
    public.can_manage_agrupamento(auth.uid(), (split_part(name,'/',1))::uuid)
    OR owner = auth.uid()
  )
);

CREATE POLICY "avatars_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='avatars');
CREATE POLICY "avatars_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='avatars' AND owner = auth.uid()
);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id='avatars' AND owner = auth.uid()
);
CREATE POLICY "avatars_del" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='avatars' AND owner = auth.uid()
);

-- ============ SEED Agrupamentos 01..100 ============
INSERT INTO public.agrupamentos (numero, nome)
SELECT n, 'Agrupamento ' || lpad(n::text, 2, '0')
FROM generate_series(1, 100) AS n
ON CONFLICT (numero) DO NOTHING;

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
