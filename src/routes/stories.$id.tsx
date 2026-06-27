import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MediaImage } from "@/components/media-image";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/stories/$id")({
  component: StoryDetail,
});

function StoryDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: async () => {
      const query = supabase.from("success_stories").select("*").eq("is_published", true);
      const { data, error } = UUID_RE.test(id)
        ? await query.or(`slug.eq.${id},id.eq.${id}`).maybeSingle()
        : await query.eq("slug", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;
  if (!data) return <PageShell><div className="mx-auto max-w-3xl px-4 py-16">Story not found.</div></PageShell>;

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/stories"><ArrowLeft className="mr-1.5 h-4 w-4" /> All stories</Link></Button>
        {data.image_url && <MediaImage value={data.image_url} alt="" loading="eager" className="mb-8 aspect-[16/7] w-full rounded-lg object-cover" fallbackClassName="hidden" />}
        <div className="text-xs uppercase tracking-[0.2em] text-primary">TEP #{data.generation} · {data.company}</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{data.title}</h1>
        <div className="mt-3 text-sm font-medium text-muted-foreground">— {data.alumni_name}</div>
        {(data as any).external_url && (
          <div className="mt-6">
            <Button asChild>
              <a href={(data as any).external_url} target="_blank" rel="noreferrer">
                Read full story <ExternalLink className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
        {data.summary && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{data.summary}</p>}
        {data.content && (
          <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed">{data.content}</div>
        )}
      </article>
    </PageShell>
  );
}
