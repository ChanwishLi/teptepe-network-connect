import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (s) => search.parse(s),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect on session: incomplete profiles must finish onboarding first.
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("profile_complete").eq("id", user.id).maybeSingle();
      if (!data?.profile_complete) navigate({ to: "/complete-profile", replace: true });
      else navigate({ to: redirect ?? "/directory", replace: true });
    })();
  }, [user, authLoading, navigate, redirect]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    // useEffect above handles routing once session is set
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your TEP-TEPE account.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </form>
          <div className="relative my-4 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <span className="absolute left-0 right-0 top-1/2 -z-0 border-t" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/login` });
              if (r.error) toast.error(r.error.message || "Google sign-in failed");
            }}
          >
            Continue with Google
          </Button>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <Link to="/reset-password" className="hover:underline">Forgot password?</Link>
            <Link to="/register" className="hover:underline">Create account</Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
