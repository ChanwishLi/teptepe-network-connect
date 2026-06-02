import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
  };

  const onUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You can now sign in.");
    window.location.href = "/login";
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="p-8">
          <h1 className="font-display text-3xl font-bold">{mode === "request" ? "Reset password" : "Set new password"}</h1>
          {mode === "request" ? (
            <form onSubmit={onRequest} className="mt-6 space-y-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
            </form>
          ) : (
            <form onSubmit={onUpdate} className="mt-6 space-y-4">
              <div><Label htmlFor="np">New password</Label><Input id="np" type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
            </form>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
