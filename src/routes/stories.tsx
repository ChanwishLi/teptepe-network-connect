import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Success Stories — TEP-TEPE Alumni Network" },
      { name: "description", content: "Career journeys and milestones from TEP-TEPE alumni." },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stories", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alumni voices</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Success stories</h1>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No stories published yet</div>
            <p className="text-sm text-muted-foreground">Alumni journeys will be featured here.</p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((s) => (
              <Card key={s.id} className="overflow-hidden">
                {s.image_url && <img src={s.image_url} alt={s.title} className="aspect-[4/3] w-full object-cover" />}
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  {s.alumni_name && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {s.alumni_name}{s.company ? ` · ${s.company}` : ""}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
