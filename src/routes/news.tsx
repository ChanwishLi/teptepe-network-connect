import { createFileRoute, Link } from "@tanstack/react-router";
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
        .select("id, slug, title, summary, image_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Updates</div>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">News</h1>
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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((n: any) => (
              <Link key={n.id} to="/news/$id" params={{ id: n.slug || n.id }} preload="intent">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  {n.image_url ? (
                    <img src={n.image_url} alt="" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {n.published_at && new Date(n.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{n.title}</h3>
                    {n.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{n.summary}</p>}
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
