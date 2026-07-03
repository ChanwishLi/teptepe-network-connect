import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, Globe, Building2, Calendar } from "lucide-react";
import { visibleAlumni, visibleEvents, visibleStories } from "@/lib/alumni";
import { driveImageUrl } from "@/lib/drive";
import { MediaImage } from "@/components/media-image";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TEP-TEPE Alumni Network — Bridging Thai and international engineers" },
      { name: "description", content: "The official alumni network of Thammasat's International Engineering Program. Browse alumni, events, and stories from around the world." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const all = visibleAlumni();
  const countries = new Set(all.map((a) => a.country?.trim().toLowerCase()).filter(Boolean)).size;
  const companies = new Set(
    all.flatMap((a) => (a.jobs ?? []).map((j) => j.company?.trim().toLowerCase()).filter(Boolean))
  ).size;
  const generations = 31 + Math.max(0, new Date().getFullYear() - 2026);
  const featured = all.filter((a) => a.featured).slice(0, 8);
  const upcomingEvents = visibleEvents()
    .filter((e) => e.event_date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 3);
  const latestStories = visibleStories().slice(0, 3);

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10">
          <img
            src="/__l5e/assets-v1/d03526fd-dacc-4895-afd3-68dcdc583672/tse-building.jpeg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--background)_92%,transparent)_0%,color-mix(in_oklch,var(--background)_70%,transparent)_55%,color-mix(in_oklch,var(--background)_30%,transparent)_100%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-28 lg:px-8 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> 30 years of engineering
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              TEP-TEPE<br />Alumni Network
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-foreground/80 sm:text-xl">
              To bridge the gap between Thai and international engineers. Discover graduates, find mentors, and stay close to the community that shaped you.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/directory">Explore alumni <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/events">Upcoming events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users, label: "Alumni", value: all.length },
            { icon: Calendar, label: "Generations", value: generations },
            { icon: Globe, label: "Countries", value: countries },
            { icon: Building2, label: "Companies", value: companies },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{value.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
            <SectionHeader title="Featured Alumni" subtitle="Recognising achievements and leaders of our community" linkTo="/directory" linkLabel="View directory" />
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => {
                const url = driveImageUrl(p.photo);
                const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
                return (
                  <Link key={p.id} to="/alumni/$id" params={{ id: p.id }} preload="intent" className="group block">
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-muted-foreground">{initials}</div>
                      )}
                    </div>
                    {p.featured_caption && <div className="mt-4 text-sm font-medium leading-snug text-foreground">{p.featured_caption}</div>}
                    <div className={`${p.featured_caption ? "mt-2" : "mt-4"} font-display text-base font-semibold leading-tight`}>{p.first_name} {p.last_name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.program_type}{p.generation ? ` #${p.generation}` : ""}{p.major ? ` · ${p.major}` : ""}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {latestStories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader title="Success stories" subtitle="Voices from our alumni" linkTo="/stories" linkLabel="All stories" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {latestStories.map((s) => (
              <Link key={s.id} to="/stories/$id" params={{ id: s.slug || s.id }} preload="intent">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <MediaImage value={s.image_url} alt="" className="h-44 w-full object-cover" fallbackClassName="h-44 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wider text-primary">{s.generation ? `TEP #${s.generation}` : ""}{s.company ? ` · ${s.company}` : ""}</div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.summary || s.content}</p>
                    <div className="mt-3 text-sm font-medium">— {s.alumni_name}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader title="Upcoming events" subtitle="Reconnect in person and online" linkTo="/events" linkLabel="All events" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <Link key={e.id} to="/events/$id" params={{ id: e.slug || e.id }} preload="intent">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <MediaImage value={e.banner_url} alt="" className="h-40 w-full object-cover" fallbackClassName="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="p-5">
                    <div className="text-xs uppercase tracking-wider text-primary">{new Date(e.event_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</div>
                    <h3 className="mt-2 font-display text-lg font-semibold">{e.name}</h3>
                    {e.location && <p className="mt-1 text-xs text-muted-foreground">{e.location}</p>}
                    {e.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function SectionHeader({ title, subtitle, linkTo, linkLabel }: { title: string; subtitle: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-semibold lg:text-4xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link to={linkTo} className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex sm:items-center">
        {linkLabel} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}
