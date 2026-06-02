import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/internships/new")({
  head: () => ({ meta: [{ title: "Post an opportunity — TEP-TEPE Alumni Network" }] }),
  component: NewInternshipPage,
});

function NewInternshipPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    position: "", company_name: "", employment_type: "internship",
    description: "", location: "", application_link: "", contact_email: "", deadline: "",
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!form.position || !form.company_name || !form.description) {
        throw new Error("Position, company, and description are required.");
      }
      const { error } = await supabase.from("internship_posts").insert({
        position: form.position,
        company_name: form.company_name,
        employment_type: form.employment_type as any,
        description: form.description,
        location: form.location || null,
        application_link: form.application_link || null,
        contact_email: form.contact_email || null,
        deadline: form.deadline || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submitted for review. Admins will publish it shortly."); navigate({ to: "/internships" }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading || !user) return <PageShell><div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading…</div></PageShell>;

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-4 py-12 lg:px-8">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Alumni opportunity</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Post an internship or job</h1>
        <p className="mt-2 text-sm text-muted-foreground">All postings are reviewed by an administrator before going live.</p>

        <Card className="mt-8 p-6 space-y-4">
          <Row label="Position title *"><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Row>
          <Row label="Company *"><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></Row>
          <Row label="Type">
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangkok / Remote" /></Row>
          <Row label="Description *">
            <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Row>
          <Row label="Application link"><Input value={form.application_link} onChange={(e) => setForm({ ...form, application_link: e.target.value })} placeholder="https://…" /></Row>
          <Row label="Contact email (kept private; only shown to admins)">
            <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </Row>
          <Row label="Application deadline">
            <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Row>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" asChild><Link to="/internships">Cancel</Link></Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>{submit.isPending ? "Submitting…" : "Submit for review"}</Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
