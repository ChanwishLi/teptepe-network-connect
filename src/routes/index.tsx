import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, GraduationCap, Globe, Building2, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TEP-TEPE Alumni Network — Bridging Thai and international engineers" },
      { name: "description", content: "Connect with fellow TEP-TEPE alumni around the world. Mentorship, events, internships, and the stories shaping our community." },
    ],
  }),
  component: Landing,
});

function useStats() {
  return useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const pub = supabase.from("profiles_public" as any);
      const [alumni, students, generations, countries] = await Promise.all([
        pub.select("id", { count: "exact", head: true }).lte("generation", 27),
        pub.select("id", { count: "exact", head: true }).gte("generation", 28),
        pub.select("generation").not("generation", "is", null),
        pub.select("country").not("country", "is", null),
      ]);
      const companies = { data: [] as Array<{ company: string | null }> };
      const genSet = new Set(((generations.data ?? []) as Array<{ generation: number | null }>).map((r) => r.generation));
      const countrySet = new Set(((countries.data ?? []) as Array<{ country: string | null }>).map((r) => r.country?.trim().toLowerCase()).filter(Boolean));
      const companySet = new Set((companies.data ?? []).map((r) => r.company?.trim().toLowerCase()).filter(Boolean));
      return {
        alumni: alumni.count ?? 0,
        students: students.count ?? 0,
        generations: genSet.size,
        countries: countrySet.size,
        companies: companySet.size,
      };
    },
  });
}

function useFeatured() {
  return useQuery({
    queryKey: ["landing-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name, generation, program_type, avatar_url, city, country")
        .eq("is_featured", true).limit(6);
      return (data ?? []) as Array<{ id: string; first_name: string; last_name: string; generation: number | null; program_type: string | null; avatar_url: string | null; city: string | null; country: string | null }>;
    },
  });
}

function useStories() {
  return useQuery({
    queryKey: ["landing-stories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("success_stories").select("id, title, alumni_name, generation, company, content, image_url")
        .eq("is_published", true).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });
}

function useEvents() {
  return useQuery({
    queryKey: ["landing-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events").select("id, name, description, event_date, location, banner_url")
        .eq("is_published", true).eq("is_archived", false)
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date").limit(3);
      return data ?? [];
    },
  });
}

function usePartners() {
  return useQuery({
    queryKey: ["landing-partners"],
    queryFn: async () => {
      const { data } = await supabase.from("industry_partners").select("*").order("display_order");
      return data ?? [];
    },
  });
}

function Landing() {
  const stats = useStats();
  const featured = useFeatured();
  const stories = useStories();
  const events = useEvents();
  const partners = usePartners();

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-background" />
        <div className="absolute -top-32 -right-40 -z-10 h-[40rem] w-[40rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /> 30 years of engineering
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              TEP-TEPE<br />Alumni Network
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              To bridge the gap between Thai and international engineers. Discover graduates, find mentors, share opportunities, and stay close to the community that shaped you.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">Join the network <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/directory">Explore alumni</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Users, label: "Alumni", value: stats.data?.alumni ?? 0 },
            { icon: GraduationCap, label: "Current students", value: stats.data?.students ?? 0 },
            { icon: Calendar, label: "Generations", value: stats.data?.generations ?? 0 },
            { icon: Globe, label: "Countries", value: stats.data?.countries ?? 0 },
            { icon: Building2, label: "Companies", value: stats.data?.companies ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value.toLocaleString()}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured alumni */}
      {(featured.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader title="Featured alumni" subtitle="Celebrating members of our community" linkTo="/directory" linkLabel="View directory" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data!.map((p) => (
              <Link key={p.id} to="/alumni/$id" params={{ id: p.id }}>
                <Card className="flex items-center gap-4 p-5 transition-colors hover:border-primary/40">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.first_name} {p.last_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.program_type} · TEP #{p.generation}</div>
                    <div className="truncate text-xs text-muted-foreground">{[p.city, p.country].filter(Boolean).join(", ")}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stories */}
      {(stories.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader title="Success stories" subtitle="Voices from our alumni" linkTo="/stories" linkLabel="All stories" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {stories.data!.map((s) => (
              <Card key={s.id} className="overflow-hidden">
                {s.image_url && <img src={s.image_url} alt="" className="h-44 w-full object-cover" />}
                <div className="p-5">
                  <div className="text-xs uppercase tracking-wider text-primary">TEP #{s.generation} · {s.company}</div>
                  <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.content}</p>
                  <div className="mt-3 text-sm font-medium">— {s.alumni_name}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Events */}
      {(events.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <SectionHeader title="Upcoming events" subtitle="Reconnect in person and online" linkTo="/events" linkLabel="All events" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.data!.map((e) => (
              <Card key={e.id} className="overflow-hidden">
                {e.banner_url && <img src={e.banner_url} alt="" className="h-40 w-full object-cover" />}
                <div className="p-5">
                  <div className="text-xs uppercase tracking-wider text-primary">{new Date(e.event_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold">{e.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{e.location}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Partners */}
      {(partners.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <h2 className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">Industry partners</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80">
            {partners.data!.map((p) => (
              <a key={p.id} href={p.website ?? "#"} target="_blank" rel="noreferrer" className="text-sm font-semibold tracking-wide text-muted-foreground hover:text-foreground">
                {p.logo_url ? <img src={p.logo_url} alt={p.name} className="h-8 w-auto" /> : p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-12 max-w-7xl px-4 lg:px-8">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground lg:p-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold lg:text-5xl">Stay connected. Stronger together.</h2>
            <p className="mt-4 text-base opacity-90">Update your profile, find a mentor, post an internship, and help the next generation of TEP-TEPE engineers find their footing.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="lg"><Link to="/register">Create your profile</Link></Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link to="/directory">Browse alumni</Link></Button>
            </div>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function SectionHeader({ title, subtitle, linkTo, linkLabel }: { title: string; subtitle: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-bold lg:text-4xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link to={linkTo} className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex sm:items-center">
        {linkLabel} <ArrowRight className="ml-1 h-4 w-4" />
      </Link>
    </div>
  );
}
