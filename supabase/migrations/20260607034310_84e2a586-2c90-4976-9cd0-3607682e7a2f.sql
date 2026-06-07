REVOKE EXECUTE ON FUNCTION public.connection_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.connection_count(uuid) TO authenticated, service_role;