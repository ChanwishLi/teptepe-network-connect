
-- 1. profiles: remove broad directory read on base table; route all directory reads through profiles_public
DROP POLICY IF EXISTS "directory visible profiles" ON public.profiles;

-- 2. internship_posts: remove broad approved-read on base table; keep creator/admin read; public listing goes through internship_posts_public
DROP POLICY IF EXISTS "authenticated read approved posts" ON public.internship_posts;

-- 3. Make the public views run with definer rights so they bypass the (now stricter) base-table RLS
--    They already project only safe columns / respect show_* toggles.
ALTER VIEW public.profiles_public SET (security_invoker = off);
ALTER VIEW public.internship_posts_public SET (security_invoker = off);

GRANT SELECT ON public.profiles_public TO authenticated, anon;
GRANT SELECT ON public.internship_posts_public TO authenticated, anon;

-- 4. Storage: media bucket — remove public read + unowned upload
DROP POLICY IF EXISTS "media read all" ON storage.objects;
DROP POLICY IF EXISTS "media upload auth" ON storage.objects;

CREATE POLICY "media read authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media');

-- Uploads must be scoped to a folder named after the authenticated user's id
CREATE POLICY "media upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
