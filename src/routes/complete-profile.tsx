import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CONSENT_VERSION, GENERATIONS, MAJORS, PARTNER_UNIVERSITIES, PROGRAM_TYPES, generationStatus, type ProgramType } from "@/lib/constants";
import logoAsset from "@/assets/tep-tepe-logo.png.asset.json";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({ meta: [{ title: "Complete your profile — TEP-TEPE" }] }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [hasAvatar, setHasAvatar] = useState(false);
  const [f, setF] = useState<any>({
    first_name: "", last_name: "", preferred_name: "", gender: "", date_of_birth: "", nationality: "",
    phone: "", address: "", city: "", province: "", country: "",
    facebook_url: "", instagram_url: "", linkedin_url: "", personal_website: "",
    student_id: "", program_type: "" as ProgramType | "", major: "", admission_year: "", graduation_year: "",
    generation: "", partner_university: "", partner_degree: "bachelor", honors: "",
    professional_summary: "", skills: "", expertise: "", research_interests: "", certifications: "",
    company: "", position: "", business_type: "", industry: "", work_city: "", work_country: "", start_year: "", end_year: "", is_current: true,
    edu_level: "high_school", edu_institution: "", edu_major: "", edu_country: "", edu_year: "", edu_organization: "", edu_honors: "",
    mentor_available: false, mentor_hours: "", mentor_contact: "", mentor_areas: "", mentor_industry: "",
    c_data: false, c_directory: false, c_comms: false, c_mentor: false,
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  // Prefill from existing profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!data) return;
      setF((prev: any) => ({
        ...prev,
        first_name: data.first_name || prev.first_name,
        last_name: data.last_name || prev.last_name,
        preferred_name: data.preferred_name || "",
        gender: data.gender || "",
        date_of_birth: data.date_of_birth || "",
        nationality: data.nationality || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        province: data.province || "",
        country: data.country || "",
        facebook_url: data.facebook_url || "",
        instagram_url: data.instagram_url || "",
        linkedin_url: data.linkedin_url || "",
        personal_website: data.personal_website || "",
        student_id: data.student_id || "",
        program_type: data.program_type || "",
        major: data.major || "",
        admission_year: data.admission_year ?? "",
        graduation_year: data.graduation_year ?? "",
        generation: data.generation ?? "",
        partner_university: data.partner_university || "",
        professional_summary: data.professional_summary || "",
        skills: csv(data.skills),
        expertise: csv(data.expertise),
        research_interests: csv(data.research_interests),
        certifications: csv(data.certifications),
      }));
      setHasAvatar(!!data.avatar_url);
      if (data.profile_complete) navigate({ to: "/directory", replace: true });
    })();
  }, [user, navigate]);

  const onAvatar = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(file ? URL.createObjectURL(file) : "");
  };

  const validStep1 = !!(f.first_name && f.last_name && f.gender && f.date_of_birth && f.nationality && (avatarFile || hasAvatar));
  const validStep2 = !!(f.country);
  const validStep3 = !!(f.program_type && f.major && f.generation && f.admission_year && f.graduation_year && (f.program_type === "TEPE" || (f.partner_university && f.partner_degree)));
  const validStep5 = !(f.company || f.position) || !!(f.company && f.position);
  const validStep6 = !!(f.c_data && f.c_directory);
  const isCert = f.edu_level === "certification";
  const isHs = f.edu_level === "high_school";

  const canContinue = () => {
    if (step === 1) return validStep1;
    if (step === 2) return validStep2;
    if (step === 3) return validStep3;
    if (step === 5) return validStep5;
    if (step === 6) return validStep6;
    return true;
  };

  const submit = async () => {
    if (!validStep1 || !validStep2 || !validStep3 || !validStep5 || !validStep6) return toast.error("Please complete all required fields.");
    setBusy(true);
    try {
      let avatar_url: string | undefined;
      if (avatarFile) {
        const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${user!.id}/avatar-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (up.error) throw up.error;
        avatar_url = path;
      }
      const update: any = {
        first_name: f.first_name, last_name: f.last_name, preferred_name: f.preferred_name || null,
        gender: f.gender || null, date_of_birth: f.date_of_birth || null, nationality: f.nationality || null,
        phone: f.phone || null, address: f.address || null, city: f.city || null, province: f.province || null, country: f.country || null,
        facebook_url: f.facebook_url || null, instagram_url: f.instagram_url || null, linkedin_url: f.linkedin_url || null, personal_website: f.personal_website || null,
        student_id: f.student_id || null,
        program_type: f.program_type, major: f.major,
        admission_year: Number(f.admission_year), graduation_year: Number(f.graduation_year),
        generation: Number(f.generation),
        partner_university: f.program_type === "TEPE" ? null : f.partner_university,
        professional_summary: f.professional_summary || null,
        skills: parseCsv(f.skills), expertise: parseCsv(f.expertise), research_interests: parseCsv(f.research_interests), certifications: parseCsv(f.certifications),
        profile_complete: true,
      };
      if (avatar_url) update.avatar_url = avatar_url;
      const { error } = await supabase.from("profiles").update(update).eq("id", user!.id);
      if (error) throw error;

      const { data: mandatory } = await supabase.from("education_records").select("id").eq("user_id", user!.id).eq("is_mandatory", true).limit(1);
      if (!mandatory?.length) {
        const mandatoryRows: any[] = [{ user_id: user!.id, level: "bachelor", institution: "Thammasat University", major: f.major, country: "Thailand", graduation_year: Number(f.graduation_year), honors: f.honors || null, is_mandatory: true }];
        if (f.program_type !== "TEPE") mandatoryRows.push({ user_id: user!.id, level: f.partner_degree, institution: f.partner_university, major: f.major, graduation_year: Number(f.graduation_year), is_mandatory: true });
        const { error: eduErr } = await supabase.from("education_records").insert(mandatoryRows);
        if (eduErr) throw eduErr;
      }

      if (f.edu_institution) {
        const edu: any = { user_id: user!.id, level: f.edu_level, institution: f.edu_institution, is_mandatory: false };
        if (isCert) { edu.organization = f.edu_organization || f.edu_institution; edu.year_awarded = f.edu_year ? Number(f.edu_year) : null; }
        else { edu.major = isHs ? null : f.edu_major || null; edu.country = f.edu_country || null; edu.graduation_year = f.edu_year ? Number(f.edu_year) : null; edu.honors = f.edu_honors || null; }
        const { error: extraEduErr } = await supabase.from("education_records").insert(edu);
        if (extraEduErr) throw extraEduErr;
      }

      if (f.company && f.position) {
        const { error: empErr } = await supabase.from("employment_records").insert({
          user_id: user!.id, company: f.company, position: f.position,
          business_type: f.business_type || null, industry: f.industry || null,
          city: f.work_city || null, country: f.work_country || null,
          start_year: f.start_year ? Number(f.start_year) : null, end_year: f.is_current ? null : (f.end_year ? Number(f.end_year) : null),
          is_current: !!f.is_current,
        });
        if (empErr) throw empErr;
      }

      const { error: mentorErr } = await supabase.from("mentorship_settings").upsert({
        user_id: user!.id,
        available_as_mentor: !!f.mentor_available,
        hours_per_month: f.mentor_hours ? Number(f.mentor_hours) : null,
        preferred_contact_method: f.mentor_contact || null,
        mentorship_areas: parseCsv(f.mentor_areas),
        industry_expertise: parseCsv(f.mentor_industry),
      }, { onConflict: "user_id" });
      if (mentorErr) throw mentorErr;

      const { error: consentErr } = await supabase.from("consent_records").insert({
        user_id: user!.id, consent_version: CONSENT_VERSION,
        data_collection: f.c_data, directory_participation: f.c_directory,
        communications: f.c_comms, mentorship_matching: f.c_mentor,
      });
      if (consentErr) throw consentErr;

      toast.success("Profile complete! Awaiting admin approval.");
      navigate({ to: "/directory", replace: true });
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  const partners = f.program_type ? PARTNER_UNIVERSITIES[f.program_type as ProgramType] ?? [] : [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <img src={logoAsset.url} alt="TEP-TEPE" className="h-9 w-auto" />
          <span className="ml-3 text-sm text-muted-foreground">Complete your profile</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-8">
          <div className="mb-6">
            <div className="flex items-baseline justify-between">
              <h1 className="font-display text-2xl font-semibold">Welcome to TEP-TEPE</h1>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of 6</span>
            </div>
            <Progress value={(step / 6) * 100} className="mt-3" />
            <p className="mt-3 text-sm text-muted-foreground">Complete the same registration details as email signup, without re-entering Gmail or a password.</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Profile picture *</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">{hasAvatar ? "Set" : "No photo"}</div>}
                  </div>
                  <Input type="file" accept="image/*" onChange={(e) => onAvatar(e.target.files?.[0] ?? null)} className="max-w-xs" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>First name *</Label><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></div>
                <div><Label>Last name *</Label><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
                <div><Label>Preferred name</Label><Input value={f.preferred_name} onChange={(e) => setF({ ...f, preferred_name: e.target.value })} /></div>
                <div><Label>Nationality *</Label><Input value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })} /></div>
                <div><Label>Gender *</Label><Select value={f.gender} onValueChange={(v) => setF({ ...f, gender: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Male", "Female", "Non-binary", "Prefer not to say"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Date of birth *</Label><Input type="date" value={f.date_of_birth} onChange={(e) => setF({ ...f, date_of_birth: e.target.value })} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Contact information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
                <div><Label>Country *</Label><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
                <div><Label>City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
                <div><Label>Province / State</Label><Input value={f.province} onChange={(e) => setF({ ...f, province: e.target.value })} /></div>
                <div><Label>LinkedIn</Label><Input value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} /></div>
                <div><Label>Facebook</Label><Input value={f.facebook_url} onChange={(e) => setF({ ...f, facebook_url: e.target.value })} /></div>
                <div><Label>Instagram</Label><Input value={f.instagram_url} onChange={(e) => setF({ ...f, instagram_url: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={f.personal_website} onChange={(e) => setF({ ...f, personal_website: e.target.value })} /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Program *</Label>
                <Select value={f.program_type} onValueChange={(v) => setF({ ...f, program_type: v as ProgramType, partner_university: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PROGRAM_TYPES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Major *</Label>
                <Select value={f.major} onValueChange={(v) => setF({ ...f, major: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MAJORS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {f.program_type && f.program_type !== "TEPE" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Partner university *</Label><Select value={f.partner_university} onValueChange={(v) => setF({ ...f, partner_university: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{partners.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Partner university degree *</Label><Select value={f.partner_degree} onValueChange={(v) => setF({ ...f, partner_degree: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bachelor">Bachelor's Degree</SelectItem><SelectItem value="master">Master's Degree</SelectItem><SelectItem value="phd">Doctoral Degree (PhD)</SelectItem></SelectContent></Select></div>
                </div>
              )}
              <div>
                <Label>Generation *</Label>
                <Select value={String(f.generation)} onValueChange={(v) => setF({ ...f, generation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENERATIONS.map((g) => <SelectItem key={g} value={String(g)}>#{g} — {generationStatus(g)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Student ID</Label><Input value={f.student_id} onChange={(e) => setF({ ...f, student_id: e.target.value })} /></div>
                <div><Label>Honors</Label><Input value={f.honors} onChange={(e) => setF({ ...f, honors: e.target.value })} /></div>
                <div><Label>Admission year *</Label><Input type="number" value={f.admission_year} onChange={(e) => setF({ ...f, admission_year: e.target.value })} /></div>
                <div><Label>Graduation year *</Label><Input type="number" value={f.graduation_year} onChange={(e) => setF({ ...f, graduation_year: e.target.value })} /></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Professional profile</h2>
              <div><Label>Professional summary</Label><Textarea rows={4} value={f.professional_summary} onChange={(e) => setF({ ...f, professional_summary: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Skills (comma separated)" value={f.skills} onChange={(v) => setF({ ...f, skills: v })} />
                <Field label="Expertise (comma separated)" value={f.expertise} onChange={(v) => setF({ ...f, expertise: v })} />
                <Field label="Research interests" value={f.research_interests} onChange={(v) => setF({ ...f, research_interests: v })} />
                <Field label="Certifications" value={f.certifications} onChange={(v) => setF({ ...f, certifications: v })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold">Professional record</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company" value={f.company} onChange={(v) => setF({ ...f, company: v })} />
                  <Field label="Position" value={f.position} onChange={(v) => setF({ ...f, position: v })} />
                  <Field label="Business type" value={f.business_type} onChange={(v) => setF({ ...f, business_type: v })} />
                  <Field label="Industry" value={f.industry} onChange={(v) => setF({ ...f, industry: v })} />
                  <Field label="City" value={f.work_city} onChange={(v) => setF({ ...f, work_city: v })} />
                  <Field label="Country" value={f.work_country} onChange={(v) => setF({ ...f, work_country: v })} />
                  <Field label="Start year" value={f.start_year} onChange={(v) => setF({ ...f, start_year: v })} />
                  {!f.is_current && <Field label="End year" value={f.end_year} onChange={(v) => setF({ ...f, end_year: v })} />}
                </div>
                <CheckRow checked={f.is_current} onChange={(v) => setF({ ...f, is_current: v })} label="This is my current role" />
              </div>

              <div className="space-y-4 border-t pt-5">
                <h2 className="font-display text-lg font-semibold">Additional education</h2>
                <div><Label>Type</Label><Select value={f.edu_level} onValueChange={(v) => setF({ ...f, edu_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high_school">High School</SelectItem><SelectItem value="bachelor">Bachelor's Degree</SelectItem><SelectItem value="master">Master's Degree</SelectItem><SelectItem value="phd">Doctoral Degree (PhD)</SelectItem><SelectItem value="certification">Professional Certification</SelectItem></SelectContent></Select></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={isCert ? "Certification name" : isHs ? "School name" : "University"} value={f.edu_institution} onChange={(v) => setF({ ...f, edu_institution: v })} />
                  {isCert && <Field label="Issuing organization" value={f.edu_organization} onChange={(v) => setF({ ...f, edu_organization: v })} />}
                  {!isCert && !isHs && <Field label="Major" value={f.edu_major} onChange={(v) => setF({ ...f, edu_major: v })} />}
                  {!isCert && <Field label="Country" value={f.edu_country} onChange={(v) => setF({ ...f, edu_country: v })} />}
                  <Field label={isCert ? "Year awarded" : "Graduation year"} value={f.edu_year} onChange={(v) => setF({ ...f, edu_year: v })} />
                  {!isCert && !isHs && <Field label="Honors" value={f.edu_honors} onChange={(v) => setF({ ...f, edu_honors: v })} />}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold">Mentorship availability</h2>
              <CheckRow checked={f.mentor_available} onChange={(v) => setF({ ...f, mentor_available: v, c_mentor: v ? true : f.c_mentor })} label="Available as a mentor" />
              {f.mentor_available && <div className="grid gap-4 sm:grid-cols-2"><Field label="Hours per month" value={f.mentor_hours} onChange={(v) => setF({ ...f, mentor_hours: v })} /><Field label="Preferred contact method" value={f.mentor_contact} onChange={(v) => setF({ ...f, mentor_contact: v })} /><Field label="Mentorship areas" value={f.mentor_areas} onChange={(v) => setF({ ...f, mentor_areas: v })} /><Field label="Industry expertise" value={f.mentor_industry} onChange={(v) => setF({ ...f, mentor_industry: v })} /></div>}

              <div className="space-y-3 border-t pt-5">
                <h2 className="font-display text-lg font-semibold">PDPA consent</h2>
                <CheckRow checked={f.c_data} onChange={(v) => setF({ ...f, c_data: v })} label="Personal data collection (required)" />
                <CheckRow checked={f.c_directory} onChange={(v) => setF({ ...f, c_directory: v })} label="Alumni directory participation (required)" />
                <CheckRow checked={f.c_comms} onChange={(v) => setF({ ...f, c_comms: v })} label="Alumni communications" />
                <CheckRow checked={f.c_mentor} onChange={(v) => setF({ ...f, c_mentor: v })} label="Mentorship matching" />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1
              ? <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
              : <span />}
            {step < 6
              ? <Button onClick={() => { if (!canContinue()) return toast.error("Please complete required fields."); setStep((s) => s + 1); }}>Continue</Button>
              : <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Finish and enter directory"}</Button>}
          </div>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return <div><Label>{label}</Label><Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm"><Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />{label}</label>;
}

function csv(arr: any) { return Array.isArray(arr) ? arr.join(", ") : (typeof arr === "string" ? arr : ""); }
function parseCsv(v: any): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}
