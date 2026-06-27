import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { MediaImage } from "@/components/media-image";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — TEP-TEPE Alumni Network" },
      { name: "description", content: "Upcoming gatherings, talks and reunions for the TEP-TEPE community." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["events", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, name, description, event_date, event_time, location, banner_url")
        .eq("is_published", true)
        .eq("is_archived", false)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Community</div>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Events</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Reunions, talks, and gatherings hosted by the TEP-TEPE community around the world.
          </p>
        </header>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading events…</div>
        ) : !data || data.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div className="font-medium">No upcoming events yet</div>
            <p className="text-sm text-muted-foreground">Check back soon — new gatherings are posted regularly.</p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function EventCard({ event: e }: { event: any }) {
  return (
    <Link to="/events/$id" params={{ id: e.slug || e.id }} preload="intent">
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        <MediaImage value={e.banner_url} alt="" className="h-44 w-full object-cover" fallbackClassName="h-44 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="p-5">
          <div className="text-xs uppercase tracking-wider text-primary">
            {new Date(e.event_date).toLocaleDateString(undefined, { dateStyle: "medium" })}
            {e.event_time && ` · ${e.event_time}`}
          </div>
          <h3 className="mt-2 font-display text-xl font-semibold">{e.name}</h3>
          {e.location && <div className="mt-1 text-sm text-muted-foreground">{e.location}</div>}
          {e.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{e.description}</p>}
        </div>
      </Card>
    </Link>
  );
}
