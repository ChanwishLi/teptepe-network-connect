import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { } from "lucide-react";
import { toast } from "sonner";
import { useAvatarUrl } from "@/lib/avatar";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — TEP-TEPE Alumni Network" }] }),
  component: ProfilePage,
});

const EDU_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "Doctoral Degree (PhD)" },
  { value: "certification", label: "Professional Certification" },
] as const;
const LEVEL_LABEL: Record<string, string> = Object.fromEntries(EDU_LEVELS.map((l) => [l.value, l.label]));

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading: pLoading } = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: mentorship } = useQuery({
    enabled: !!user,
    queryKey: ["mentorship", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("mentorship_settings").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: education = [] } = useQuery({
    enabled: !!user,
    queryKey: ["education", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_records").select("*").eq("user_id", user!.id)
        .order("is_mandatory", { ascending: false }).order("graduation_year", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState<any>({});
  const [ment, setMent] = useState<any>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  useEffect(() => { if (mentorship) setMent(mentorship); }, [mentorship]);

  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Max file size is 5 MB.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user!.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile picture updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const update: any = {
        first_name: form.first_name, last_name: form.last_name, preferred_name: form.preferred_name,
        phone: form.phone, city: form.city, province: form.province, country: form.country,
        professional_summary: form.professional_summary, linkedin_url: form.linkedin_url,
        facebook_url: form.facebook_url, instagram_url: form.instagram_url, personal_website: form.personal_website,
        skills: parseCsv(form.skills), expertise: parseCsv(form.expertise),
        certifications: parseCsv(form.certifications), research_interests: parseCsv(form.research_interests),
        show_email: !!form.show_email, show_phone: !!form.show_phone,
        show_linkedin: !!form.show_linkedin, show_facebook: !!form.show_facebook,
        show_instagram: !!form.show_instagram, show_website: !!form.show_website,
      };
      const { error } = await supabase.from("profiles").update(update).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMentor = useMutation({
    mutationFn: async () => {
      const payload: any = {
        user_id: user!.id,
        available_as_mentor: !!ment.available_as_mentor,
        hours_per_month: ment.hours_per_month ? Number(ment.hours_per_month) : null,
        preferred_contact_method: ment.preferred_contact_method || null,
        mentorship_areas: parseCsv(ment.mentorship_areas),
        industry_expertise: parseCsv(ment.industry_expertise),
      };
      const { error } = await supabase.from("mentorship_settings").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Mentor settings saved"); qc.invalidateQueries({ queryKey: ["mentorship"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEdu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["education"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading || !user || pLoading || !profile) {
    return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;
  }

  const initials = `${(profile.first_name?.[0] ?? "")}${(profile.last_name?.[0] ?? "")}`.toUpperCase() || "?";
  const mandatory = (education as any[]).filter((e) => e.is_mandatory);
  const additional = (education as any[]).filter((e) => !e.is_mandatory);

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar.mutate(f); e.target.value = ""; }}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending}>
              {uploadAvatar.isPending ? "Uploading…" : "Change photo"}
            </Button>
          </div>
          <div className="min-w-[16rem] flex-1">
            <h1 className="font-display text-4xl font-semibold">{profile.first_name} {profile.last_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.program_type ? `${profile.program_type} #${profile.generation}` : "Profile incomplete"} · {user.email}
            </p>
            {(!profile.program_type || !profile.generation || !profile.major) && (
              <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <strong>Complete your profile.</strong> Please fill in your program, generation, and major below so you can be approved and appear in the directory.
              </div>
            )}
            {!profile.is_approved && (
              <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                Your account is awaiting admin approval. Once approved you'll appear in the alumni directory.
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-8">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="info">Personal</TabsTrigger>
            <TabsTrigger value="prof">Professional</TabsTrigger>
            <TabsTrigger value="edu">Education</TabsTrigger>
            <TabsTrigger value="vis">Visibility</TabsTrigger>
            <TabsTrigger value="mentor">Mentor</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
                <Field label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
                <Field label="Preferred name" value={form.preferred_name ?? ""} onChange={(v) => setForm({ ...form, preferred_name: v })} />
                <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="City" value={form.city ?? ""} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="Province / State" value={form.province ?? ""} onChange={(v) => setForm({ ...form, province: v })} />
                <Field label="Country" value={form.country ?? ""} onChange={(v) => setForm({ ...form, country: v })} />
              </div>
              <SaveBtn pending={saveProfile.isPending} onClick={() => saveProfile.mutate()} />
            </Card>
          </TabsContent>

          <TabsContent value="prof">
            <Card className="p-6">
              <div className="grid gap-4">
                <div>
                  <Label>Professional summary</Label>
                  <Textarea rows={4} value={form.professional_summary ?? ""} onChange={(e) => setForm({ ...form, professional_summary: e.target.value })} />
                </div>
                <Field label="Skills (comma separated)" value={csv(form.skills)} onChange={(v) => setForm({ ...form, skills: v })} />
                <Field label="Expertise (comma separated)" value={csv(form.expertise)} onChange={(v) => setForm({ ...form, expertise: v })} />
                <Field label="Research interests (comma separated)" value={csv(form.research_interests)} onChange={(v) => setForm({ ...form, research_interests: v })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="LinkedIn URL" value={form.linkedin_url ?? ""} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
                  <Field label="Personal website" value={form.personal_website ?? ""} onChange={(v) => setForm({ ...form, personal_website: v })} />
                  <Field label="Facebook URL" value={form.facebook_url ?? ""} onChange={(v) => setForm({ ...form, facebook_url: v })} />
                  <Field label="Instagram URL" value={form.instagram_url ?? ""} onChange={(v) => setForm({ ...form, instagram_url: v })} />
                </div>
              </div>
              <SaveBtn pending={saveProfile.isPending} onClick={() => saveProfile.mutate()} />
            </Card>
          </TabsContent>

          <TabsContent value="edu">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold">Part 1 — TEP-TEPE Record</h3>
                <p className="text-xs text-muted-foreground">Auto-generated from your program. These records cannot be deleted.</p>
                <div className="mt-3 space-y-2">
                  {mandatory.length === 0 && <div className="text-sm text-muted-foreground">No mandatory records yet.</div>}
                  {mandatory.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                      <div className="text-sm">
                        <div className="font-medium">{LEVEL_LABEL[e.level] ?? e.level} — {e.institution}</div>
                        <div className="text-xs text-muted-foreground">
                          {[e.major, e.country, e.graduation_year, e.honors].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <Badge variant="secondary">Locked</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">Part 2 — Additional Education</h3>
                    <p className="text-xs text-muted-foreground">High school, additional degrees, and certifications.</p>
                  </div>
                  <AddEducationDialog userId={user.id} onSaved={() => qc.invalidateQueries({ queryKey: ["education"] })} />
                </div>
                <div className="mt-3 space-y-2">
                  {additional.length === 0 && <div className="text-sm text-muted-foreground">Nothing here yet — click "Add entry" to get started.</div>}
                  {additional.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                      <div className="text-sm">
                        <div className="font-medium">{LEVEL_LABEL[e.level] ?? e.level} — {e.institution}</div>
                        <div className="text-xs text-muted-foreground">
                          {[e.major, e.country, e.graduation_year ?? e.year_awarded, e.organization, e.honors].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteEdu.mutate(e.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="vis">
            <Card className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Choose which contact details other authenticated alumni can see on your profile.</p>
              <Toggle label="Show email" value={!!form.show_email} onChange={(v) => setForm({ ...form, show_email: v })} />
              <Toggle label="Show phone" value={!!form.show_phone} onChange={(v) => setForm({ ...form, show_phone: v })} />
              <Toggle label="Show LinkedIn" value={!!form.show_linkedin} onChange={(v) => setForm({ ...form, show_linkedin: v })} />
              <Toggle label="Show personal website" value={!!form.show_website} onChange={(v) => setForm({ ...form, show_website: v })} />
              <Toggle label="Show Facebook" value={!!form.show_facebook} onChange={(v) => setForm({ ...form, show_facebook: v })} />
              <Toggle label="Show Instagram" value={!!form.show_instagram} onChange={(v) => setForm({ ...form, show_instagram: v })} />
              <SaveBtn pending={saveProfile.isPending} onClick={() => saveProfile.mutate()} />
            </Card>
          </TabsContent>

          <TabsContent value="mentor">
            <Card className="p-6 space-y-4">
              <Toggle label="Available as a mentor" value={!!ment.available_as_mentor} onChange={(v) => setMent({ ...ment, available_as_mentor: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hours per month" value={ment.hours_per_month ?? ""} onChange={(v) => setMent({ ...ment, hours_per_month: v })} />
                <Field label="Preferred contact method" value={ment.preferred_contact_method ?? ""} onChange={(v) => setMent({ ...ment, preferred_contact_method: v })} />
              </div>
              <Field label="Mentorship areas (comma separated)" value={csv(ment.mentorship_areas)} onChange={(v) => setMent({ ...ment, mentorship_areas: v })} />
              <Field label="Industry expertise (comma separated)" value={csv(ment.industry_expertise)} onChange={(v) => setMent({ ...ment, industry_expertise: v })} />
              <SaveBtn pending={saveMentor.isPending} onClick={() => saveMentor.mutate()} />
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

function AddEducationDialog({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<string>("high_school");
  const [institution, setInstitution] = useState("");
  const [major, setMajor] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [organization, setOrganization] = useState("");
  const [honors, setHonors] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setLevel("high_school"); setInstitution(""); setMajor(""); setCountry(""); setYear(""); setOrganization(""); setHonors(""); };

  const submit = async () => {
    if (!institution.trim()) return toast.error("Institution / Organization required");
    setSaving(true);
    const payload: any = {
      user_id: userId, level, institution: institution.trim(), is_mandatory: false,
    };
    if (level === "certification") {
      payload.organization = organization.trim() || institution.trim();
      payload.year_awarded = year ? Number(year) : null;
    } else {
      if (level !== "high_school") payload.major = major.trim() || null;
      payload.country = country.trim() || null;
      payload.graduation_year = year ? Number(year) : null;
      if (honors.trim()) payload.honors = honors.trim();
    }
    const { error } = await supabase.from("education_records").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Added");
    reset(); setOpen(false); onSaved();
  };

  const isCert = level === "certification";
  const isHs = level === "high_school";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button size="sm">Add entry</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add education entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Type</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EDU_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">{isCert ? "Certification name" : isHs ? "School name" : "University"}</Label>
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>
          {isCert && (
            <div>
              <Label className="mb-1.5 block">Issuing organization</Label>
              <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
          )}
          {!isCert && !isHs && (
            <div>
              <Label className="mb-1.5 block">Major</Label>
              <Input value={major} onChange={(e) => setMajor(e.target.value)} />
            </div>
          )}
          {!isCert && (
            <div>
              <Label className="mb-1.5 block">Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">{isCert ? "Year awarded" : "Graduation year"}</Label>
              <Input type="number" min={1950} max={2035} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            {!isCert && !isHs && (
              <div>
                <Label className="mb-1.5 block">Honors</Label>
                <Input value={honors} onChange={(e) => setHonors(e.target.value)} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Add entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function SaveBtn({ pending, onClick }: { pending: boolean; onClick: () => void }) {
  return <div className="mt-6 flex justify-end"><Button onClick={onClick} disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button></div>;
}
function csv(arr: any) { return Array.isArray(arr) ? arr.join(", ") : (typeof arr === "string" ? arr : ""); }
function parseCsv(v: any): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function ConnectionsPanel() {
  const { user } = useAuth();
  const me = user?.id;
  const { data: rows = [], isLoading } = useMyConnections();
  const otherIds = Array.from(new Set(rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id))));

  const { data: peers = [] } = useQuery({
    enabled: otherIds.length > 0,
    queryKey: ["connection-peers", otherIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name, generation, program_type, major, avatar_url")
        .in("id", otherIds);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const peerMap = new Map(peers.map((p) => [p.id, p]));

  const incoming = rows.filter((r) => r.status === "pending" && r.addressee_id === me);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester_id === me);
  const accepted = rows.filter((r) => r.status === "accepted");

  return (
    <div className="space-y-6">
      <ConnList
        title="Pending requests"
        icon={<Clock className="h-4 w-4" />}
        empty="No incoming requests."
        rows={incoming}
        peerMap={peerMap}
        meId={me!}
        mode="incoming"
      />
      <ConnList
        title="Sent requests"
        icon={<Clock className="h-4 w-4" />}
        empty="You haven't sent any requests."
        rows={outgoing}
        peerMap={peerMap}
        meId={me!}
        mode="outgoing"
      />
      <ConnList
        title="My connections"
        icon={<UserCheck className="h-4 w-4" />}
        empty={isLoading ? "Loading…" : "No connections yet — browse the directory to start connecting."}
        rows={accepted}
        peerMap={peerMap}
        meId={me!}
        mode="accepted"
      />
    </div>
  );
}

function ConnList({
  title, icon, empty, rows, peerMap, meId, mode,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  rows: Array<{ id: string; requester_id: string; addressee_id: string }>;
  peerMap: Map<string, any>;
  meId: string;
  mode: "incoming" | "outgoing" | "accepted";
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}<span>{title} ({rows.length})</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const otherId = r.requester_id === meId ? r.addressee_id : r.requester_id;
            const peer = peerMap.get(otherId);
            return <ConnRow key={r.id} rowId={r.id} otherId={otherId} peer={peer} mode={mode} />;
          })}
        </div>
      )}
    </Card>
  );
}

function ConnRow({ rowId, otherId, peer, mode }: { rowId: string; otherId: string; peer: any; mode: "incoming" | "outgoing" | "accepted" }) {
  const avatar = useAvatarUrl(peer?.avatar_url);
  const { accept, remove } = useConnectionActions(otherId);
  const name = peer ? `${peer.first_name} ${peer.last_name}` : "Alumni";
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <Link to="/alumni/$id" params={{ id: otherId }} className="flex items-center gap-3 hover:underline">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          {peer && <div className="text-xs text-muted-foreground">{peer.program_type} #{peer.generation} · {peer.major}</div>}
        </div>
      </Link>
      <div className="flex gap-2">
        {mode === "incoming" && (
          <>
            <Button size="sm" onClick={() => accept.mutate(rowId, { onSuccess: () => toast.success("Connected"), onError: (e: any) => toast.error(e.message) })} disabled={accept.isPending}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => remove.mutate(rowId, { onSuccess: () => toast.success("Rejected"), onError: (e: any) => toast.error(e.message) })} disabled={remove.isPending}>Reject</Button>
          </>
        )}
        {mode === "outgoing" && (
          <Button size="sm" variant="outline" onClick={() => remove.mutate(rowId, { onSuccess: () => toast.success("Request cancelled"), onError: (e: any) => toast.error(e.message) })} disabled={remove.isPending}>Cancel</Button>
        )}
        {mode === "accepted" && (
          <Button size="sm" variant="ghost" onClick={() => remove.mutate(rowId, { onSuccess: () => toast.success("Connection removed"), onError: (e: any) => toast.error(e.message) })} disabled={remove.isPending}>Remove</Button>
        )}
      </div>
    </div>
  );
}
