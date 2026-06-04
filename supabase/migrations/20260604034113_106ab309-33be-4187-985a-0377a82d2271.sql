
-- 1) New members require admin approval
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT false;

-- 2) Seed two admin auth users (idempotent)
DO $$
DECLARE
  uid uuid;
  emails text[] := ARRAY['chanwishlim.2007@gmail.com','chanwish.lim.2007@gmail.com'];
  e text;
BEGIN
  FOREACH e IN ARRAY emails LOOP
    SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(e) LIMIT 1;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        lower(e), crypt('Chanwishlim.2007', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('first_name','Admin','last_name','TEP-TEPE'),
        now(), now(), '', '', '', ''
      );

      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', lower(e)), 'email', uid::text, now(), now(), now());
    END IF;

    -- Profile (trigger may already have created one)
    INSERT INTO public.profiles (id, email, first_name, last_name, is_approved)
    VALUES (uid, lower(e), 'Admin', 'TEP-TEPE', true)
    ON CONFLICT (id) DO UPDATE SET is_approved = true;

    -- Admin role
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;
