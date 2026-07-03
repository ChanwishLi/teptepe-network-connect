import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logoAsset from "@/assets/tep-tepe-logo.png.asset.json";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Hide chrome inside the hidden admin area
  if (pathname.startsWith("/admin-tep2026")) return null;

  const links: Array<{ to: string; label: string }> = [
    { to: "/directory", label: "Directory" },
    { to: "/events", label: "Events" },
    { to: "/stories", label: "Stories" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="TEP-TEPE" className="h-10 w-auto" />
          </Link>
        </div>
        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              preload="intent"
              className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted border-border" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block" />
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
        <div className="flex gap-5"><span>Bridging Thai and international engineers</span></div>
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
