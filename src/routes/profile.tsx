import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { generationStatus } from "@/lib/constants";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — TEP-TEPE Alumni Network" }] }),
  component: ProfilePage,
});

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

  const [form, setForm] = useState<any>({});
  const [ment, setMent] = useState<any>({});

  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  useEffect(() => { if (mentorship) setMent(mentorship); }, [mentorship]);

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

  if (loading || !user || pLoading || !profile) {
    return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">My profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.program_type} #{profile.generation} · {generationStatus(profile.generation)} · {user.email}
            </p>
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-8">
          <TabsList>
            <TabsTrigger value="info">Personal</TabsTrigger>
            <TabsTrigger value="prof">Professional</TabsTrigger>
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
                <Field label="Certifications (comma separated)" value={csv(form.certifications)} onChange={(v) => setForm({ ...form, certifications: v })} />
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
