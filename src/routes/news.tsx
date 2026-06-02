import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — TEP-TEPE Alumni Network" },
      { name: "description", content: "Announcements and updates from the TEP-TEPE community." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updates</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">News</h1>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No news yet</div>
            <p className="text-sm text-muted-foreground">Announcements will appear here as they're published.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((n) => (
              <Card key={n.id} className="p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {n.published_at && new Date(n.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
                <h3 className="mt-2 font-display text-2xl font-semibold">{n.title}</h3>
                {n.summary && <p className="mt-2 text-sm text-muted-foreground">{n.summary}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
