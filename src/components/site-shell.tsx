import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logoAsset from "@/assets/tep-tepe-logo-v2.png.asset.json";

// Routes where the navbar should be hidden to focus the onboarding flow.
const ONBOARDING_PATHS = ["/register", "/complete-profile"];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (ONBOARDING_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <SiteHeaderInner />;
}

function SiteHeaderInner() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  const links: Array<{ to: string; label: string }> = user
    ? [
        { to: "/directory", label: "Directory" },
        { to: "/internships", label: "Opportunities" },
        { to: "/events", label: "Events" },
        { to: "/stories", label: "Stories" },
      ]
    : [
        { to: "/", label: "Home" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-8">
        {/* Left: logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset} alt="TEP-TEPE" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Center: nav */}
        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              preload="intent"
              className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted border-border" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: auth actions (reserve width to avoid jitter) */}
        <div className="hidden items-center justify-end gap-2 lg:flex">
          {loading ? (
            <div className="h-9 w-40" />
          ) : user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile">My Profile</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <button className="justify-self-end p-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  My Profile
                </Link>
                <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>© {new Date().getFullYear()} TEP-TEPE Engineering, Thammasat University.</div>
        <div className="flex gap-5">
          <span>Bridging Thai and international engineers</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
