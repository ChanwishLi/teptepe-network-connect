
-- Storage policies for 'media' bucket
CREATE POLICY "media read all" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media upload auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "media update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin')));

-- Wipe all users
DELETE FROM auth.users;
