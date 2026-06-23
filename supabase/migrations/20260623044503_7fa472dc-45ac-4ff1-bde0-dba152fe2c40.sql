CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "participants delete" ON public.connections
  USING ((requester_id = auth.uid()) OR (addressee_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own connections" ON public.connections
  USING ((requester_id = auth.uid()) OR (addressee_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own consent" ON public.consent_records
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users delete own non-mandatory education" ON public.education_records
  USING (((user_id = auth.uid()) AND (is_mandatory = false)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own education" ON public.education_records
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users update own non-mandatory education" ON public.education_records
  USING (((user_id = auth.uid()) AND (is_mandatory = false)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users manage own employment" ON public.employment_records
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own employment" ON public.employment_records
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users delete own rsvp" ON public.event_rsvps
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read rsvps" ON public.event_rsvps
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins manage events" ON public.events
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "anyone reads published events" ON public.events
  USING ((is_published = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins manage partners" ON public.industry_partners
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "authenticated read approved posts" ON public.internship_posts
  USING ((status = 'approved'::public.post_status) OR (created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "creator or admin deletes" ON public.internship_posts
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "creator or admin reads posts" ON public.internship_posts
  USING ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "creator updates own pending" ON public.internship_posts
  USING (((created_by = auth.uid()) AND (status = 'pending'::public.post_status)) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((created_by = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own mentorship" ON public.mentorship_settings
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "directory visible profiles" ON public.profiles
  USING ((is_approved = true) AND (profile_complete = true) AND (NOT private.has_role(id, 'admin'::public.app_role)));

ALTER POLICY "users read own profile" ON public.profiles
  USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users update own profile" ON public.profiles
  USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins manage stories" ON public.success_stories
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "anyone reads published stories" ON public.success_stories
  USING ((is_published = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users read own roles" ON public.user_roles
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

UPDATE public.profiles p
SET profile_complete = true,
    is_approved = true
WHERE EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = p.id
    AND ur.role = 'admin'::public.app_role
);