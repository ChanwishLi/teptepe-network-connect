import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TEP-TEPE Alumni Network" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <h1 className="font-display text-4xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage content, members, and approvals.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Members", "Events", "News", "Stories", "Internships", "Companies"].map((s) => (
            <Card key={s} className="p-6">
              <div className="font-display text-lg font-semibold">{s}</div>
              <p className="mt-1 text-sm text-muted-foreground">Management tools coming online.</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
