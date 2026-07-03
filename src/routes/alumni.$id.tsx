import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Linkedin, Globe, Facebook, Instagram, MapPin } from "lucide-react";
import { generationStatus } from "@/lib/constants";
import { driveImageUrl } from "@/lib/drive";
import { findAlumni } from "@/lib/alumni";

export const Route = createFileRoute("/alumni/$id")({
  loader: ({ params }) => {
    const alumnus = findAlumni(params.id);
    if (!alumnus) throw notFound();
    return alumnus;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.first_name} ${loaderData.last_name} — TEP-TEPE Alumni` }]
      : [{ title: "Alumni — TEP-TEPE" }],
  }),
  notFoundComponent: () => <PageShell><div className="mx-auto max-w-3xl py-20 text-center">Alumni not found.</div></PageShell>,
  errorComponent: ({ error }) => <PageShell><div className="mx-auto max-w-3xl py-20 text-center">{error.message}</div></PageShell>,
  component: AlumniDetail,
});

function AlumniDetail() {
  const p = Route.useLoaderData();
  const avatar = driveImageUrl(p.photo);
  const cur = (p.jobs ?? []).find((j) => !j.end_year);

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
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                      {`${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="pb-2">
                  <h1 className="font-display text-3xl font-bold">{p.first_name} {p.last_name}</h1>
                  <div className="text-sm text-muted-foreground">{cur ? `${cur.position} · ${cur.company}` : p.program_type}</div>
                  {(p.address || p.country) && <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[p.address, p.country].filter(Boolean).join(", ")}</div>}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {p.generation && <Badge variant="outline" className="border-primary/30 text-primary">TEP #{p.generation}</Badge>}
                {p.generation && <Badge variant="secondary">{generationStatus(p.generation)}</Badge>}
                {p.available_as_mentor && <Badge className="bg-[var(--gold)]/30 text-foreground hover:bg-[var(--gold)]/40">Mentor</Badge>}
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {p.professional_summary && <Section title="About"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.professional_summary}</p></Section>}

                <Section title="Program at Thammasat">
                  <Row k="Program" v={p.program_type} />
                  <Row k="Major" v={p.major} />
                  <Row k="Admission" v={p.admission_year} />
                  <Row k="Graduation" v={p.graduation_year} />
                  <Row k="Honors" v={p.honors} />
                  <Row k="Partner university" v={p.partner_university} />
                  <Row k="Partner degree" v={p.partner_major} />
                </Section>

                {(p.masters_partner_university || p.additional_masters) && (
                  <Section title="Master's">
                    <Row k="Institution" v={p.masters_partner_university} />
                    <Row k="Degree" v={p.masters_partner_degree} />
                    <Row k="Graduation" v={p.masters_graduation_year} />
                    <Row k="Honors" v={p.masters_honors} />
                    {p.additional_masters && <p className="text-sm text-muted-foreground">{p.additional_masters}</p>}
                  </Section>
                )}
                {(p.additional_bachelors || p.additional_phd) && (
                  <Section title="Additional education">
                    {p.additional_bachelors && <p className="text-sm text-muted-foreground">Bachelor's: {p.additional_bachelors}</p>}
                    {p.additional_phd && <p className="text-sm text-muted-foreground">PhD: {p.additional_phd}</p>}
                  </Section>
                )}

                {(p.jobs?.length ?? 0) > 0 && (
                  <Section title="Employment">
                    {p.jobs!.map((e, i) => (
                      <div key={i} className="border-l-2 border-primary/30 py-1 pl-4">
                        <div className="font-medium">{e.position} {!e.end_year && <span className="ml-2 text-xs text-primary">Current</span>}</div>
                        <div className="text-xs text-muted-foreground">{[e.company, e.city, e.country, `${e.start_year ?? ""}${e.end_year ? `–${e.end_year}` : (e.start_year ? "–present" : "")}`].filter(Boolean).join(" · ")}</div>
                      </div>
                    ))}
                  </Section>
                )}

                {((p.skills?.length ?? 0) + (p.expertise?.length ?? 0)) > 0 && (
                  <Section title="Skills & expertise">
                    <div className="flex flex-wrap gap-2">
                      {p.skills?.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      {p.expertise?.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </Section>
                )}

                {p.research_interests && <Section title="Research interests"><p className="text-sm text-muted-foreground">{p.research_interests}</p></Section>}
                {p.certifications && <Section title="Certifications"><p className="text-sm text-muted-foreground">{p.certifications}</p></Section>}
              </div>

              <div className="space-y-4">
                <Card className="p-5">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Contact</h3>
                  <div className="mt-3 space-y-2">
                    {p.email && <ContactLink href={`mailto:${p.email}`} icon={Mail}>{p.email}</ContactLink>}
                    {p.phone && <ContactLink href={`tel:${p.phone}`} icon={Phone}>{p.phone}</ContactLink>}
                    {p.linkedin && <ContactLink href={p.linkedin} icon={Linkedin}>LinkedIn</ContactLink>}
                    {p.website && <ContactLink href={p.website} icon={Globe}>Website</ContactLink>}
                    {p.facebook && <ContactLink href={p.facebook} icon={Facebook}>Facebook</ContactLink>}
                    {p.instagram && <ContactLink href={p.instagram} icon={Instagram}>Instagram</ContactLink>}
                    {!p.email && !p.phone && !p.linkedin && !p.website && !p.facebook && !p.instagram && (
                      <p className="text-xs text-muted-foreground">No contact details shared.</p>
                    )}
                  </div>
                </Card>
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
function Row({ k, v }: { k: string; v: string | number | null | undefined }) {
  return v ? <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div> : null;
}
function ContactLink({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary"><Icon className="h-4 w-4" />{children}</a>;
}
