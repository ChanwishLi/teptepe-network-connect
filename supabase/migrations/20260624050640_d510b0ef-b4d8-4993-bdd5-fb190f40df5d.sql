
DO $$
DECLARE
  admin_emails text[] := ARRAY['chanwishlim.2007@gmail.com', 'chanwish.lim.2007@gmail.com'];
  e text;
  uid uuid;
  hashed text;
BEGIN
  FOREACH e IN ARRAY admin_emails LOOP
    SELECT id INTO uid FROM auth.users WHERE email = e LIMIT 1;
    IF uid IS NULL THEN
      uid := gen_random_uuid();
      hashed := extensions.crypt('Admin12345!', extensions.gen_salt('bf'));
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', e, hashed,
        now(), jsonb_build_object('provider','email','providers',ARRAY['email']),
        jsonb_build_object('first_name','Admin','last_name','User'),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', e), 'email', uid::text, now(), now(), now());
    END IF;

    INSERT INTO public.profiles (id, email, first_name, last_name, profile_complete, is_approved)
    VALUES (uid, e, 'Admin', 'User', true, true)
    ON CONFLICT (id) DO UPDATE SET profile_complete = true, is_approved = true;

    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.mentorship_settings (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
