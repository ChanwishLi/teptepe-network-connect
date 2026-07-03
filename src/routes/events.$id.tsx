import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import { findEvent } from "@/lib/alumni";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => {
    const e = findEvent(params.id);
    if (!e) throw notFound();
    return e;
  },
  head: ({ loaderData }) => ({ meta: loaderData ? [{ title: `${loaderData.name} — TEP-TEPE Events` }] : [{ title: "Event — TEP-TEPE" }] }),
  notFoundComponent: () => <PageShell><div className="mx-auto max-w-3xl px-4 py-16">Event not found.</div></PageShell>,
  errorComponent: ({ error }) => <PageShell><div className="mx-auto max-w-3xl px-4 py-16">{error.message}</div></PageShell>,
  component: EventDetail,
});

function EventDetail() {
  const data = Route.useLoaderData();
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/events"><ArrowLeft className="mr-1.5 h-4 w-4" /> All events</Link></Button>
        {data.banner_url && <MediaImage value={data.banner_url} alt="" loading="eager" className="mb-8 aspect-[16/7] w-full rounded-lg object-cover" fallbackClassName="hidden" />}
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Event</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{data.name}</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />
            {new Date(data.event_date).toLocaleDateString(undefined, { dateStyle: "full" })}
            {data.event_time && ` · ${data.event_time}`}
          </span>
          {data.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {data.location}</span>}
        </div>
        {data.external_url && (
          <div className="mt-6">
            <Button asChild>
              <a href={data.external_url} target="_blank" rel="noreferrer">
                Visit event page <ExternalLink className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
        {data.description && <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{data.description}</p>}
        {data.content && (
          <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-base leading-relaxed">{data.content}</div>
        )}
      </article>
    </PageShell>
  );
}
