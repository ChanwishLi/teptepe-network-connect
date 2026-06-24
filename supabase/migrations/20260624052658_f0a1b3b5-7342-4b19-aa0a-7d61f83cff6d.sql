
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.success_stories ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_caption text;
