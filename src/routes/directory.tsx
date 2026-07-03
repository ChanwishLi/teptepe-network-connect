import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { PROGRAM_TYPES, MAJORS, GENERATIONS, generationStatus } from "@/lib/constants";
import { visibleAlumni, type Alumni } from "@/lib/alumni";
import { driveImageUrl } from "@/lib/drive";

export const Route = createFileRoute("/directory")({
  head: () => ({ meta: [{ title: "Alumni Directory — TEP-TEPE" }, { name: "description", content: "Search and connect with TEP-TEPE alumni around the world." }] }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const all = useMemo(() => visibleAlumni(), []);
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState<string>("all");
  const [program, setProgram] = useState<string>("all");
  const [major, setMajor] = useState<string>("all");
  const [country, setCountry] = useState("");
  const [mentor, setMentor] = useState<string>("all");

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const cc = country.trim().toLowerCase();
    return all.filter((a) => {
      if (generation !== "all" && String(a.generation ?? "") !== generation) return false;
      if (program !== "all" && a.program_type !== program) return false;
      if (major !== "all" && a.major !== major) return false;
      if (cc && !(a.country ?? "").toLowerCase().includes(cc)) return false;
      if (mentor === "yes" && !a.available_as_mentor) return false;
      if (qq) {
        const hay = `${a.first_name} ${a.last_name} ${a.preferred_name ?? ""} ${a.major ?? ""} ${(a.skills ?? []).join(" ")} ${(a.expertise ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [all, q, generation, program, major, country, mentor]);

  const clearFilters = () => { setQ(""); setGeneration("all"); setProgram("all"); setMajor("all"); setCountry(""); setMentor("all"); };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div>
          <h1 className="font-display text-4xl font-bold lg:text-5xl">Alumni Directory</h1>
          <p className="mt-2 text-muted-foreground">Browse fellow TEP-TEPE alumni around the world.</p>
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
            <div className="text-xs text-muted-foreground">{results.length} results</div>
            <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3.5 w-3.5" /> Clear</Button>
          </div>
        </Card>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => <AlumniCard key={p.id} p={p} />)}
          {results.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">No alumni match your filters.</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function AlumniCard({ p }: { p: Alumni }) {
  const avatar = driveImageUrl(p.photo);
  return (
    <Link to="/alumni/$id" params={{ id: p.id }}>
      <Card className="group h-full overflow-hidden p-5 transition-all hover:border-primary/50 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {`${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()}
              </div>
            )}
          </div>
          {p.generation && <Badge variant="outline" className="border-primary/30 text-primary">TEP #{p.generation}</Badge>}
        </div>
        <div className="mt-4">
          <div className="font-display text-lg font-semibold">{p.first_name} {p.last_name}</div>
          <div className="text-xs text-muted-foreground">{[p.program_type, p.major].filter(Boolean).join(" · ")}</div>
          <div className="mt-1 text-xs text-muted-foreground">{[p.address, p.country].filter(Boolean).join(", ")}</div>
        </div>
        {p.available_as_mentor && (
          <Badge className="mt-3 bg-[var(--gold)]/20 text-foreground hover:bg-[var(--gold)]/30">Mentor</Badge>
        )}
      </Card>
    </Link>
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
