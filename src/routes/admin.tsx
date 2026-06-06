import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TEP-TEPE Alumni Network" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="font-display text-4xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage members, content, and approvals.</p>

        <Tabs defaultValue="approvals" className="mt-8">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="approvals">Opportunity approvals</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals"><InternshipApprovals /></TabsContent>
          <TabsContent value="members"><MembersAdmin /></TabsContent>
          <TabsContent value="events"><EventsAdmin /></TabsContent>
          <TabsContent value="stories"><StoriesAdmin /></TabsContent>
          <TabsContent value="partners"><PartnersAdmin /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

/* ---------- Internship Approvals ---------- */
function InternshipApprovals() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "internships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("internship_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase.from("internship_posts").update({ status, rejection_reason: reason ?? null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "internships"] }); qc.invalidateQueries({ queryKey: ["internships"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("internship_posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "internships"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  if (isLoading) return <div className="py-8 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="mt-6 space-y-3">
      {(data ?? []).map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg font-semibold">{p.position} <span className="text-muted-foreground font-normal">· {p.company_name}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">{p.employment_type} · {p.location ?? "—"} · contact: {p.contact_email ?? "—"}</div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
            </div>
            <Badge variant="outline">{p.status}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.status !== "approved" && <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "approved" })}><Check className="mr-1.5 h-4 w-4" /> Approve</Button>}
            {p.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => { const r = prompt("Reason for rejection?") ?? ""; setStatus.mutate({ id: p.id, status: "rejected", reason: r }); }}><X className="mr-1.5 h-4 w-4" /> Reject</Button>}
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this post?")) del.mutate(p.id); }}><Trash2 className="mr-1.5 h-4 w-4" /> Delete</Button>
          </div>
        </Card>
      ))}
      {data && data.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No submissions yet.</div>}
    </div>
  );
}

/* ---------- Members ---------- */
function MembersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("id, first_name, last_name, email, generation, program_type, is_approved, is_featured").order("generation", { ascending: false }).limit(200);
      if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "members"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="mt-6">
      <Input placeholder="Search members…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="mt-4 space-y-2">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (data ?? []).map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium">{m.first_name} {m.last_name}</div>
              <div className="text-xs text-muted-foreground">{m.email} · {m.program_type} #{m.generation}</div>
            </div>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-xs"><span>Approved</span><Switch checked={!!m.is_approved} onCheckedChange={(v) => toggle.mutate({ id: m.id, patch: { is_approved: v } })} /></label>
              <label className="flex items-center gap-2 text-xs"><span>Featured</span><Switch checked={!!m.is_featured} onCheckedChange={(v) => toggle.mutate({ id: m.id, patch: { is_featured: v } })} /></label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Generic CRUD shell ---------- */
type Field = { name: string; label: string; type?: "text" | "textarea" | "date" | "number" | "url" | "switch"; rows?: number };

function CrudSection<T extends { id: string }>({
  title, table, fields, listColumns, defaultRow, orderBy = "created_at",
}: {
  title: string;
  table: string;
  fields: Field[];
  listColumns: (row: any) => React.ReactNode;
  defaultRow: any;
  orderBy?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order(orderBy, { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: any) => {
      if (row.id) {
        const { id, ...patch } = row;
        const { error } = await supabase.from(table as any).update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin", table] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", table] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({ ...defaultRow })}><Plus className="mr-1.5 h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Create"} {title}</DialogTitle></DialogHeader>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
              {fields.map((f) => (
                <div key={f.name}>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea rows={f.rows ?? 4} value={editing?.[f.name] ?? ""} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} />
                  ) : f.type === "switch" ? (
                    <Switch checked={!!editing?.[f.name]} onCheckedChange={(v) => setEditing({ ...editing, [f.name]: v })} />
                  ) : (
                    <Input type={f.type ?? "text"} value={editing?.[f.name] ?? ""} onChange={(e) => setEditing({ ...editing, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                const payload: any = { ...editing };
                for (const k of Object.keys(payload)) if (payload[k] === "") payload[k] = null;
                save.mutate(payload);
              }} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (data ?? []).map((row: any) => (
          <Card key={row.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">{listColumns(row)}</div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditing({ ...row }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) del.mutate(row.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</div>}
      </div>
    </div>
  );
}

function EventsAdmin() {
  return (
    <CrudSection
      title="Events"
      table="events"
      orderBy="event_date"
      defaultRow={{ name: "", slug: "", event_date: "", event_time: "", location: "", description: "", content: "", banner_url: "", rsvp_deadline: "", is_published: false, is_archived: false }}
      fields={[
        { name: "name", label: "Title" },
        { name: "slug", label: "URL slug (e.g. reunion-2026)" },
        { name: "event_date", label: "Date", type: "date" },
        { name: "event_time", label: "Time (HH:MM)" },
        { name: "location", label: "Location" },
        { name: "description", label: "Short description (preview)", type: "textarea", rows: 2 },
        { name: "content", label: "Full blog content", type: "textarea", rows: 10 },
        { name: "banner_url", label: "Banner image URL", type: "url" },
        { name: "rsvp_deadline", label: "RSVP deadline", type: "date" },
        { name: "is_published", label: "Published", type: "switch" },
        { name: "is_archived", label: "Archived", type: "switch" },
      ]}
      listColumns={(r) => (
        <div>
          <div className="font-medium">{r.name} {r.is_published ? <Badge variant="outline" className="ml-2">Published</Badge> : <Badge variant="secondary" className="ml-2">Draft</Badge>}</div>
          <div className="text-xs text-muted-foreground">{r.event_date} {r.event_time ?? ""} · {r.location ?? "—"}</div>
        </div>
      )}
    />
  );
}





function StoriesAdmin() {
  return (
    <CrudSection
      title="Success stories"
      table="success_stories"
      defaultRow={{ title: "", alumni_name: "", company: "", generation: null, content: "", image_url: "", is_published: false }}
      fields={[
        { name: "title", label: "Title" },
        { name: "alumni_name", label: "Alumni name" },
        { name: "company", label: "Company" },
        { name: "generation", label: "Generation", type: "number" },
        { name: "content", label: "Story", type: "textarea", rows: 8 },
        { name: "image_url", label: "Image URL", type: "url" },
        { name: "is_published", label: "Published", type: "switch" },
      ]}
      listColumns={(r) => (
        <div>
          <div className="font-medium">{r.title}</div>
          <div className="text-xs text-muted-foreground">{r.alumni_name ?? ""} {r.company ? `· ${r.company}` : ""}</div>
        </div>
      )}
    />
  );
}

function PartnersAdmin() {
  return (
    <CrudSection
      title="Industry partners"
      table="industry_partners"
      orderBy="display_order"
      defaultRow={{ name: "", logo_url: "", website: "", display_order: 0 }}
      fields={[
        { name: "name", label: "Company name" },
        { name: "logo_url", label: "Logo URL", type: "url" },
        { name: "website", label: "Website", type: "url" },
        { name: "display_order", label: "Display order", type: "number" },
      ]}
      listColumns={(r) => (
        <div className="flex items-center gap-3">
          {r.logo_url && <img src={r.logo_url} alt="" className="h-8 w-8 rounded object-contain" />}
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.website ?? ""}</div>
          </div>
        </div>
      )}
    />
  );
}
