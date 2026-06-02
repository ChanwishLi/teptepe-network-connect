
-- 1) PROFILES: restrict full-row reads to authenticated; expose a safe public view
DROP POLICY IF EXISTS "anyone reads approved profiles" ON public.profiles;

CREATE POLICY "authenticated reads approved profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING ((is_approved = true) OR (id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.preferred_name,
  p.avatar_url,
  p.country,
  p.city,
  p.program_type,
  p.major,
  p.generation,
  p.graduation_year,
  p.admission_year,
  p.partner_university,
  p.professional_summary,
  p.skills,
  p.expertise,
  p.research_interests,
  p.certifications,
  p.is_featured,
  p.created_at,
  COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.is_approved = true;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2) EDUCATION RECORDS: authenticated reads only
DROP POLICY IF EXISTS "anyone reads education" ON public.education_records;
CREATE POLICY "authenticated reads education"
  ON public.education_records FOR SELECT TO authenticated USING (true);

-- 3) EMPLOYMENT RECORDS: authenticated reads only
DROP POLICY IF EXISTS "anyone reads employment" ON public.employment_records;
CREATE POLICY "authenticated reads employment"
  ON public.employment_records FOR SELECT TO authenticated USING (true);

-- 4) MENTORSHIP SETTINGS: authenticated reads only
DROP POLICY IF EXISTS "anyone reads mentorship" ON public.mentorship_settings;
CREATE POLICY "authenticated reads mentorship"
  ON public.mentorship_settings FOR SELECT TO authenticated USING (true);

-- 5) INTERNSHIP POSTS: hide contact_email from public; restrict base SELECT to authenticated
DROP POLICY IF EXISTS "anyone reads approved posts" ON public.internship_posts;
CREATE POLICY "authenticated reads approved posts"
  ON public.internship_posts FOR SELECT TO authenticated
  USING ((status = 'approved'::post_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.internship_posts_public
WITH (security_invoker = on) AS
SELECT
  id, position, company_name, employment_type, description,
  location, application_link, deadline, status, created_at, updated_at
FROM public.internship_posts
WHERE status = 'approved'::post_status;

GRANT SELECT ON public.internship_posts_public TO anon, authenticated;

-- 6) Lock down SECURITY DEFINER trigger functions and convert pure helper to invoker
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.current_generation_status(gen integer)
 RETURNS generation_status
 LANGUAGE sql
 IMMUTABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN gen BETWEEN 1 AND 27 THEN 'alumni'::public.generation_status
    WHEN gen BETWEEN 28 AND 30 THEN 'current_student'::public.generation_status
    WHEN gen = 31 THEN 'incoming_student'::public.generation_status
    ELSE 'alumni'::public.generation_status
  END;
$function$;
