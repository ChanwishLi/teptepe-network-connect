CREATE INDEX IF NOT EXISTS idx_events_published_date ON public.events (is_published, is_archived, event_date);
CREATE INDEX IF NOT EXISTS idx_events_slug_published ON public.events (slug, is_published) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_success_stories_published_created ON public.success_stories (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_slug_published ON public.success_stories (slug, is_published) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_featured_generation ON public.profiles (is_featured, generation DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_directory_filters ON public.profiles (profile_complete, generation DESC, program_type, major, country);
CREATE INDEX IF NOT EXISTS idx_internship_posts_status_created ON public.internship_posts (status, created_at DESC);