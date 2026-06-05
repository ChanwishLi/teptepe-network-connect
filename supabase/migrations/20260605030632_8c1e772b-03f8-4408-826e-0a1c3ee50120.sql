
-- Tighten profiles SELECT policy: own row + admin only
DROP POLICY IF EXISTS "authenticated reads approved profiles" ON public.profiles;
CREATE POLICY "users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Recreate profiles_public to include show_*-gated contact fields and mentor info
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
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
  CASE WHEN p.show_email THEN p.email END AS email,
  CASE WHEN p.show_phone THEN p.phone END AS phone,
  CASE WHEN p.show_linkedin THEN p.linkedin_url END AS linkedin_url,
  CASE WHEN p.show_website THEN p.personal_website END AS personal_website,
  CASE WHEN p.show_facebook THEN p.facebook_url END AS facebook_url,
  CASE WHEN p.show_instagram THEN p.instagram_url END AS instagram_url,
  p.show_email,
  p.show_phone,
  p.show_linkedin,
  p.show_website,
  p.show_facebook,
  p.show_instagram,
  COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.is_approved = true;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Switch internship_posts_public to security_invoker
ALTER VIEW public.internship_posts_public SET (security_invoker = on);
