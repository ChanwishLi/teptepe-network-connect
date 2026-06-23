GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_complete ON public.profiles (id, profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_directory_order ON public.profiles (profile_complete, is_approved, is_featured, generation DESC);
CREATE INDEX IF NOT EXISTS idx_education_records_user_sort ON public.education_records (user_id, is_mandatory DESC, graduation_year DESC);
CREATE INDEX IF NOT EXISTS idx_mentorship_settings_user_id ON public.mentorship_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_internship_posts_status_created ON public.internship_posts (status, created_at DESC);