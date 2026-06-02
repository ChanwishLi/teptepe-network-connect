
-- Switch public views to SECURITY DEFINER so they bypass RLS on base tables
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT p.id, p.first_name, p.last_name, p.preferred_name, p.avatar_url,
       p.country, p.city, p.program_type, p.major, p.generation,
       p.graduation_year, p.admission_year, p.partner_university,
       p.professional_summary, p.skills, p.expertise, p.research_interests,
       p.certifications, p.is_featured, p.created_at,
       COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.is_approved = true;

CREATE OR REPLACE VIEW public.internship_posts_public
WITH (security_invoker = off) AS
SELECT id, position, company_name, employment_type, description, location,
       application_link, deadline, status, created_at, updated_at
FROM public.internship_posts
WHERE status = 'approved'::public.post_status;

GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.internship_posts_public TO anon, authenticated;

-- Tighten education_records SELECT
DROP POLICY IF EXISTS "authenticated reads education" ON public.education_records;
CREATE POLICY "users read own education"
  ON public.education_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tighten employment_records SELECT
DROP POLICY IF EXISTS "authenticated reads employment" ON public.employment_records;
CREATE POLICY "users read own employment"
  ON public.employment_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tighten mentorship_settings SELECT
DROP POLICY IF EXISTS "authenticated reads mentorship" ON public.mentorship_settings;
CREATE POLICY "users read own mentorship"
  ON public.mentorship_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tighten internship_posts: only creator/admin can read base table (incl. contact_email).
-- Everyone else goes through the internship_posts_public view (which omits contact_email).
DROP POLICY IF EXISTS "authenticated reads approved posts" ON public.internship_posts;
CREATE POLICY "creator or admin reads posts"
  ON public.internship_posts FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
