import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — TEP-TEPE Alumni Network" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function unlock() {
  try { localStorage.setItem("tep-gate", "1"); } catch {}
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // UI-only: no real auth. Accept any credentials.
    setTimeout(() => {
      unlock();
      toast.success("Welcome back");
      navigate({ to: redirect ?? "/directory", replace: true });
    }, 400);
  };

  const onGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      unlock();
      navigate({ to: redirect ?? "/directory", replace: true });
    }, 500);
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="relative my-4 text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or</span>
            <span className="absolute left-0 right-0 top-1/2 -z-0 border-t" />
          </div>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onGoogle} disabled={loading}>
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <Link to="/login" className="hover:underline">Forgot password?</Link>
            <Link to="/register" className="hover:underline">Create account</Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.79 3.15 14.63 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 12s4.1 9.8 9.2 9.8c5.31 0 8.82-3.73 8.82-8.98 0-.6-.06-1.06-.14-1.62H12z" />
      <path fill="#4285F4" d="M21.68 12.82c0-.6-.06-1.06-.14-1.62H12v3.9h5.5c-.11.64-.72 1.94-2.07 2.81l3.33 2.58c1.94-1.79 2.92-4.44 2.92-7.67z" />
      <path fill="#FBBC05" d="M5.62 14.29A6.19 6.19 0 0 1 5.3 12c0-.8.14-1.57.38-2.29L2.3 7.09A9.79 9.79 0 0 0 1.2 12c0 1.58.38 3.08 1.1 4.41l3.32-2.12z" />
      <path fill="#34A853" d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.33-2.58c-.89.62-2.08 1.05-3.12 1.05-2.4 0-4.44-1.62-5.17-3.8L3.5 16.23A9.8 9.8 0 0 0 12 21.8z" />
    </svg>
  );
}
