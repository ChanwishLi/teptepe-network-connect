
-- 1. Fix profiles_public so authenticated users can browse alumni again.
-- Switch back to security-definer (owner-privileged) view; the view itself
-- already filters PII via show_* gates in CASE expressions, so this is safe.
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT
  p.id, p.first_name, p.last_name, p.preferred_name, p.avatar_url,
  p.country, p.city, p.program_type, p.major, p.generation,
  p.graduation_year, p.admission_year, p.partner_university,
  p.professional_summary, p.skills, p.expertise, p.research_interests,
  p.certifications, p.is_featured, p.created_at,
  CASE WHEN p.show_email THEN p.email ELSE NULL END AS email,
  CASE WHEN p.show_phone THEN p.phone ELSE NULL END AS phone,
  CASE WHEN p.show_linkedin THEN p.linkedin_url ELSE NULL END AS linkedin_url,
  CASE WHEN p.show_website THEN p.personal_website ELSE NULL END AS personal_website,
  CASE WHEN p.show_facebook THEN p.facebook_url ELSE NULL END AS facebook_url,
  CASE WHEN p.show_instagram THEN p.instagram_url ELSE NULL END AS instagram_url,
  COALESCE(m.available_as_mentor, false) AS available_as_mentor
FROM public.profiles p
LEFT JOIN public.mentorship_settings m ON m.user_id = p.id
WHERE p.is_approved = true;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. Storage policy: any authenticated user can read avatars (private bucket).
DROP POLICY IF EXISTS "authenticated read avatars" ON storage.objects;
CREATE POLICY "authenticated read avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "users upload own avatar" ON storage.objects;
CREATE POLICY "users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "users update own avatar" ON storage.objects;
CREATE POLICY "users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Add slug + content/summary to blog-style tables.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.success_stories
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS summary text;

-- 4. Wipe all non-admin users (admin-only environment reset).
DO $$
DECLARE
  admin_ids uuid[];
  uid uuid;
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';
  IF admin_ids IS NULL THEN admin_ids := '{}'; END IF;

  DELETE FROM public.consent_records WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.education_records WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.employment_records WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.event_rsvps WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.mentorship_settings WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.internship_posts WHERE created_by <> ALL(admin_ids);
  DELETE FROM public.user_roles WHERE user_id <> ALL(admin_ids);
  DELETE FROM public.profiles WHERE id <> ALL(admin_ids);

  FOR uid IN SELECT id FROM auth.users WHERE id <> ALL(admin_ids) LOOP
    DELETE FROM auth.users WHERE id = uid;
  END LOOP;
END $$;
