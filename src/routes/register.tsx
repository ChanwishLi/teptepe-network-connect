import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MAJORS, PROGRAM_TYPES, PARTNER_UNIVERSITIES, GENERATIONS, generationStatus, type ProgramType } from "@/lib/constants";
import logoAsset from "@/assets/tep-tepe-logo.png.asset.json";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join TEP-TEPE Alumni Network" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RegisterPage,
});

type EduEntry = { level: string; institution: string; major: string; country: string; year: string; organization: string; honors: string };
const blankEdu = (): EduEntry => ({ level: "high_school", institution: "", major: "", country: "", year: "", organization: "", honors: "" });

type JobEntry = { company: string; position: string; business_type: string; industry: string; city: string; country: string; start_year: string; end_year: string; is_current: boolean };
const blankJob = (isCurrent = false): JobEntry => ({ company: "", position: "", business_type: "", industry: "", city: "", country: "", start_year: "", end_year: "", is_current: isCurrent });

type FormState = {
  first_name: string; last_name: string; preferred_name: string; gender: string; date_of_birth: string; nationality: string;
  email: string; password: string; phone: string; address: string; city: string; province: string; country: string;
  facebook_url: string; instagram_url: string; linkedin_url: string; personal_website: string;
  student_id: string; program_type: ProgramType | ""; major: string; admission_year: string; graduation_year: string; generation: string; partner_university: string; partner_degree: string; partner_major: string; honors: string;
  professional_summary: string; skills: string; expertise: string; research_interests: string; certifications: string;
  jobs: JobEntry[];
  educations: EduEntry[];
  mentor_available: boolean; mentor_hours: string; mentor_contact: string; mentor_areas: string; mentor_industry: string;
  c_data: boolean; c_directory: boolean; c_comms: boolean; c_mentor: boolean;
};

const initial: FormState = {
  first_name: "", last_name: "", preferred_name: "", gender: "", date_of_birth: "", nationality: "",
  email: "", password: "", phone: "", address: "", city: "", province: "", country: "",
  facebook_url: "", instagram_url: "", linkedin_url: "", personal_website: "",
  student_id: "", program_type: "", major: "", admission_year: "", graduation_year: "", generation: "", partner_university: "", partner_degree: "bachelor", partner_major: "", honors: "",
  professional_summary: "", skills: "", expertise: "", research_interests: "", certifications: "",
  jobs: [blankJob(true)],
  educations: [],
  mentor_available: false, mentor_hours: "", mentor_contact: "", mentor_areas: "", mentor_industry: "",
  c_data: false, c_directory: false, c_comms: false, c_mentor: false,
};

