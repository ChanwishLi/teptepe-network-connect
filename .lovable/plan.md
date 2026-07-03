## Goal

Rip out all Supabase/backend code and rebuild the site as a static, CSV-driven alumni network. Remove Internships entirely. Add a hidden admin page at `/admin-tep2026` for CSV upload and content management. Photos come from Google Drive links in the CSV.

## Yes, I understand the CSV

Your Google Form CSV columns (I'll map these to the site):

- **Identity**: First Name, Last Name, Preferred Name, Gender, DOB, Nationality
- **Photo**: Google Drive link (I'll auto-convert `open?id=XXX` → `https://drive.google.com/uc?export=view&id=XXX` so browsers can render it)
- **Contact**: Email, Phone, Address, Province/State, Country, LinkedIn, Facebook, Instagram, Website, Other
- **TU info**: Student ID, Generation, Program Type (TEP/TEPE/TEPE+), Major at Thammasat, Admission Year, Graduation Year, Honors
- **Partner uni (Bachelor's)**: Partner University, Partner Degree Major, Admission Year, Graduation Year, Honors
- **Additional degrees**: fields for additional Bachelor's / Master's / PhD, Partner University Master's
- **Pre-uni**: High School + GPAX, Middle School + GPAX
- **Professional**: Summary, Skills (comma-sep), Expertise (comma-sep), Research Interests, Certifications
- **Jobs (up to 3)**: Company, Position, Business type, Industry, City, Country, Start/End years
- **Preferences**: Availability as Mentor, Consent, Directory Participation

Notes I spotted in your sample row:
- Contact fields are all `"E"` — placeholder test data, that's fine, real submissions will fill them.
- "Additional Bachelors/Masters/PhD" are single freeform text columns — I'll display them as-is rather than parsed structured records.
- Directory participation flag will control whether the profile shows in the public directory.

## What gets removed

**All Supabase code:**
- `src/integrations/supabase/` (entire folder)
- `src/integrations/lovable/` (Lovable auth broker — Supabase-based)
- `src/lib/auth-context.tsx`
- `src/routes/login.tsx`, `register.tsx`, `reset-password.tsx`, `complete-profile.tsx`, `profile.tsx`
- `src/routes/admin.tsx` (replaced by new hidden admin)
- All Supabase migrations stay in `supabase/` folder but are dead code (safe to leave, won't run)
- `.env` Supabase vars removed
- `src/start.ts` middleware simplified
- `attachSupabaseAuth` removed from start config

**All Internships:**
- `src/routes/internships.tsx`, `internships.index.tsx`, `internships.new.tsx`
- `src/routes/opportunities.new.tsx`
- `src/components/opportunity-post-form.tsx`
- Nav links to internships (in `site-shell.tsx`)

**Auth-dependent features on remaining pages:**
- Events RSVP → becomes read-only listing
- Story likes/comments → read-only display
- Directory "connect with" buttons → removed; directory becomes browsable-only
- Anywhere that reads `useAuth()` → replaced with static/admin-check equivalent

## What gets built

### 1. Data layer (JSON files, no backend)
- `src/data/alumni.json` — array of alumni records (starts empty)
- `src/data/events.json` — array of events (starts with any existing seed you want)
- `src/data/stories.json` — array of success stories (starts empty)
- All pages read from these JSON files via simple imports (bundled at build).

### 2. Hidden admin page: `/admin-tep2026`
- Password-gated (single admin password, stored as `ADMIN_PASSWORD` secret). Login via a `createServerFn` that sets an encrypted session cookie (`useSession`) — this is the only server code left, and it uses TanStack's built-in session runtime, NOT Supabase.
- Session lasts 7 days.
- Not linked from anywhere. No route metadata. Not in sitemap.
- Tabs inside admin:
  - **Import CSV** — upload the Google Form CSV, preview parsed rows, click "Merge into alumni.json". Downloads updated JSON file for you to commit to GitHub. (Since we're not using a backend DB, edits produce a downloaded JSON you replace in the repo — simplest possible flow.)
  - **Manage Alumni** — list all alumni, toggle visibility (hide from directory without deleting), delete. Same "download updated JSON" flow.
  - **Manage Events** — create/edit/delete events. Downloads updated `events.json`.
  - **Manage Stories** — create/edit/delete stories. Downloads updated `stories.json`.

### 3. Google Drive photo handling
- CSV gives `https://drive.google.com/u/0/open?usp=forms_web&id=XXX`
- Site converts on the fly to `https://drive.google.com/thumbnail?id=XXX&sz=w800` (Drive's public thumbnail endpoint — works without auth as long as the Drive file is set to "Anyone with link can view").
- Fallback initials avatar when link is missing/broken.

### 4. Public pages that stay (rewired to JSON)
- Home (`/`)
- Directory (`/directory`) — grid of alumni cards, filter by generation/program/major/country
- Alumni detail (`/alumni/$id`) — full profile page
- Events (`/events`, `/events/$id`) — read-only listings
- Stories (`/stories`, `/stories/$id`) — read-only listings

### 5. Removed nav items
Header nav goes from [Directory, Events, Stories, Internships, Sign in] → [Directory, Events, Stories].

## Technical section (skip if not interested)

- **Only remaining server code**: `src/lib/admin.functions.ts` with two server fns — `adminLogin({ password })` and `adminLogout()` — plus `requireAdmin()` helper that checks the encrypted session cookie. Everything else becomes pure client-rendered from bundled JSON.
- **Session encryption**: uses `useSession` from `@tanstack/react-start/server` with `SESSION_SECRET` env var (I'll generate).
- **Timing-safe password compare** via `node:crypto` `timingSafeEqual`.
- **CSV parsing**: `papaparse` on the client inside the admin panel.
- **JSON persistence**: admin edits mutate in-memory state and trigger a browser download of the updated JSON file. You commit that file to GitHub, Lovable auto-redeploys. Simple and no GitHub-API integration required.
- Route tree regenerates automatically — I'll delete removed route files and let the plugin rebuild.
- `.env` and `src/integrations/supabase/*` deletion means `client.ts`, `types.ts`, `auth-middleware.ts` all go. `src/start.ts` reverts to just `errorMiddleware`.

## What I need from you before starting

1. **Confirm the admin password to use** — either give me a password now (I'll add it as `ADMIN_PASSWORD` secret) or say "generate one" and I'll create a strong one and show it to you once.
2. **Confirm the "download JSON, commit to GitHub" flow is acceptable** — the alternative is wiring the GitHub API so admin edits auto-commit, but that's the "complicated" path you already said no to. Just confirming.
3. **Anything from the current site to preserve as seed data?** e.g. existing events or stories in the DB you want me to export first and drop into the initial JSON files. If no, I'll ship empty arrays and you'll populate via the admin panel.

Reply with the password (or "generate") + confirm the JSON-download flow + tell me about seed data, and I'll do the full rewrite in one pass.
