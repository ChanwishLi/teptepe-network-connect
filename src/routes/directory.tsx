import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { PROGRAM_TYPES, MAJORS, GENERATIONS, generationStatus } from "@/lib/constants";
import { useAvatarUrl } from "@/lib/avatar";

export const Route = createFileRoute("/directory")({
  head: () => ({ meta: [{ title: "Alumni Directory — TEP-TEPE" }, { name: "description", content: "Search and connect with TEP-TEPE alumni around the world." }] }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [major, setMajor] = useState<string>("all");
  const [country, setCountry] = useState("");
  const [mentor, setMentor] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["directory", { q, generation, program, major, country, mentor }],
    queryFn: async () => {
      let query = supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name, generation, program_type, major, country, city, avatar_url, skills, available_as_mentor")
        .order("generation", { ascending: false })
        .limit(60);
      if (generation !== "all") query = query.eq("generation", parseInt(generation));
      if (program !== "all") query = query.eq("program_type", program as any);
      if (major !== "all") query = query.eq("major", major as any);
      if (country) query = query.ilike("country", `%${country}%`);
      if (q) {
        const like = `%${q}%`;
        query = query.or(`first_name.ilike.${like},last_name.ilike.${like},major.ilike.${like}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      let rows = (data ?? []) as any[];
      if (mentor === "yes") rows = rows.filter((r) => r.available_as_mentor);
      return rows;
    },
  });

  const clearFilters = () => { setQ(""); setGeneration("all"); setProgram("all"); setMajor("all"); setCountry(""); setMentor("all"); };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold lg:text-5xl">Alumni Directory</h1>
            <p className="mt-2 text-muted-foreground">Connect with fellow TEP-TEPE alumni around the world.</p>
          </div>
        </div>

        <Card className="mt-8 p-4 lg:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, major, skills…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Generation" value={generation} onChange={setGeneration} options={[{ v: "all", l: "All" }, ...GENERATIONS.map((g) => ({ v: String(g), l: `#${g} (${generationStatus(g)})` }))]} />
            <FilterSelect label="Program" value={program} onChange={setProgram} options={[{ v: "all", l: "All" }, ...PROGRAM_TYPES.map((p) => ({ v: p, l: p }))]} />
            <FilterSelect label="Major" value={major} onChange={setMajor} options={[{ v: "all", l: "All" }, ...MAJORS.map((m) => ({ v: m, l: m }))]} />
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Country</Label>
              <Input placeholder="Any country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <FilterSelect label="Mentor" value={mentor} onChange={setMentor} options={[{ v: "all", l: "All" }, { v: "yes", l: "Available as mentor" }]} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{isLoading ? "Searching…" : `${data?.length ?? 0} results`}</div>
            <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3.5 w-3.5" /> Clear</Button>
          </div>
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data ?? []).map((p: any) => (
            <Link key={p.id} to="/alumni/$id" params={{ id: p.id }}>
              <Card className="group h-full overflow-hidden p-5 transition-all hover:border-primary/50 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">TEP #{p.generation}</Badge>
                </div>
                <div className="mt-4">
                  <div className="font-display text-lg font-semibold">{p.first_name} {p.last_name}</div>
                  <div className="text-xs text-muted-foreground">{p.program_type} · {p.major}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{[p.city, p.country].filter(Boolean).join(", ")}</div>
                </div>
                {p.mentorship_settings?.available_as_mentor && (
                  <Badge className="mt-3 bg-[var(--gold)]/20 text-foreground hover:bg-[var(--gold)]/30">Mentor</Badge>
                )}
              </Card>
            </Link>
          ))}
          {!isLoading && data?.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No alumni match your filters.</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">{options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
