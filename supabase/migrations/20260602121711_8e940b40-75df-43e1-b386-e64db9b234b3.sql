
-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'alumni');
CREATE TYPE public.program_type AS ENUM ('TEPE', 'TEP', 'TEPE+');
CREATE TYPE public.major_type AS ENUM (
  'Chemical Engineering and Management',
  'Civil Engineering and Real Estate Development',
  'Electrical and Data Engineering',
  'Mechanical Engineering and Industrial Management',
  'Industrial Engineering (Legacy Program)'
);
CREATE TYPE public.education_level AS ENUM ('high_school','bachelor','master','phd','certification');
CREATE TYPE public.post_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.employment_type AS ENUM ('internship','full_time','part_time','contract');
CREATE TYPE public.generation_status AS ENUM ('alumni','current_student','incoming_student');

-- Helper: generation status from gen number
CREATE OR REPLACE FUNCTION public.current_generation_status(gen int)
RETURNS public.generation_status LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN gen BETWEEN 1 AND 27 THEN 'alumni'::public.generation_status
    WHEN gen BETWEEN 28 AND 30 THEN 'current_student'::public.generation_status
    WHEN gen = 31 THEN 'incoming_student'::public.generation_status
    ELSE 'alumni'::public.generation_status
  END;
$$;

-- =====================
-- USER ROLES
-- =====================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  preferred_name text,
  gender text,
  date_of_birth date,
  nationality text,
  avatar_url text,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  province text,
  country text,
  facebook_url text,
  instagram_url text,
  linkedin_url text,
  personal_website text,
  show_email boolean NOT NULL DEFAULT true,
  show_phone boolean NOT NULL DEFAULT false,
  show_facebook boolean NOT NULL DEFAULT true,
  show_instagram boolean NOT NULL DEFAULT true,
  show_linkedin boolean NOT NULL DEFAULT true,
  show_website boolean NOT NULL DEFAULT true,
  student_id text,
  program_type public.program_type,
  major public.major_type,
  admission_year int,
  graduation_year int,
  generation int CHECK (generation BETWEEN 1 AND 31),
  partner_university text,
  professional_summary text,
  skills text[] NOT NULL DEFAULT '{}',
  expertise text[] NOT NULL DEFAULT '{}',
  research_interests text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  is_approved boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads approved profiles" ON public.profiles FOR SELECT TO anon, authenticated
  USING (is_approved = true OR id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE INDEX idx_profiles_generation ON public.profiles(generation);
CREATE INDEX idx_profiles_program ON public.profiles(program_type);
CREATE INDEX idx_profiles_major ON public.profiles(major);
CREATE INDEX idx_profiles_country ON public.profiles(country);

-- =====================
-- EDUCATION
-- =====================
CREATE TABLE public.education_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level public.education_level NOT NULL,
  institution text NOT NULL,
  major text,
  country text,
  graduation_year int,
  honors text,
  is_mandatory boolean NOT NULL DEFAULT false,
  organization text,
  year_awarded int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_records TO authenticated;
GRANT SELECT ON public.education_records TO anon;
GRANT ALL ON public.education_records TO service_role;
ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads education" ON public.education_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users insert own education" ON public.education_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own non-mandatory education" ON public.education_records FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() AND is_mandatory = false) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users delete own non-mandatory education" ON public.education_records FOR DELETE TO authenticated
  USING ((user_id = auth.uid() AND is_mandatory = false) OR public.has_role(auth.uid(),'admin'));

-- =====================
-- EMPLOYMENT
-- =====================
CREATE TABLE public.employment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  business_type text,
  industry text,
  country text,
  city text,
  start_year int,
  end_year int,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment_records TO authenticated;
GRANT SELECT ON public.employment_records TO anon;
GRANT ALL ON public.employment_records TO service_role;
ALTER TABLE public.employment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads employment" ON public.employment_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users manage own employment" ON public.employment_records FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_employment_user ON public.employment_records(user_id);
CREATE INDEX idx_employment_company ON public.employment_records(company);

-- =====================
-- MENTORSHIP
-- =====================
CREATE TABLE public.mentorship_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_as_mentor boolean NOT NULL DEFAULT false,
  mentorship_areas text[] NOT NULL DEFAULT '{}',
  industry_expertise text[] NOT NULL DEFAULT '{}',
  preferred_contact_method text,
  hours_per_month int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_settings TO authenticated;
GRANT SELECT ON public.mentorship_settings TO anon;
GRANT ALL ON public.mentorship_settings TO service_role;
ALTER TABLE public.mentorship_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads mentorship" ON public.mentorship_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users manage own mentorship" ON public.mentorship_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================
-- PDPA CONSENT
-- =====================
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version text NOT NULL,
  data_collection boolean NOT NULL,
  directory_participation boolean NOT NULL,
  communications boolean NOT NULL,
  mentorship_matching boolean NOT NULL,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own consent" ON public.consent_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own consent" ON public.consent_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================
-- EVENTS + RSVPS
-- =====================
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  location text,
  banner_url text,
  rsvp_deadline date,
  is_published boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads published events" ON public.events FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read rsvps" ON public.event_rsvps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users create own rsvp" ON public.event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users delete own rsvp" ON public.event_rsvps FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =====================
-- SUCCESS STORIES
-- =====================
CREATE TABLE public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  featured_alumni_id uuid REFERENCES public.profiles(id),
  alumni_name text,
  generation int,
  company text,
  content text NOT NULL,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.success_stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.success_stories TO authenticated;
GRANT ALL ON public.success_stories TO service_role;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads published stories" ON public.success_stories FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage stories" ON public.success_stories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =====================
-- NEWS
-- =====================
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  content text NOT NULL,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads published news" ON public.news_posts FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage news" ON public.news_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =====================
-- INTERNSHIPS
-- =====================
CREATE TABLE public.internship_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  position text NOT NULL,
  employment_type public.employment_type NOT NULL DEFAULT 'internship',
  description text NOT NULL,
  location text,
  application_link text,
  contact_email text,
  deadline date,
  status public.post_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internship_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.internship_posts TO authenticated;
GRANT ALL ON public.internship_posts TO service_role;
ALTER TABLE public.internship_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads approved posts" ON public.internship_posts FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "alumni create posts" ON public.internship_posts FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "creator updates own pending" ON public.internship_posts FOR UPDATE TO authenticated
  USING ((created_by = auth.uid() AND status = 'pending') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK ((created_by = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "creator or admin deletes" ON public.internship_posts FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =====================
-- INDUSTRY PARTNERS
-- =====================
CREATE TABLE public.industry_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.industry_partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.industry_partners TO authenticated;
GRANT ALL ON public.industry_partners TO service_role;
ALTER TABLE public.industry_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads partners" ON public.industry_partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage partners" ON public.industry_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =====================
-- updated_at TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stories_updated BEFORE UPDATE ON public.success_stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_internships_updated BEFORE UPDATE ON public.internship_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================
-- handle_new_user TRIGGER
-- Creates profile, grants alumni role, creates mandatory education records
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text := COALESCE(m->>'first_name','');
  v_last  text := COALESCE(m->>'last_name','');
  v_program public.program_type := NULLIF(m->>'program_type','')::public.program_type;
  v_major public.major_type := NULLIF(m->>'major','')::public.major_type;
  v_gen int := NULLIF(m->>'generation','')::int;
  v_grad int := NULLIF(m->>'graduation_year','')::int;
  v_partner text := NULLIF(m->>'partner_university','');
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
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'alumni');
  INSERT INTO public.mentorship_settings (user_id) VALUES (NEW.id);

  -- Mandatory education records based on program
  IF v_program = 'TEPE' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, true);
  ELSIF v_program = 'TEP' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, true);
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'bachelor', COALESCE(v_partner,'Partner University'), COALESCE(v_major::text,''), NULL, v_grad, true);
  ELSIF v_program = 'TEPE+' THEN
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'bachelor', 'Thammasat University', COALESCE(v_major::text,''), 'Thailand', v_grad, true);
    INSERT INTO public.education_records (user_id, level, institution, major, country, graduation_year, is_mandatory)
    VALUES (NEW.id, 'master', COALESCE(v_partner,'Partner University'), COALESCE(v_major::text,''), NULL, v_grad, true);
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- STORAGE POLICIES
-- =====================
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read event-banners" ON storage.objects FOR SELECT USING (bucket_id = 'event-banners');
CREATE POLICY "Admins manage event banners" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'event-banners' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'event-banners' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read story-images" ON storage.objects FOR SELECT USING (bucket_id = 'story-images');
CREATE POLICY "Admins manage story images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'story-images' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'story-images' AND public.has_role(auth.uid(),'admin'));
