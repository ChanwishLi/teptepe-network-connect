
-- Connections (LinkedIn-style)
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted');

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX connections_requester_idx ON public.connections (requester_id);
CREATE INDEX connections_addressee_idx ON public.connections (addressee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own connections"
  ON public.connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users send connection requests"
  ON public.connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "addressee or requester updates"
  ON public.connections FOR UPDATE TO authenticated
  USING (addressee_id = auth.uid() OR requester_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "participants delete"
  ON public.connections FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER connections_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Count accepted connections for a user
CREATE OR REPLACE FUNCTION public.connection_count(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.connections
  WHERE status = 'accepted' AND (requester_id = _user_id OR addressee_id = _user_id);
$$;
