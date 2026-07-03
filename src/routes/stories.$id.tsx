import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { findStory } from "@/lib/alumni";

export const Route = createFileRoute("/stories/$id")({
  loader: ({ params }) => {
    const s = findStory(params.id);
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: `${loaderData.title} — TEP-TEPE Stories` }] : [{ title: "Story — TEP-TEPE" }] }),
  notFoundComponent: () => <PageShell><div className="mx-auto max-w-3xl px-4 py-16">Story not found.</div></PageShell>,
  errorComponent: ({ error }) => <PageShell><div className="mx-auto max-w-3xl px-4 py-16">{error.message}</div></PageShell>,
  component: StoryDetail,
});

function StoryDetail() {
  const data = Route.useLoaderData();
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/stories"><ArrowLeft className="mr-1.5 h-4 w-4" /> All stories</Link></Button>
        {data.image_url && <MediaImage value={data.image_url} alt="" loading="eager" className="mb-8 aspect-[16/7] w-full rounded-lg object-cover" fallbackClassName="hidden" />}
        <div className="text-xs uppercase tracking-[0.2em] text-primary">{data.generation ? `TEP #${data.generation}` : ""}{data.company ? ` · ${data.company}` : ""}</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{data.title}</h1>
        <div className="mt-3 text-sm font-medium text-muted-foreground">— {data.alumni_name}</div>
        {data.external_url && (
          <div className="mt-6">
            <Button asChild>
              <a href={data.external_url} target="_blank" rel="noreferrer">Read full story <ExternalLink className="ml-1.5 h-4 w-4" /></a>
            </Button>
          </div>
        )}
        {data.summary && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{data.summary}</p>}
        {data.content && <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed">{data.content}</div>}
      </article>
    </PageShell>
  );
}
