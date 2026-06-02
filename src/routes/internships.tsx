import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export const Route = createFileRoute("/internships")({
  head: () => ({
    meta: [
      { title: "Internships & Jobs — TEP-TEPE Alumni Network" },
      { name: "description", content: "Internship and job opportunities posted by alumni and partners." },
    ],
  }),
  component: InternshipsPage,
});

function InternshipsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["internships", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internship_posts")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Opportunities</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Internships & Jobs</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Opportunities shared by alumni and partner companies. All postings are reviewed before publishing.
          </p>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No openings right now</div>
            <p className="text-sm text-muted-foreground">New roles will be listed once approved.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl font-semibold">{p.position}</h3>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.employment_type}</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {[p.company_name, p.location].filter(Boolean).join(" · ")}
                </div>
                {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
