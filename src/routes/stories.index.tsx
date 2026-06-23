import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/stories/")({
  head: () => ({ meta: [{ title: "Success Stories — TEP-TEPE Alumni Network" }] }),
  component: StoriesPage,
});

function StoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stories", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("id, slug, title, alumni_name, generation, company, summary, content, image_url")
        .eq("is_published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alumni voices</div>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Success stories</h1>
        </header>
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
        : !data || data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No stories published yet</div>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((s: any) => (
              <Link key={s.id} to="/stories/$id" params={{ id: s.slug || s.id }} preload="intent">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  {s.image_url ? <img src={s.image_url} alt="" className="h-44 w-full object-cover" /> : <div className="h-44 w-full bg-gradient-to-br from-primary/20 to-primary/5" />}
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wider text-primary">TEP #{s.generation} · {s.company}</div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.summary || s.content}</p>
                    <div className="mt-3 text-sm font-medium">— {s.alumni_name}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
