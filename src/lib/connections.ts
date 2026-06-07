import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type ConnectionRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

export type ConnectionState =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "outgoing"; row: ConnectionRow }
  | { kind: "incoming"; row: ConnectionRow }
  | { kind: "accepted"; row: ConnectionRow };

/** Resolve the connection status between the current user and another profile. */
export function useConnectionState(otherUserId: string | undefined) {
  const { user } = useAuth();
  const me = user?.id;

  const query = useQuery({
    enabled: !!me && !!otherUserId,
    queryKey: ["connection", me, otherUserId],
    queryFn: async (): Promise<ConnectionState> => {
      if (!me || !otherUserId) return { kind: "none" };
      if (me === otherUserId) return { kind: "self" };
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${me},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${me})`,
        )
        .maybeSingle();
      if (error) throw error;
      if (!data) return { kind: "none" };
      const row = data as ConnectionRow;
      if (row.status === "accepted") return { kind: "accepted", row };
      return row.requester_id === me ? { kind: "outgoing", row } : { kind: "incoming", row };
    },
  });

  return query;
}

export function useConnectionCount(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["connection-count", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("connection_count", { _user_id: userId! });
      if (error) throw error;
      return (data as number | null) ?? 0;
    },
  });
}

export function useConnectionActions(otherUserId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const me = user?.id;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["connection", me, otherUserId] });
    qc.invalidateQueries({ queryKey: ["connection-count"] });
    qc.invalidateQueries({ queryKey: ["my-connections"] });
  };

  const send = useMutation({
    mutationFn: async () => {
      if (!me || !otherUserId) throw new Error("Not signed in");
      const { error } = await supabase.from("connections").insert({
        requester_id: me,
        addressee_id: otherUserId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("connections").update({ status: "accepted" }).eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("connections").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { send, accept, remove };
}

/** All connection rows the signed-in user is a participant in. */
export function useMyConnections() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["my-connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConnectionRow[];
    },
  });
}
