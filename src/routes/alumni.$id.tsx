import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, Globe, Facebook, Instagram, MapPin } from "lucide-react";
import { generationStatus } from "@/lib/constants";

export const Route = createFileRoute("/alumni/$id")({
  component: AlumniDetail,
  notFoundComponent: () => <PageShell><div className="mx-auto max-w-3xl py-20 text-center">Alumni not found.</div></PageShell>,
});

function AlumniDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["alumni", id],
    queryFn: async () => {
      const [profile, edu, emp, mentor] = await Promise.all([
        supabase.from("profiles_public" as any).select("*").eq("id", id).maybeSingle(),
        supabase.from("education_records").select("*").eq("user_id", id).order("graduation_year", { ascending: false }),
        supabase.from("employment_records").select("*").eq("user_id", id).order("start_year", { ascending: false }),
        supabase.from("mentorship_settings").select("*").eq("user_id", id).maybeSingle(),
      ]);
      return { profile: profile.data as any, edu: edu.data ?? [], emp: emp.data ?? [], mentor: mentor.data };
    },
  });

  if (isLoading) return <PageShell><div className="py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  const p = data?.profile;
  if (!p) return <PageShell><div className="py-20 text-center">Not found.</div></PageShell>;

  const cur = data!.emp.find((e: any) => e.is_current);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <Link to="/directory" className="text-sm text-muted-foreground hover:text-primary">← Back to directory</Link>
        <Card className="mt-4 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />
          <div className="px-6 pb-8 pt-0 lg:px-10">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="pb-2">
                  <h1 className="font-display text-3xl font-bold">{p.first_name} {p.last_name}</h1>
                  <div className="text-sm text-muted-foreground">{cur ? `${cur.position} · ${cur.company}` : p.program_type}</div>
                  {p.city || p.country ? <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[p.city, p.country].filter(Boolean).join(", ")}</div> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">TEP #{p.generation}</Badge>
                <Badge variant="secondary">{generationStatus(p.generation)}</Badge>
                {data?.mentor?.available_as_mentor && <Badge className="bg-[var(--gold)]/30 text-foreground hover:bg-[var(--gold)]/40">Mentor</Badge>}
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {p.professional_summary && <Section title="About"><p className="text-sm text-muted-foreground">{p.professional_summary}</p></Section>}

                <Section title="Program">
                  <Row k="Program" v={p.program_type} />
                  <Row k="Major" v={p.major} />
                  <Row k="Admission" v={p.admission_year} /><Row k="Graduation" v={p.graduation_year} />
                  {p.partner_university && <Row k="Partner university" v={p.partner_university} />}
                </Section>

                <Section title="Education">
                  {data!.edu.length === 0 ? <Empty /> : data!.edu.map((e: any) => (
                    <div key={e.id} className="border-l-2 border-primary/30 pl-4 py-1">
                      <div className="font-medium">{e.level === "phd" ? "PhD" : e.level.charAt(0).toUpperCase() + e.level.slice(1)} · {e.institution}</div>
                      <div className="text-xs text-muted-foreground">{[e.major, e.country, e.graduation_year].filter(Boolean).join(" · ")}</div>
                    </div>
                  ))}
                </Section>

                <Section title="Employment">
                  {data!.emp.length === 0 ? <Empty /> : data!.emp.map((e: any) => (
                    <div key={e.id} className="border-l-2 border-primary/30 pl-4 py-1">
                      <div className="font-medium">{e.position} {e.is_current && <span className="ml-2 text-xs text-primary">Current</span>}</div>
                      <div className="text-xs text-muted-foreground">{[e.company, e.city, e.country, `${e.start_year}${e.end_year ? `–${e.end_year}` : "–present"}`].filter(Boolean).join(" · ")}</div>
                    </div>
                  ))}
                </Section>

                {(p.skills?.length || p.expertise?.length) > 0 && (
                  <Section title="Skills & expertise">
                    <div className="flex flex-wrap gap-2">
                      {p.skills?.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      {p.expertise?.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </Section>
                )}
              </div>

              <div className="space-y-4">
                <Card className="p-5">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Connect</h3>
                  <div className="mt-3 space-y-2">
                    {p.show_email && p.email && <ContactLink href={`mailto:${p.email}`} icon={Mail}>{p.email}</ContactLink>}
                    {p.show_linkedin && p.linkedin_url && <ContactLink href={p.linkedin_url} icon={Linkedin}>LinkedIn</ContactLink>}
                    {p.show_website && p.personal_website && <ContactLink href={p.personal_website} icon={Globe}>Website</ContactLink>}
                    {p.show_facebook && p.facebook_url && <ContactLink href={p.facebook_url} icon={Facebook}>Facebook</ContactLink>}
                    {p.show_instagram && p.instagram_url && <ContactLink href={p.instagram_url} icon={Instagram}>Instagram</ContactLink>}
                  </div>
                </Card>

                {data?.mentor?.available_as_mentor && (
                  <Card className="p-5">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Mentorship</h3>
                    <p className="mt-2 text-sm">Available as mentor · {data.mentor.hours_per_month ?? "—"} hrs/month</p>
                    {data.mentor.mentorship_areas?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {data.mentor.mentorship_areas.map((a: string) => <Badge key={a} variant="outline">{a}</Badge>)}
                      </div>
                    )}
                    {data.mentor.preferred_contact_method && <p className="mt-3 text-xs text-muted-foreground">Preferred: {data.mentor.preferred_contact_method}</p>}
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><h3 className="text-xs uppercase tracking-wider text-muted-foreground">{title}</h3><div className="mt-3 space-y-2">{children}</div></div>);
}
function Row({ k, v }: { k: string; v: any }) { return v ? <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div> : null; }
function Empty() { return <p className="text-xs text-muted-foreground">No records yet.</p>; }
function ContactLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary"><Icon className="h-4 w-4" />{children}</a>;
}
