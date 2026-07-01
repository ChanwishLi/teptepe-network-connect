import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastRoleUidRef = useRef<string | null>(null);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) {
      lastRoleUidRef.current = null;
      setIsAdmin(false);
      return;
    }
    // Skip duplicate lookups for the same user (e.g. TOKEN_REFRESHED, INITIAL_SESSION)
    if (lastRoleUidRef.current === uid) return;
    lastRoleUidRef.current = uid;
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setIsAdmin(!error && !!data?.some((r) => r.role === "admin"));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Only react to identity transitions; ignore TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") {
        // Still keep session/user object fresh without touching role or loading state
        setSession(s);
        setUser(s?.user ?? null);
        return;
      }
      setSession(s);
      setUser(s?.user ?? null);
      if (event === "SIGNED_OUT") {
        lastRoleUidRef.current = null;
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Defer to avoid auth deadlock
      setTimeout(() => loadRole(s?.user?.id).finally(() => setLoading(false)), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRole(data.session?.user?.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    session,
    isAdmin,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRole: async () => {
      lastRoleUidRef.current = null;
      await loadRole(user?.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

