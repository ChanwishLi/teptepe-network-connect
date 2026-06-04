import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { MAJORS, PROGRAM_TYPES, PARTNER_UNIVERSITIES, GENERATIONS, CONSENT_VERSION, generationStatus, type ProgramType } from "@/lib/constants";

export const Route = createFileRoute("/register")({ component: RegisterPage });

type FormState = {
  first_name: string; last_name: string; preferred_name: string; gender: string; date_of_birth: string; nationality: string;
  email: string; password: string; phone: string; address: string; city: string; province: string; country: string;
  facebook_url: string; instagram_url: string; linkedin_url: string; personal_website: string;
  student_id: string; program_type: ProgramType | ""; major: string; admission_year: string; graduation_year: string; generation: string; partner_university: string; honors: string;
  c_data: boolean; c_directory: boolean; c_comms: boolean; c_mentor: boolean;
};

const initial: FormState = {
  first_name: "", last_name: "", preferred_name: "", gender: "", date_of_birth: "", nationality: "",
  email: "", password: "", phone: "", address: "", city: "", province: "", country: "",
  facebook_url: "", instagram_url: "", linkedin_url: "", personal_website: "",
  student_id: "", program_type: "", major: "", admission_year: "", graduation_year: "", generation: "", partner_university: "", honors: "",
  c_data: false, c_directory: false, c_comms: false, c_mentor: false,
};

