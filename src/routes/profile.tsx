import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — TEP-TEPE Alumni Network" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="font-display text-4xl font-bold">My profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as {user.email}</p>
        <Card className="mt-8 p-6 text-sm text-muted-foreground">
          Profile editing is being rolled out. Your account is active and your data is safe.
        </Card>
      </section>
    </PageShell>
  );
}
