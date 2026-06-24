
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT p.id, p.first_name, p.last_name, p.preferred_name, p.avatar_url,
  p.generation, p.program_type, p.major, p.partner_university, p.partner_major,
  p.graduation_year, p.admission_year, p.city, p.country,
  p.professional_summary, p.skills, p.expertise, p.research_interests, p.certifications,
  p.is_featured, p.is_approved, p.profile_complete, p.featured_caption,
  CASE WHEN p.show_email THEN p.email ELSE NULL END AS email,
  CASE WHEN p.show_phone THEN p.phone ELSE NULL END AS phone,
  CASE WHEN p.show_linkedin THEN p.linkedin_url ELSE NULL END AS linkedin_url,
  CASE WHEN p.show_facebook THEN p.facebook_url ELSE NULL END AS facebook_url,
  CASE WHEN p.show_instagram THEN p.instagram_url ELSE NULL END AS instagram_url,
  CASE WHEN p.show_website THEN p.personal_website ELSE NULL END AS personal_website,
  COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.profile_complete = true
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin'::public.app_role);

GRANT SELECT ON public.profiles_public TO anon, authenticated;