const TOTAL_STEPS = 4;

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [f, setF] = useState<FormState>(initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const partners = f.program_type ? PARTNER_UNIVERSITIES[f.program_type] : [];

  const onAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(file ? URL.createObjectURL(file) : "");
  };

  const validateStep = () => {
    if (step === 1) return f.first_name && f.last_name && f.gender && f.date_of_birth && f.nationality && !!avatarFile;
    if (step === 2) return f.email && f.password.length >= 8 && f.country;
    if (step === 3) {
      if (!f.program_type || !f.major || !f.generation || !f.graduation_year || !f.admission_year) return false;
      if (f.program_type !== "TEPE" && !f.partner_university) return false;
      return true;
    }
    if (step === 4) return f.c_data && f.c_directory;
    return false;
  };

  const next = () => {
    if (!validateStep()) return toast.error("Please complete all required fields.");
    setStep((s) => s + 1);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return toast.error("Missing required consents.");
    if (!avatarFile) return toast.error("Profile picture is required.");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: f.email, password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: f.first_name, last_name: f.last_name, preferred_name: f.preferred_name,
          gender: f.gender, date_of_birth: f.date_of_birth, nationality: f.nationality,
          phone: f.phone, address: f.address, city: f.city, province: f.province, country: f.country,
          facebook_url: f.facebook_url, instagram_url: f.instagram_url, linkedin_url: f.linkedin_url, personal_website: f.personal_website,
          student_id: f.student_id, program_type: f.program_type, major: f.major,
          admission_year: f.admission_year, graduation_year: f.graduation_year, generation: f.generation,
          partner_university: f.partner_university, honors: f.honors,
        },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    if (data.user) {
      const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${data.user.id}/avatar.${ext}`;
      const up = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (!up.error) {
        await supabase.from("profiles").update({ avatar_url: path }).eq("id", data.user.id);
      }
      await supabase.from("consent_records").insert({
        user_id: data.user.id, consent_version: CONSENT_VERSION,
        data_collection: f.c_data, directory_participation: f.c_directory,
        communications: f.c_comms, mentorship_matching: f.c_mentor,
      });
    }
    setLoading(false);
    toast.success("Account created. Awaiting admin approval.");
    navigate({ to: "/profile" });
  };

  const googleSignIn = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/profile` });
    if (res.error) toast.error(res.error.message || "Google sign-in failed");
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="p-8">
          <div className="mb-6">
            <div className="flex items-baseline justify-between">
              <h1 className="font-display text-3xl font-bold">Join TEP-TEPE</h1>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of 4</span>
            </div>
            <Progress value={(step / 4) * 100} className="mt-3" />
          </div>

          {step === 1 && (
            <div className="mb-6 space-y-2">
              <Button type="button" variant="outline" className="w-full" onClick={googleSignIn}>Continue with Google</Button>
              <div className="relative my-2 text-center text-xs text-muted-foreground">
                <span className="relative z-10 bg-card px-2">or fill in the form below</span>
                <span className="absolute left-0 right-0 top-1/2 -z-0 border-t" />
              </div>
            </div>
          )}

          <form onSubmit={step === 4 ? submit : (e) => { e.preventDefault(); next(); }} className="space-y-4">

            {step === 1 && (
              <>
                <h2 className="font-display text-lg font-semibold">Personal information</h2>
                <Field label="Profile picture *" hint="Required. Square images work best.">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
                      {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
                    </div>
                    <Input type="file" accept="image/*" onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)} className="max-w-xs" />
                  </div>
                </Field>
                <Grid2><Field label="First name *"><Input value={f.first_name} onChange={(e) => set("first_name", e.target.value)} required /></Field>
                <Field label="Last name *"><Input value={f.last_name} onChange={(e) => set("last_name", e.target.value)} required /></Field></Grid2>
                <Field label="Preferred name"><Input value={f.preferred_name} onChange={(e) => set("preferred_name", e.target.value)} /></Field>
                <Grid2>
                  <Field label="Gender *">
                    <Select value={f.gender} onValueChange={(v) => set("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date of birth *"><Input type="date" value={f.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} required /></Field>
                </Grid2>
                <Field label="Nationality *"><Input value={f.nationality} onChange={(e) => set("nationality", e.target.value)} required /></Field>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-lg font-semibold">Contact information</h2>
                <Grid2><Field label="Email *"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></Field>
                <Field label="Password *" hint="At least 8 characters"><Input type="password" minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} required /></Field></Grid2>
                <Field label="Phone"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                <Field label="Address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
                <Grid2><Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
                <Field label="Province / State"><Input value={f.province} onChange={(e) => set("province", e.target.value)} /></Field></Grid2>
                <Field label="Country *"><Input value={f.country} onChange={(e) => set("country", e.target.value)} required /></Field>
                <div className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">Social (optional)</div>
                <Grid2><Field label="LinkedIn"><Input value={f.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
                <Field label="Facebook"><Input value={f.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} /></Field></Grid2>
                <Grid2><Field label="Instagram"><Input value={f.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} /></Field>
                <Field label="Website"><Input value={f.personal_website} onChange={(e) => set("personal_website", e.target.value)} /></Field></Grid2>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-lg font-semibold">Program information</h2>
                <Grid2><Field label="Student ID"><Input value={f.student_id} onChange={(e) => set("student_id", e.target.value)} /></Field>
                <Field label="Generation *">
                  <Select value={f.generation} onValueChange={(v) => set("generation", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{GENERATIONS.map((g) => <SelectItem key={g} value={String(g)}>#{g} — {generationStatus(g)}</SelectItem>)}</SelectContent>
                  </Select>
                </Field></Grid2>
                <Field label="Program type *">
                  <Select value={f.program_type} onValueChange={(v) => { set("program_type", v as ProgramType); set("partner_university", ""); }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PROGRAM_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Major *">
                  <Select value={f.major} onValueChange={(v) => set("major", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{MAJORS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                {f.program_type && f.program_type !== "TEPE" && (
                  <Field label="Partner university *">
                    <Select value={f.partner_university} onValueChange={(v) => set("partner_university", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{partners.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
                <Grid2><Field label="Admission year *"><Input type="number" min={1995} max={2030} value={f.admission_year} onChange={(e) => set("admission_year", e.target.value)} required /></Field>
                <Field label="Graduation year *"><Input type="number" min={1999} max={2035} value={f.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} required /></Field></Grid2>
                <Field label="Honors (e.g. First Class, Second Class Upper)"><Input value={f.honors} onChange={(e) => set("honors", e.target.value)} /></Field>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Education History — Part 1 (auto-generated)</div>
                  {f.program_type === "TEPE" && <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>}
                  {f.program_type === "TEP" && (<>
                    <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>
                    <div>• Bachelor's Degree — {f.partner_university || "Partner University"}</div>
                  </>)}
                  {f.program_type === "TEPE+" && (<>
                    <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>
                    <div>• Master's Degree — {f.partner_university || "Partner University"}</div>
                  </>)}
                  <div className="pt-1">These records cannot be deleted. You can add high school, additional degrees, and certifications later from your profile.</div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-display text-lg font-semibold">PDPA consent</h2>
                <p className="text-sm text-muted-foreground">Under Thailand's Personal Data Protection Act, please review and consent to the following. You may withdraw consent at any time.</p>
                <ConsentRow checked={f.c_data} onChange={(v) => set("c_data", v)} label="Personal data collection (required)" desc="I consent to TEP-TEPE collecting and processing my personal information for alumni network purposes." />
                <ConsentRow checked={f.c_directory} onChange={(v) => set("c_directory", v)} label="Alumni directory participation (required)" desc="My profile may be visible in the alumni directory to other authenticated members." />
                <ConsentRow checked={f.c_comms} onChange={(v) => set("c_comms", v)} label="Alumni communications" desc="I'd like to receive news, event invitations, and updates from TEP-TEPE." />
                <ConsentRow checked={f.c_mentor} onChange={(v) => set("c_mentor", v)} label="Mentorship matching" desc="You may include me in mentorship matching considerations." />
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button> : <span />}
              <Button type="submit" disabled={loading}>{step === 4 ? (loading ? "Creating…" : "Create account") : "Continue"}</Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (<div><Label className="mb-1.5 block">{label}</Label>{children}{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>);
}
function Grid2({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 sm:grid-cols-2">{children}</div>; }
function ConsentRow({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border p-4 cursor-pointer hover:bg-muted/40">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-1" />
      <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
    </label>
  );
}
