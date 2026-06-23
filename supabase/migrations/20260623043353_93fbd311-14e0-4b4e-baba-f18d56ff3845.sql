
-- Remove admin approval requirement: drop is_approved filter from public view, default approve everyone
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT true;
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;

-- Add partner_major column (degree program name studied at partner university)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_major text;

-- Recreate public view without approval gate
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker=on) AS
SELECT p.id, p.first_name, p.last_name, p.preferred_name, p.avatar_url,
  p.generation, p.program_type, p.major, p.partner_university, p.partner_major,
  p.graduation_year, p.admission_year, p.city, p.country,
  p.professional_summary, p.skills, p.expertise, p.research_interests, p.certifications,
  p.is_featured, p.is_approved, p.profile_complete,
  CASE WHEN p.show_email THEN p.email ELSE NULL::text END AS email,
  CASE WHEN p.show_phone THEN p.phone ELSE NULL::text END AS phone,
  CASE WHEN p.show_linkedin THEN p.linkedin_url ELSE NULL::text END AS linkedin_url,
  CASE WHEN p.show_facebook THEN p.facebook_url ELSE NULL::text END AS facebook_url,
  CASE WHEN p.show_instagram THEN p.instagram_url ELSE NULL::text END AS instagram_url,
  CASE WHEN p.show_website THEN p.personal_website ELSE NULL::text END AS personal_website,
  COALESCE(ms.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings ms ON ms.user_id = p.id
WHERE p.profile_complete = true
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin');

GRANT SELECT ON public.profiles_public TO authenticated;

-- Update trigger to support partner_major
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text := COALESCE(NULLIF(m->>'first_name',''), NULLIF(m->>'given_name',''), split_part(COALESCE(m->>'full_name', m->>'name', ''), ' ', 1), '');
  v_last  text := COALESCE(NULLIF(m->>'last_name',''),  NULLIF(m->>'family_name',''), NULLIF(substring(COALESCE(m->>'full_name', m->>'name', '') FROM position(' ' in COALESCE(m->>'full_name', m->>'name', '')||' ')+1), ''), '');
  v_avatar text := COALESCE(NULLIF(m->>'avatar_url',''), NULLIF(m->>'picture',''));
  v_program public.program_type := NULLIF(m->>'program_type','')::public.program_type;
  v_major public.major_type := NULLIF(m->>'major','')::public.major_type;
  v_gen int := NULLIF(m->>'generation','')::int;
  v_grad int := NULLIF(m->>'graduation_year','')::int;
  v_partner text := NULLIF(m->>'partner_university','');
  v_partner_major text := NULLIF(m->>'partner_major','');
  v_honors text := NULLIF(m->>'honors','');
  v_partner_degree public.education_level := COALESCE(NULLIF(m->>'partner_degree','')::public.education_level, CASE WHEN v_program = 'TEPE+' THEN 'master'::public.education_level ELSE 'bachelor'::public.education_level END);
  v_complete boolean := (v_program IS NOT NULL AND v_major IS NOT NULL AND v_gen IS NOT NULL AND v_grad IS NOT NULL);
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, preferred_name, gender, date_of_birth, nationality,
    phone, address, city, province, country, avatar_url,
    facebook_url, instagram_url, linkedin_url, personal_website,
    student_id, program_type, major, admission_year, graduation_year, generation, partner_university, partner_major,
    professional_summary, skills, expertise, research_interests, certifications,
    profile_complete, is_approved
  ) VALUES (
    NEW.id, NEW.email, v_first, v_last,
    NULLIF(m->>'preferred_name',''), NULLIF(m->>'gender',''),
    NULLIF(m->>'date_of_birth','')::date, NULLIF(m->>'nationality',''),
    NULLIF(m->>'phone',''), NULLIF(m->>'address',''),
    NULLIF(m->>'city',''), NULLIF(m->>'province',''), NULLIF(m->>'country',''),
    v_avatar,
    NULLIF(m->>'facebook_url',''), NULLIF(m->>'instagram_url',''),
    NULLIF(m->>'linkedin_url',''), NULLIF(m->>'personal_website',''),
    NULLIF(m->>'student_id',''), v_program, v_major,
    NULLIF(m->>'admission_year','')::int, v_grad, v_gen, v_partner, v_partner_major,
    NULLIF(m->>'professional_summary',''),
    COALESCE(string_to_array(NULLIF(m->>'skills',''), ','), '{}'::text[]),
    COALESCE(string_to_array(NULLIF(m->>'expertise',''), ','), '{}'::text[]),
    COALESCE(string_to_array(NULLIF(m->>'research_interests',''), ','), '{}'::text[]),
    COALESCE(string_to_array(NULLIF(m->>'certifications',''), ','), '{}'::text[]),
    v_complete, true
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'alumni') ON CONFLICT DO NOTHING;
  INSERT INTO public.mentorship_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  IF v_program = 'TEPE' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, honors, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, v_honors, true)
    ON CONFLICT DO NOTHING;
  ELSIF v_program IN ('TEP', 'TEPE+') THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, honors, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, v_honors, true)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, v_partner_degree, COALESCE(v_partner,'Partner University'), COALESCE(NULLIF(v_partner_major,''), v_major::text, ''), NULL, v_grad, true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END
$function$;
