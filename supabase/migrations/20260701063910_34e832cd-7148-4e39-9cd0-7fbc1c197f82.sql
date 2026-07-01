
DO $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  DELETE FROM auth.users WHERE email = 'admin@admin.com';

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'admin@admin.com', crypt('admin', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', 'admin@admin.com'), 'email', now(), now(), now());

  INSERT INTO public.profiles (id, email, first_name, last_name, profile_complete, is_approved)
  VALUES (v_id, 'admin@admin.com', 'Admin', 'User', true, true)
  ON CONFLICT (id) DO UPDATE SET profile_complete = true, is_approved = true;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;
