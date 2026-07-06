import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/tep-tepe-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TEP-TEPE Alumni Network" },
      { name: "description", content: "Sign in to the TEP-TEPE Alumni Network." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleGoogle() {
    setLoading(true);
    // UI-only: fake a brief sign-in, then unlock the site.
    setTimeout(() => {
      try {
        localStorage.setItem("tep-gate", "1");
      } catch {}
      router.navigate({ to: "/" });
    }, 600);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/15),transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logoAsset.url} alt="TEP-TEPE" className="h-14 w-auto" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to access the TEP-TEPE Alumni Network
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            variant="outline"
            className="h-11 w-full gap-3 text-sm font-medium"
          >
            <GoogleIcon />
            {loading ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Members only</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Access is limited to TEP-TEPE alumni, students, and faculty. By continuing you agree to
            the network's community guidelines.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TEP-TEPE Engineering, Thammasat University
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.79 3.15 14.63 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 12s4.1 9.8 9.2 9.8c5.31 0 8.82-3.73 8.82-8.98 0-.6-.06-1.06-.14-1.62H12z"
      />
      <path
        fill="#4285F4"
        d="M21.68 12.82c0-.6-.06-1.06-.14-1.62H12v3.9h5.5c-.11.64-.72 1.94-2.07 2.81l3.33 2.58c1.94-1.79 2.92-4.44 2.92-7.67z"
      />
      <path
        fill="#FBBC05"
        d="M5.62 14.29A6.19 6.19 0 0 1 5.3 12c0-.8.14-1.57.38-2.29L2.3 7.09A9.79 9.79 0 0 0 1.2 12c0 1.58.38 3.08 1.1 4.41l3.32-2.12z"
      />
      <path
        fill="#34A853"
        d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.33-2.58c-.89.62-2.08 1.05-3.12 1.05-2.4 0-4.44-1.62-5.17-3.8L3.5 16.23A9.8 9.8 0 0 0 12 21.8z"
      />
    </svg>
  );
}
