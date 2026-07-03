import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import Papa from "papaparse";
import { toast } from "sonner";
import { adminLogin, adminLogout, adminStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Upload, Download, Trash2, Eye, EyeOff, Plus, Star } from "lucide-react";
import alumniData from "@/data/alumni.json";
import eventsData from "@/data/events.json";
import storiesData from "@/data/stories.json";
import type { Alumni, EventItem, Story, Job } from "@/lib/alumni";
import { driveImageUrl } from "@/lib/drive";

export const Route = createFileRoute("/admin-tep2026")({
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

function AdminPage() {
  const status = useServerFn(adminStatus);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  useEffect(() => { status().then((r) => setUnlocked(r.unlocked)).catch(() => setUnlocked(false)); }, [status]);

  if (unlocked === null) return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading…</div>;
  if (!unlocked) return <LoginForm onSuccess={() => setUnlocked(true)} />;
  return <AdminDashboard onLogout={() => setUnlocked(false)} />;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await login({ data: { password } });
      if (r.ok) { toast.success("Signed in"); onSuccess(); }
      else toast.error("Incorrect password");
    } finally { setBusy(false); setPassword(""); }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to continue.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Checking…" : "Enter"}</Button>
        </form>
      </Card>
    </div>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function commaList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseCsvRow(r: Record<string, string>): Alumni {
  const jobs: Job[] = [];
  for (const n of ["first", "second", "third"]) {
    const company = r[`Company of ${n} job`];
    const position = r[`Position of ${n} job`];
    if (company || position) {
      jobs.push({
        company: company ?? "",
        position: position ?? "",
        business_type: r[`Business type of ${n} job`] || undefined,
        industry: r[`Industry of ${n} job`] || undefined,
        city: r[`City of ${n} job`] || undefined,
        country: r[`Country of ${n} job`] || undefined,
        start_year: r[`Start year of ${n} job`] || undefined,
        end_year: r[`End year of ${n} job`] || undefined,
      });
    }
  }
  const gen = parseInt(r["Generation"]?.replace(/\D/g, "") ?? "", 10);
  // CSV has repeated column names — Papa suffixes duplicates with _1, _2 etc.
  return {
    id: makeId("a"),
    first_name: r["First Name"] ?? "",
    last_name: r["Last Name"] ?? "",
    preferred_name: r["Preferred Name"] || undefined,
    gender: r["Gender"] || undefined,
    date_of_birth: r["Date of Birth"] || undefined,
    nationality: r["Nationality"] || undefined,
    photo: r["Add a photo of yourself"] || undefined,
    email: r["Email"] || undefined,
    phone: r["Phone"] || undefined,
    address: r["Address"] || undefined,
    province: r["Province / State"] || undefined,
    country: r["Country"] || undefined,
    linkedin: r["LinkedIn"] || undefined,
    facebook: r["Facebook"] || undefined,
    instagram: r["Instagram"] || undefined,
    website: r["Website"] || undefined,
    other_contact: r["Other Contact Information"] || undefined,
    student_id: r["Student ID"] || undefined,
    generation: Number.isFinite(gen) ? gen : undefined,
    program_type: r["Program Type"] || undefined,
    major: r["Major at Thammasat (Bachelor's Degree)"] || undefined,
    partner_university: r["Partner University"] || undefined,
    partner_major: r["Partner Degree Major (Bachelor's Degree)"] || undefined,
    admission_year: r["Admission Year"] || undefined,
    graduation_year: r["Graduation Year"] || undefined,
    honors: r["Honors"] || undefined,
    masters_partner_university: r["Partner University_1"] || undefined,
    masters_partner_degree: r["Partner University Degree (Masters)"] || undefined,
    masters_admission_year: r["Admission Year_2"] || undefined,
    masters_graduation_year: r["Graduation Year_2"] || undefined,
    masters_honors: r["Honors_2"] || undefined,
    additional_bachelors: r["Additional Bachelors Degree"] || undefined,
    additional_masters: r["Additional Masters Degree"] || undefined,
    additional_phd: r["Additional Ph.D."] || undefined,
    high_school: r["High School"] || undefined,
    high_school_gpax: r["High School GPAX"] || undefined,
    middle_school: r["Middle School"] || undefined,
    middle_school_gpax: r["Middle School GPAX"] || undefined,
    professional_summary: r["Professional summary"] || undefined,
    skills: commaList(r["Skills (comma separated)"]),
    expertise: commaList(r["Expertise (comma separated)"]),
    research_interests: r["Research interests "] || r["Research interests"] || undefined,
    certifications: r["Certifications "] || r["Certifications"] || undefined,
    jobs,
    available_as_mentor: /yes/i.test(r["Availability as Mentor"] ?? ""),
    directory_visible: /may be visible|visible/i.test(r["Alumni Directory Participation"] ?? "") || !r["Alumni Directory Participation"],
    imported_at: new Date().toISOString(),
  };
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const logout = useServerFn(adminLogout);
  const [alumni, setAlumni] = useState<Alumni[]>(alumniData as Alumni[]);
  const [events, setEvents] = useState<EventItem[]>(eventsData as EventItem[]);
  const [stories, setStories] = useState<Story[]>(storiesData as Story[]);
  const dirty = useMemo(() => ({
    alumni: JSON.stringify(alumni) !== JSON.stringify(alumniData),
    events: JSON.stringify(events) !== JSON.stringify(eventsData),
    stories: JSON.stringify(stories) !== JSON.stringify(storiesData),
  }), [alumni, events, stories]);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="font-display text-xl font-semibold">TEP-TEPE Admin</h1>
            <p className="text-xs text-muted-foreground">Hidden management console</p>
          </div>
          <Button variant="outline" size="sm" onClick={async () => { await logout(); onLogout(); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Card className="mb-6 border-dashed p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">How persistence works:</strong> Edits below live in your browser only. When you're done, click
          <strong className="text-foreground"> Download</strong> for each section that changed, replace the matching file in your GitHub
          repo (<code>src/data/alumni.json</code>, <code>events.json</code>, <code>stories.json</code>), and Lovable will redeploy.
        </Card>

        <Tabs defaultValue="import">
          <TabsList className="w-full">
            <TabsTrigger value="import">Import CSV</TabsTrigger>
            <TabsTrigger value="alumni">Alumni {dirty.alumni && <Dot />}</TabsTrigger>
            <TabsTrigger value="events">Events {dirty.events && <Dot />}</TabsTrigger>
            <TabsTrigger value="stories">Stories {dirty.stories && <Dot />}</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <ImportTab onMerge={(newRows, mode) => {
              setAlumni((prev) => {
                if (mode === "replace") return newRows;
                const key = (a: Alumni) => `${a.first_name.toLowerCase()}|${a.last_name.toLowerCase()}|${a.email?.toLowerCase() ?? ""}`;
                const map = new Map(prev.map((a) => [key(a), a]));
                for (const r of newRows) map.set(key(r), r);
                return Array.from(map.values());
              });
              toast.success(`Imported ${newRows.length} alumni. Don't forget to Download.`);
            }} />
          </TabsContent>

          <TabsContent value="alumni" className="mt-6">
            <AlumniTab alumni={alumni} setAlumni={setAlumni} dirty={dirty.alumni} />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <EventsTab events={events} setEvents={setEvents} dirty={dirty.events} />
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
            <StoriesTab stories={stories} setStories={setStories} dirty={dirty.stories} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Dot() { return <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />; }

function ImportTab({ onMerge }: { onMerge: (rows: Alumni[], mode: "merge" | "replace") => void }) {
  const [preview, setPreview] = useState<Alumni[] | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  function onFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data.filter((r) => (r["First Name"] || r["Last Name"])).map(parseCsvRow);
        setPreview(rows);
        toast.success(`Parsed ${rows.length} rows`);
      },
      error: (err) => toast.error(err.message),
    });
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">Import Google Form CSV</h2>
      <p className="mt-1 text-sm text-muted-foreground">Upload the exported CSV from your alumni Google Form.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> Choose CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor="mode">Mode:</Label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "merge" | "replace")} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
            <option value="merge">Merge (upsert by name+email)</option>
            <option value="replace">Replace all</option>
          </select>
        </div>
      </div>

      {preview && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{preview.length} rows ready</div>
            <Button size="sm" onClick={() => { onMerge(preview, mode); setPreview(null); }}>Apply to alumni list</Button>
          </div>
          <div className="max-h-96 overflow-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Gen</th><th className="p-2 text-left">Program</th><th className="p-2 text-left">Country</th><th className="p-2 text-left">Email</th></tr></thead>
              <tbody>
                {preview.slice(0, 200).map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="p-2">{a.first_name} {a.last_name}</td>
                    <td className="p-2">{a.generation ?? "—"}</td>
                    <td className="p-2">{a.program_type ?? "—"}</td>
                    <td className="p-2">{a.country ?? "—"}</td>
                    <td className="p-2">{a.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function AlumniTab({ alumni, setAlumni, dirty }: { alumni: Alumni[]; setAlumni: (fn: (prev: Alumni[]) => Alumni[]) => void; dirty: boolean }) {
  const [q, setQ] = useState("");
  const filtered = alumni.filter((a) => !q || `${a.first_name} ${a.last_name} ${a.email ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Manage alumni ({alumni.length})</h2>
          <p className="text-sm text-muted-foreground">Toggle visibility, feature on homepage, or remove.</p>
        </div>
        <Button size="sm" disabled={!dirty} onClick={() => downloadJson("alumni.json", alumni)}>
          <Download className="mr-1.5 h-4 w-4" /> Download alumni.json
        </Button>
      </div>
      <Input className="mt-4" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 divide-y divide-border rounded border border-border">
        {filtered.map((a) => {
          const hidden = a.hidden || a.directory_visible === false;
          const img = driveImageUrl(a.photo);
          return (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {img && <img src={img} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.first_name} {a.last_name} {a.featured && <Star className="ml-1 inline h-3 w-3 fill-current text-[var(--gold)]" />}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[a.program_type, a.generation && `#${a.generation}`, a.major, a.country].filter(Boolean).join(" · ")}
                </div>
              </div>
              {hidden && <Badge variant="outline">hidden</Badge>}
              <Button size="sm" variant="ghost" onClick={() => setAlumni((prev) => prev.map((x) => x.id === a.id ? { ...x, featured: !x.featured } : x))}>
                <Star className={`h-4 w-4 ${a.featured ? "fill-current text-[var(--gold)]" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAlumni((prev) => prev.map((x) => x.id === a.id ? { ...x, hidden: !hidden, directory_visible: hidden } : x))}>
                {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${a.first_name} ${a.last_name}?`)) setAlumni((prev) => prev.filter((x) => x.id !== a.id)); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No alumni yet — import a CSV.</div>}
      </div>
    </Card>
  );
}

function EventsTab({ events, setEvents, dirty }: { events: EventItem[]; setEvents: (fn: (prev: EventItem[]) => EventItem[]) => void; dirty: boolean }) {
  const empty: EventItem = { id: "", name: "", event_date: "" };
  const [draft, setDraft] = useState<EventItem>({ ...empty });
  function save() {
    if (!draft.name || !draft.event_date) { toast.error("Name and date required"); return; }
    setEvents((prev) => {
      const id = draft.id || makeId("e");
      const slug = draft.slug || slugify(draft.name);
      const item = { ...draft, id, slug };
      const idx = prev.findIndex((x) => x.id === id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? item : x) : [item, ...prev];
    });
    setDraft({ ...empty });
    toast.success("Saved");
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Events ({events.length})</h2>
        <Button size="sm" disabled={!dirty} onClick={() => downloadJson("events.json", events)}>
          <Download className="mr-1.5 h-4 w-4" /> Download events.json
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
        <div><Label>Date (YYYY-MM-DD)</Label><Input type="date" value={draft.event_date} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} /></div>
        <div><Label>Time</Label><Input value={draft.event_time ?? ""} onChange={(e) => setDraft({ ...draft, event_time: e.target.value })} /></div>
        <div><Label>Location</Label><Input value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Banner URL (Drive or image link)</Label><Input value={draft.banner_url ?? ""} onChange={(e) => setDraft({ ...draft, banner_url: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>External URL</Label><Input value={draft.external_url ?? ""} onChange={(e) => setDraft({ ...draft, external_url: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Long content</Label><Textarea rows={6} value={draft.content ?? ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
      </div>
      <div className="mt-3"><Button onClick={save}><Plus className="mr-1.5 h-4 w-4" />{draft.id ? "Update" : "Add"} event</Button></div>

      <div className="mt-6 divide-y divide-border rounded border border-border">
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.event_date} · {e.location}</div>
            </div>
            {e.hidden && <Badge variant="outline">hidden</Badge>}
            <Button size="sm" variant="ghost" onClick={() => setDraft(e)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setEvents((prev) => prev.map((x) => x.id === e.id ? { ...x, hidden: !x.hidden } : x))}>
              {e.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) setEvents((prev) => prev.filter((x) => x.id !== e.id)); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {events.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No events yet.</div>}
      </div>
    </Card>
  );
}

function StoriesTab({ stories, setStories, dirty }: { stories: Story[]; setStories: (fn: (prev: Story[]) => Story[]) => void; dirty: boolean }) {
  const empty: Story = { id: "", title: "", alumni_name: "" };
  const [draft, setDraft] = useState<Story>({ ...empty });
  function save() {
    if (!draft.title || !draft.alumni_name) { toast.error("Title and alumni name required"); return; }
    setStories((prev) => {
      const id = draft.id || makeId("s");
      const slug = draft.slug || slugify(draft.title);
      const item = { ...draft, id, slug };
      const idx = prev.findIndex((x) => x.id === id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? item : x) : [item, ...prev];
    });
    setDraft({ ...empty });
    toast.success("Saved");
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Stories ({stories.length})</h2>
        <Button size="sm" disabled={!dirty} onClick={() => downloadJson("stories.json", stories)}>
          <Download className="mr-1.5 h-4 w-4" /> Download stories.json
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
        <div><Label>Alumni name</Label><Input value={draft.alumni_name} onChange={(e) => setDraft({ ...draft, alumni_name: e.target.value })} /></div>
        <div><Label>Generation</Label><Input type="number" value={draft.generation ?? ""} onChange={(e) => setDraft({ ...draft, generation: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><Label>Company</Label><Input value={draft.company ?? ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Image URL</Label><Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>External URL</Label><Input value={draft.external_url ?? ""} onChange={(e) => setDraft({ ...draft, external_url: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Summary</Label><Textarea value={draft.summary ?? ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Content</Label><Textarea rows={8} value={draft.content ?? ""} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
      </div>
      <div className="mt-3"><Button onClick={save}><Plus className="mr-1.5 h-4 w-4" />{draft.id ? "Update" : "Add"} story</Button></div>

      <div className="mt-6 divide-y divide-border rounded border border-border">
        {stories.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.alumni_name}{s.company ? ` · ${s.company}` : ""}</div>
            </div>
            {s.hidden && <Badge variant="outline">hidden</Badge>}
            <Button size="sm" variant="ghost" onClick={() => setDraft(s)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setStories((prev) => prev.map((x) => x.id === s.id ? { ...x, hidden: !x.hidden } : x))}>
              {s.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) setStories((prev) => prev.filter((x) => x.id !== s.id)); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {stories.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No stories yet.</div>}
      </div>
    </Card>
  );
}
