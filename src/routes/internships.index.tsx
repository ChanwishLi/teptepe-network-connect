import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus } from "lucide-react";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/internships/")({
  head: () => ({
    meta: [
      { title: "Internships & Jobs — TEP-TEPE Alumni Network" },
      { name: "description", content: "Internship and job opportunities posted by alumni and partners." },
    ],
  }),
  component: InternshipsPage,
});

function InternshipsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["internships", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_posts_public" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string; position: string; company_name: string; employment_type: string;
        description: string; location: string | null; application_link: string | null; deadline: string | null;
      }>;
    },
  });

  const { data: mine } = useQuery({
    enabled: !!user,
    queryKey: ["internships", "mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_posts")
        .select("id, position, company_name, status, created_at, rejection_reason")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Opportunities</div>
            <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Internships & Jobs</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Opportunities shared by alumni and partner companies. All postings are reviewed before publishing.
            </p>
          </div>
          {user && (
            <Button asChild>
              <Link to="/opportunities/new"><Plus className="mr-1.5 h-4 w-4" /> Post an opportunity</Link>
            </Button>
          )}
        </header>

        {user && mine && mine.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold">My submissions</h2>
            <div className="mt-3 space-y-2">
              {mine.map((m) => (
                <Card key={m.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{m.position} <span className="text-muted-foreground">· {m.company_name}</span></div>
                    {m.status === "rejected" && m.rejection_reason && (
                      <div className="mt-1 text-xs text-destructive">Reason: {m.rejection_reason}</div>
                    )}
                  </div>
                  <StatusBadge status={m.status} />
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold">Open positions</h2>
          {isLoading ? (
            <div className="mt-3 text-sm text-muted-foreground">Loading…</div>
          ) : !data || data.length === 0 ? (
            <Card className="mt-3 flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">No openings right now</div>
              <p className="text-sm text-muted-foreground">New roles will be listed once approved.</p>
            </Card>
          ) : (
            <div className="mt-3 space-y-3">
              {data.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold">{p.position}</h3>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {EMPLOYMENT_TYPE_LABELS[p.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] ?? p.employment_type}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {[p.company_name, p.location].filter(Boolean).join(" · ")}
                  </div>
                  {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>}
                  <div className="mt-4 flex items-center justify-between">
                    {p.deadline && <div className="text-xs text-muted-foreground">Apply by {new Date(p.deadline).toLocaleDateString()}</div>}
                    {p.application_link && (
                      <Button asChild size="sm" variant="outline">
                        <a href={p.application_link} target="_blank" rel="noreferrer">Apply</a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : status === "rejected" ? "bg-destructive/15 text-destructive"
    : "bg-muted text-foreground";
  return <Badge className={tone + " border-transparent"}>{status}</Badge>;
}
