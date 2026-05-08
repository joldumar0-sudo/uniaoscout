
-- Allow provincial-level (null agrupamento) library/gallery items
ALTER TABLE public.documents ALTER COLUMN agrupamento_id DROP NOT NULL;
ALTER TABLE public.photos ALTER COLUMN agrupamento_id DROP NOT NULL;

-- Helper: who can upload media (library/gallery)
CREATE OR REPLACE FUNCTION public.can_upload_media(_user_id uuid, _ag_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.nominations
                WHERE user_id = _user_id
                  AND cargo IN ('coord_provincial','adj_coord_provincial'))
    OR (_ag_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.nominations
           WHERE user_id = _user_id
             AND agrupamento_id = _ag_id
             AND cargo IN ('responsavel_agrupamento','adj_responsavel_agrupamento')))
$$;

-- Documents RLS
DROP POLICY IF EXISTS doc_read ON public.documents;
DROP POLICY IF EXISTS doc_write ON public.documents;
DROP POLICY IF EXISTS doc_delete ON public.documents;

CREATE POLICY doc_read ON public.documents FOR SELECT TO authenticated
  USING (agrupamento_id IS NULL OR public.can_view_agrupamento(auth.uid(), agrupamento_id));

CREATE POLICY doc_write ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.can_upload_media(auth.uid(), agrupamento_id));

CREATE POLICY doc_delete ON public.documents FOR DELETE TO authenticated
  USING (public.can_upload_media(auth.uid(), agrupamento_id) OR uploaded_by = auth.uid());

-- Photos RLS
DROP POLICY IF EXISTS ph_read ON public.photos;
DROP POLICY IF EXISTS ph_write ON public.photos;
DROP POLICY IF EXISTS ph_delete ON public.photos;

CREATE POLICY ph_read ON public.photos FOR SELECT TO authenticated
  USING (agrupamento_id IS NULL OR public.can_view_agrupamento(auth.uid(), agrupamento_id));

CREATE POLICY ph_write ON public.photos FOR INSERT TO authenticated
  WITH CHECK (public.can_upload_media(auth.uid(), agrupamento_id));

CREATE POLICY ph_delete ON public.photos FOR DELETE TO authenticated
  USING (public.can_upload_media(auth.uid(), agrupamento_id) OR uploaded_by = auth.uid());

-- Storage policies (documents private, photos public-read)
DROP POLICY IF EXISTS "docs_read_auth" ON storage.objects;
DROP POLICY IF EXISTS "docs_write_uploaders" ON storage.objects;
DROP POLICY IF EXISTS "docs_delete_uploaders" ON storage.objects;
DROP POLICY IF EXISTS "photos_read_public" ON storage.objects;
DROP POLICY IF EXISTS "photos_write_uploaders" ON storage.objects;
DROP POLICY IF EXISTS "photos_delete_uploaders" ON storage.objects;

CREATE POLICY "docs_read_auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');
CREATE POLICY "docs_write_uploaders" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');
CREATE POLICY "docs_delete_uploaders" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "photos_read_public" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'photos');
CREATE POLICY "photos_write_uploaders" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');
CREATE POLICY "photos_delete_uploaders" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos');

-- Only TRUE admins can manage admin role assignment
DROP POLICY IF EXISTS roles_admin_all ON public.user_roles;

CREATE POLICY roles_admin_read ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_provincial_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY roles_admin_write ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY roles_admin_update ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY roles_admin_delete ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
