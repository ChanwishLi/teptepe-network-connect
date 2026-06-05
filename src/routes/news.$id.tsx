import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/news/$id")({
  component: NewsDetail,
});

function NewsDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const bySlug = await supabase.from("news_posts").select("*").eq("slug", id).eq("is_published", true).maybeSingle();
      if (bySlug.data) return bySlug.data;
      const byId = await supabase.from("news_posts").select("*").eq("id", id).eq("is_published", true).maybeSingle();
      return byId.data;
    },
  });

  if (isLoading) return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><div className="mx-auto max-w-3xl px-4 py-16">Post not found.</div></PageShell>;

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/news"><ArrowLeft className="mr-1.5 h-4 w-4" /> All news</Link></Button>
        {data.image_url && <img src={data.image_url} alt="" className="mb-8 aspect-[16/7] w-full rounded-lg object-cover" />}
        <div className="text-xs uppercase tracking-[0.2em] text-primary">News</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{data.title}</h1>
        {data.published_at && (
          <div className="mt-4 text-sm text-muted-foreground">
            {new Date(data.published_at).toLocaleDateString(undefined, { dateStyle: "full" })}
          </div>
        )}
        {data.summary && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{data.summary}</p>}
        {data.content && (
          <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed">
            {data.content}
          </div>
        )}
      </article>
    </PageShell>
  );
}
