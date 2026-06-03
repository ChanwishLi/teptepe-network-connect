
-- Storage policies for avatars (private bucket, signed URLs)
CREATE POLICY "users read own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update handle_new_user to capture honors on the auto-generated bachelor record
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text := COALESCE(m->>'first_name','');
  v_last  text := COALESCE(m->>'last_name','');
  v_program public.program_type := NULLIF(m->>'program_type','')::public.program_type;
  v_major public.major_type := NULLIF(m->>'major','')::public.major_type;
  v_gen int := NULLIF(m->>'generation','')::int;
  v_grad int := NULLIF(m->>'graduation_year','')::int;
  v_partner text := NULLIF(m->>'partner_university','');
  v_honors text := NULLIF(m->>'honors','');
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, preferred_name, gender, date_of_birth, nationality,
    phone, address, city, province, country,
    facebook_url, instagram_url, linkedin_url, personal_website,
    student_id, program_type, major, admission_year, graduation_year, generation, partner_university
  ) VALUES (
    NEW.id, NEW.email, v_first, v_last,
    NULLIF(m->>'preferred_name',''), NULLIF(m->>'gender',''),
    NULLIF(m->>'date_of_birth','')::date, NULLIF(m->>'nationality',''),
    NULLIF(m->>'phone',''), NULLIF(m->>'address',''),
    NULLIF(m->>'city',''), NULLIF(m->>'province',''), NULLIF(m->>'country',''),
    NULLIF(m->>'facebook_url',''), NULLIF(m->>'instagram_url',''),
    NULLIF(m->>'linkedin_url',''), NULLIF(m->>'personal_website',''),
    NULLIF(m->>'student_id',''), v_program, v_major,
    NULLIF(m->>'admission_year','')::int, v_grad, v_gen, v_partner
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'alumni')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.mentorship_settings (user_id) VALUES (NEW.id)
    ON CONFLICT DO NOTHING;

  IF v_program = 'TEPE' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, honors, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, v_honors, true);
  ELSIF v_program = 'TEP' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, honors, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, v_honors, true);
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'bachelor', COALESCE(v_partner,'Partner University'), COALESCE(v_major::text,''), NULL, v_grad, true);
  ELSIF v_program = 'TEPE+' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, honors, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, v_honors, true);
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'master', COALESCE(v_partner,'Partner University'), COALESCE(v_major::text,''), NULL, v_grad, true);
  END IF;

  RETURN NEW;
END $function$;

-- Ensure the trigger exists (handle_new_user is invoked on auth.users insert)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
