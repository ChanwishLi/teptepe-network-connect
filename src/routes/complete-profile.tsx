import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MAJORS, PROGRAM_TYPES, PARTNER_UNIVERSITIES, GENERATIONS, generationStatus, type ProgramType } from "@/lib/constants";
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
    first_name: "", last_name: "", phone: "", country: "",
    program_type: "" as ProgramType | "", major: "", admission_year: "", graduation_year: "",
    generation: "", partner_university: "",
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
        phone: data.phone || "",
        country: data.country || "",
        program_type: data.program_type || "",
        major: data.major || "",
        admission_year: data.admission_year ?? "",
        graduation_year: data.graduation_year ?? "",
        generation: data.generation ?? "",
        partner_university: data.partner_university || "",
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

  const validStep1 = !!(f.first_name && f.last_name && (avatarFile || hasAvatar));
  const validStep2 = !!(f.program_type && f.major && f.generation && f.admission_year && f.graduation_year && (f.program_type === "TEPE" || f.partner_university));

  const submit = async () => {
    if (!validStep1 || !validStep2) return toast.error("Please complete all required fields.");
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
        first_name: f.first_name, last_name: f.last_name, phone: f.phone || null, country: f.country || null,
        program_type: f.program_type, major: f.major,
        admission_year: Number(f.admission_year), graduation_year: Number(f.graduation_year),
        generation: Number(f.generation),
        partner_university: f.program_type === "TEPE" ? null : f.partner_university,
        profile_complete: true,
      };
      if (avatar_url) update.avatar_url = avatar_url;
      const { error } = await supabase.from("profiles").update(update).eq("id", user!.id);
      if (error) throw error;
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
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of 2</span>
            </div>
            <Progress value={(step / 2) * 100} className="mt-3" />
            <p className="mt-3 text-sm text-muted-foreground">A few details to finish setting up your account. Required before your profile becomes visible.</p>
          </div>

          {step === 1 ? (
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
                <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
                <div><Label>Country</Label><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></div>
              </div>
            </div>
          ) : (
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
                <div>
                  <Label>Partner university *</Label>
                  <Select value={f.partner_university} onValueChange={(v) => setF({ ...f, partner_university: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{partners.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
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
                <div><Label>Admission year *</Label><Input type="number" value={f.admission_year} onChange={(e) => setF({ ...f, admission_year: e.target.value })} /></div>
                <div><Label>Graduation year *</Label><Input type="number" value={f.graduation_year} onChange={(e) => setF({ ...f, graduation_year: e.target.value })} /></div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1
              ? <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              : <span />}
            {step === 1
              ? <Button onClick={() => { if (!validStep1) return toast.error("Please complete required fields."); setStep(2); }}>Continue</Button>
              : <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Finish and enter directory"}</Button>}
          </div>
        </Card>
      </main>
    </div>
  );
}