const TOTAL_STEPS = 7;

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [f, setF] = useState<FormState>(initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));
  const partners = f.program_type ? PARTNER_UNIVERSITIES[f.program_type] : [];
  const updateEdu = (i: number, patch: Partial<EduEntry>) => setF((p) => ({ ...p, educations: p.educations.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));
  const addEdu = () => setF((p) => ({ ...p, educations: [...p.educations, blankEdu()] }));
  const removeEdu = (i: number) => setF((p) => ({ ...p, educations: p.educations.filter((_, idx) => idx !== i) }));
  const updateJob = (i: number, patch: Partial<JobEntry>) => setF((p) => ({ ...p, jobs: p.jobs.map((j, idx) => idx === i ? { ...j, ...patch } : j) }));
  const addJob = () => setF((p) => ({ ...p, jobs: [...p.jobs, blankJob(false)] }));
  const removeJob = (i: number) => setF((p) => ({ ...p, jobs: p.jobs.filter((_, idx) => idx !== i) }));

  const onAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(file ? URL.createObjectURL(file) : "");
  };

  const validateStep = () => {
    if (step === 1) return f.first_name && f.last_name && f.gender && f.date_of_birth && f.nationality && !!avatarFile;
    if (step === 2) return f.email && f.password.length >= 8 && f.country && f.phone.trim();
    if (step === 3) {
      if (!f.student_id.trim() || !f.program_type || !f.major || !f.generation || !f.graduation_year || !f.admission_year) return false;
      if (f.program_type !== "TEPE" && (!f.partner_university || !f.partner_degree || !f.partner_major.trim())) return false;
      return true;
    }
    if (step === 4) return !!(f.professional_summary.trim() && f.skills.trim() && f.expertise.trim() && f.research_interests.trim() && f.certifications.trim());
    if (step === 5) return f.jobs.every((j) => (!j.company && !j.position) || (!!j.company && !!j.position));
    if (step === 7) return f.c_data && f.c_directory;
    return true;
  };

  const next = () => {
    if (!validateStep()) return toast.error("Please complete all required fields.");
    setStep((s) => s + 1);
  };

  const googleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      try { localStorage.setItem("tep-gate", "1"); } catch {}
      navigate({ to: "/directory", replace: true });
    }, 500);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return toast.error("Missing required consents.");
    if (!avatarFile) return toast.error("Profile picture is required.");
    setLoading(true);
    // UI-only: no backend. Persist locally so a mock "profile" exists this session.
    try {
      localStorage.setItem("tep-gate", "1");
      localStorage.setItem("tep-registration-preview", JSON.stringify({ ...f, submitted_at: new Date().toISOString() }));
    } catch {}
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created — welcome to TEP-TEPE!");
      navigate({ to: "/directory", replace: true });
    }, 500);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="p-8">
          <div className="mb-6 flex flex-col items-center">
            <img src={logoAsset.url} alt="TEP-TEPE" className="mb-4 h-16 w-auto" />
            <div className="flex w-full items-baseline justify-between">
              <h1 className="font-display text-3xl font-bold">Join TEP-TEPE</h1>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <Progress value={(step / TOTAL_STEPS) * 100} className="mt-3 w-full" />
          </div>

          {step === 1 && (
            <div className="mb-6 space-y-2">
              <Button type="button" variant="outline" className="w-full" onClick={googleSignIn} disabled={loading}>
                Continue with Google
              </Button>
              <div className="relative my-2 text-center text-xs text-muted-foreground">
                <span className="relative z-10 bg-card px-2">or fill in the form below</span>
                <span className="absolute left-0 right-0 top-1/2 -z-0 border-t" />
              </div>
            </div>
          )}

          <form onSubmit={step === TOTAL_STEPS ? submit : (e) => { e.preventDefault(); next(); }} className="space-y-4">

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
                <Grid2>
                  <Field label="First name *"><Input value={f.first_name} onChange={(e) => set("first_name", e.target.value)} required /></Field>
                  <Field label="Last name *"><Input value={f.last_name} onChange={(e) => set("last_name", e.target.value)} required /></Field>
                </Grid2>
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
                <Grid2>
                  <Field label="Email *"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} required /></Field>
                  <Field label="Password *" hint="At least 8 characters"><Input type="password" minLength={8} value={f.password} onChange={(e) => set("password", e.target.value)} required /></Field>
                </Grid2>
                <Field label="Phone *"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} required /></Field>
                <Field label="Address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
                <Grid2>
                  <Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
                  <Field label="Province / State"><Input value={f.province} onChange={(e) => set("province", e.target.value)} /></Field>
                </Grid2>
                <Field label="Country *"><Input value={f.country} onChange={(e) => set("country", e.target.value)} required /></Field>
                <div className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">Social (optional)</div>
                <Grid2>
                  <Field label="LinkedIn"><Input value={f.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
                  <Field label="Facebook"><Input value={f.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} /></Field>
                </Grid2>
                <Grid2>
                  <Field label="Instagram"><Input value={f.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} /></Field>
                  <Field label="Website"><Input value={f.personal_website} onChange={(e) => set("personal_website", e.target.value)} /></Field>
                </Grid2>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display text-lg font-semibold">Program information</h2>
                <Grid2>
                  <Field label="Student ID *"><Input value={f.student_id} onChange={(e) => set("student_id", e.target.value)} required /></Field>
                  <Field label="Generation *">
                    <Select value={f.generation} onValueChange={(v) => set("generation", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{GENERATIONS.map((g) => <SelectItem key={g} value={String(g)}>#{g} — {generationStatus(g)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </Grid2>
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
                  <>
                    <Grid2>
                      <Field label="Partner university *">
                        <Select value={f.partner_university} onValueChange={(v) => set("partner_university", v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{partners.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </Field>
                      <Field label="Partner degree level *">
                        <Select value={f.partner_degree} onValueChange={(v) => set("partner_degree", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                            <SelectItem value="master">Master's Degree</SelectItem>
                            <SelectItem value="phd">Doctoral Degree (PhD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </Grid2>
                    <Field label="Partner degree program / major *" hint="e.g. Electronics Engineering at KU Leuven (may differ from your Thammasat major)">
                      <Input value={f.partner_major} onChange={(e) => set("partner_major", e.target.value)} required />
                    </Field>
                  </>
                )}
                <Grid2>
                  <Field label="Admission year *"><Input type="number" min={1995} max={2030} value={f.admission_year} onChange={(e) => set("admission_year", e.target.value)} required /></Field>
                  <Field label="Graduation year *"><Input type="number" min={1999} max={2035} value={f.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} required /></Field>
                </Grid2>
                <Field label="Honors (e.g. First Class, Second Class Upper)"><Input value={f.honors} onChange={(e) => set("honors", e.target.value)} /></Field>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">Education History — Part 1 (auto-generated)</div>
                  {f.program_type === "TEPE" && <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>}
                  {f.program_type === "TEP" && (<>
                    <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>
                    <div>• {degreeLabel(f.partner_degree)} — {f.partner_university || "Partner University"}</div>
                  </>)}
                  {f.program_type === "TEPE+" && (<>
                    <div>• Bachelor's Degree — Thammasat University ({f.major || "major"}{f.graduation_year ? `, ${f.graduation_year}` : ""}{f.honors ? `, ${f.honors}` : ""})</div>
                    <div>• {degreeLabel(f.partner_degree)} — {f.partner_university || "Partner University"}</div>
                  </>)}
                  <div className="pt-1">These records cannot be deleted. You can add additional education in the next steps.</div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-display text-lg font-semibold">Professional profile</h2>
                <Field label="Professional summary *"><Textarea rows={4} value={f.professional_summary} onChange={(e) => set("professional_summary", e.target.value)} required /></Field>
                <Grid2>
                  <Field label="Skills (comma separated) *"><Input value={f.skills} onChange={(e) => set("skills", e.target.value)} required /></Field>
                  <Field label="Expertise (comma separated) *"><Input value={f.expertise} onChange={(e) => set("expertise", e.target.value)} required /></Field>
                  <Field label="Research interests *"><Input value={f.research_interests} onChange={(e) => set("research_interests", e.target.value)} required /></Field>
                  <Field label="Certifications *"><Input value={f.certifications} onChange={(e) => set("certifications", e.target.value)} required /></Field>
                </Grid2>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="font-display text-lg font-semibold">Professional record</h2>
                <p className="text-xs text-muted-foreground">List all your jobs, most recent first. Leave empty if you have no work experience yet.</p>
                {f.jobs.map((j, i) => (
                  <div key={i} className="space-y-3 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Job {i + 1}</span>
                      {f.jobs.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeJob(i)}>Remove</Button>
                      )}
                    </div>
                    <Grid2>
                      <Field label="Company"><Input value={j.company} onChange={(e) => updateJob(i, { company: e.target.value })} /></Field>
                      <Field label="Position"><Input value={j.position} onChange={(e) => updateJob(i, { position: e.target.value })} /></Field>
                      <Field label="Business type"><Input value={j.business_type} onChange={(e) => updateJob(i, { business_type: e.target.value })} /></Field>
                      <Field label="Industry"><Input value={j.industry} onChange={(e) => updateJob(i, { industry: e.target.value })} /></Field>
                      <Field label="City"><Input value={j.city} onChange={(e) => updateJob(i, { city: e.target.value })} /></Field>
                      <Field label="Country"><Input value={j.country} onChange={(e) => updateJob(i, { country: e.target.value })} /></Field>
                      <Field label="Start year"><Input type="number" value={j.start_year} onChange={(e) => updateJob(i, { start_year: e.target.value })} /></Field>
                      {!j.is_current && <Field label="End year"><Input type="number" value={j.end_year} onChange={(e) => updateJob(i, { end_year: e.target.value })} /></Field>}
                    </Grid2>
                    <CheckRow checked={j.is_current} onChange={(v) => updateJob(i, { is_current: v })} label="This is my current role" />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addJob}>+ Add another job</Button>


                <h2 className="pt-4 font-display text-lg font-semibold">Additional education</h2>
                <p className="text-xs text-muted-foreground">Add high school, additional degrees, or certifications. You can add as many as you like.</p>
                {f.educations.map((e, i) => {
                  const cert = e.level === "certification";
                  const hs = e.level === "high_school";
                  return (
                    <div key={i} className="space-y-3 rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Entry {i + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeEdu(i)}>Remove</Button>
                      </div>
                      <Field label="Type"><Select value={e.level} onValueChange={(v) => updateEdu(i, { level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high_school">High School</SelectItem><SelectItem value="bachelor">Bachelor's Degree</SelectItem><SelectItem value="master">Master's Degree</SelectItem><SelectItem value="phd">Doctoral Degree (PhD)</SelectItem><SelectItem value="certification">Professional Certification</SelectItem></SelectContent></Select></Field>
                      <Grid2>
                        <Field label={cert ? "Certification name" : hs ? "School name" : "University"}><Input value={e.institution} onChange={(ev) => updateEdu(i, { institution: ev.target.value })} /></Field>
                        {cert && <Field label="Issuing organization"><Input value={e.organization} onChange={(ev) => updateEdu(i, { organization: ev.target.value })} /></Field>}
                        {!cert && !hs && <Field label="Major"><Input value={e.major} onChange={(ev) => updateEdu(i, { major: ev.target.value })} /></Field>}
                        {!cert && <Field label="Country"><Input value={e.country} onChange={(ev) => updateEdu(i, { country: ev.target.value })} /></Field>}
                        <Field label={cert ? "Year awarded" : "Graduation year"}><Input type="number" value={e.year} onChange={(ev) => updateEdu(i, { year: ev.target.value })} /></Field>
                        {!cert && !hs && <Field label="Honors"><Input value={e.honors} onChange={(ev) => updateEdu(i, { honors: ev.target.value })} /></Field>}
                      </Grid2>
                    </div>
                  );
                })}
                <Button type="button" variant="outline" size="sm" onClick={addEdu}>+ Add education entry</Button>
              </>
            )}

            {step === 6 && (
              <>
                <h2 className="font-display text-lg font-semibold">Mentorship availability</h2>
                <CheckRow checked={f.mentor_available} onChange={(v) => { set("mentor_available", v); if (v) set("c_mentor", true); }} label="Available as a mentor" />
                {f.mentor_available && (
                  <Grid2>
                    <Field label="Hours per month"><Input type="number" value={f.mentor_hours} onChange={(e) => set("mentor_hours", e.target.value)} /></Field>
                    <Field label="Preferred contact method"><Input value={f.mentor_contact} onChange={(e) => set("mentor_contact", e.target.value)} /></Field>
                    <Field label="Mentorship areas"><Input value={f.mentor_areas} onChange={(e) => set("mentor_areas", e.target.value)} /></Field>
                    <Field label="Industry expertise"><Input value={f.mentor_industry} onChange={(e) => set("mentor_industry", e.target.value)} /></Field>
                  </Grid2>
                )}
              </>
            )}

            {step === 7 && (
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
              <Button type="submit" disabled={loading}>{step === TOTAL_STEPS ? (loading ? "Creating…" : "Create account") : "Continue"}</Button>
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
function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 text-sm hover:bg-muted/40"><Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />{label}</label>;
}
function ConsentRow({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border p-4 cursor-pointer hover:bg-muted/40">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-1" />
      <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
    </label>
  );
}
function degreeLabel(v: string) {
  if (v === "master") return "Master's Degree";
  if (v === "phd") return "Doctoral Degree (PhD)";
  return "Bachelor's Degree";
}
