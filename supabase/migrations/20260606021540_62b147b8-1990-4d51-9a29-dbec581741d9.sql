
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  p.id, p.first_name, p.last_name, p.preferred_name, p.avatar_url,
  p.generation, p.program_type, p.major, p.partner_university,
  p.graduation_year, p.admission_year, p.city, p.country,
  p.professional_summary, p.skills, p.expertise, p.research_interests, p.certifications,
  p.is_featured, p.is_approved, p.profile_complete,
  CASE WHEN p.show_email THEN p.email END AS email,
  CASE WHEN p.show_phone THEN p.phone END AS phone,
  CASE WHEN p.show_linkedin THEN p.linkedin_url END AS linkedin_url,
  CASE WHEN p.show_facebook THEN p.facebook_url END AS facebook_url,
  CASE WHEN p.show_instagram THEN p.instagram_url END AS instagram_url,
  CASE WHEN p.show_website THEN p.personal_website END AS personal_website,
  COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.is_approved = true
  AND p.profile_complete = true
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin');

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Allow authenticated to read approved, completed, non-admin profiles directly (needed for view since security_invoker=on)
DROP POLICY IF EXISTS "directory visible profiles" ON public.profiles;
CREATE POLICY "directory visible profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    is_approved = true
    AND profile_complete = true
    AND NOT public.has_role(id, 'admin')
  );
