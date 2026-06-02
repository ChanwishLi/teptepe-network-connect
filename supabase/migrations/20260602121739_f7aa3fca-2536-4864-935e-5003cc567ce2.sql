
-- Fix search_path
CREATE OR REPLACE FUNCTION public.current_generation_status(gen int)
RETURNS public.generation_status LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN gen BETWEEN 1 AND 27 THEN 'alumni'::public.generation_status
    WHEN gen BETWEEN 28 AND 30 THEN 'current_student'::public.generation_status
    WHEN gen = 31 THEN 'incoming_student'::public.generation_status
    ELSE 'alumni'::public.generation_status
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke public EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
