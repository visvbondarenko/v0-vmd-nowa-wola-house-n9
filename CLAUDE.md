# VMD Nowa Wola House (N9)

Real-estate developer site for the Nowa Wola House investment. Customer-facing CMS + full admin panel, multi-company support, dane.gov.pl regulatory reporting, PDF unit cards, dynamic per-project landing pages.

---

## Stack

- **Next.js 16.1** (App Router) on **React 19.2**
- **Prisma 5.22** ORM against **Postgres** (Neon in production)
- **Vercel Blob** for asset/PDF/XML storage
- **Tailwind 4** + custom theme tokens in `app/globals.css`
- **shadcn/ui** primitives under `components/ui/`
- **@react-pdf/renderer** for server-rendered unit PDFs
- **@vis.gl/react-google-maps** for the public location maps
- **Resend** for transactional email
- Auth: HMAC-signed session cookies via Web Crypto API (edge-safe), env-stored passwords with `crypto.timingSafeEqual`

## Local development

```bash
# 1. Install deps
npm install            # postinstall runs `prisma generate`

# 2. Copy env template and fill in
cp .env.example .env.local
# At minimum, set POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, ADMIN_PASSWORD, SESSION_SECRET

# 3. Apply migrations (idempotent)
npx prisma migrate deploy

# 4. Optional — seed the Nowa Wola House company + AboutSection
npx prisma db seed

# 5. Dev server
npm run dev
```

`build` does `prisma generate && prisma migrate deploy && next build` — deployments apply schema changes automatically.

## Directory layout

```
app/
  admin/                   # gated by middleware (admin/manager roles)
    page.tsx               # dashboard — projects-table
    companies/             # list, new, [id] edit, [id]/view read-only
    projects/[id]/         # tabbed editor + /overlay nested editor
    units/                 # cross-project units table
    news/                  # blog posts + block editor
    about/, team/          # singleton AboutSection + team CRUD
    plan-editor/           # standalone SVG polygon editor
  api/
    admin/                 # CRUD for every domain (role-gated)
    cron/                  # dane-gov daily/monitor/weekly
    dane-gov/[slug]/       # public serving of XML/MD5/CSV
    projects/[slug]/       # public read APIs + PDF endpoint
    contact/, news/        # public-facing endpoints
  inwestycje/[slug]/       # CMS-driven project landing page
  aktualnosci/[slug]/      # blog
  lokalizacja/             # multi-city map
  projects/[slug]/         # legacy N9 project page (kept; eventual removal)
components/
  admin/                   # editors used by /admin pages
  project-sections/        # ProjectSection renderers used by /inwestycje/[slug]
  lokalizacja/             # city-map for /lokalizacja
  ui/                      # shadcn primitives
  navbar.tsx, footer.tsx   # N9 brand chrome (DO NOT replace with source's Header/Footer)
lib/
  auth.ts                  # HMAC sessions + role helpers
  prisma.ts                # singleton Prisma client
  geocode.ts               # Google Geocoding wrapper
  slugify.ts               # Polish-diacritic slug helper
  dane-gov/                # xml-generator, csv-generator, generate-reports, monitor, mailer
  pdf/unit-pdf-template.tsx
  lokalizacja-points.ts    # DB → grouped-by-city points
middleware.ts              # admin gate + manager allowlist + legacy /wp-content rewrite
prisma/
  schema.prisma
  migrations/              # 0_init baseline + upgrade_full_cms
  seed.ts
vercel.json                # crons + URL rewrites
```

---

## Data model (Prisma)

```
Company  ──< Project ──< Unit ──< PriceHistory
              │             │
              │             ├──< UnitDotOverride (one per map: project/planview/stageview)
              │             │
              │             └──> HouseType ──< FloorPlan ──< Room
              │
              ├──< ProjectSection ──< SectionItem        (CMS — homepage modules per project)
              ├──< PlanView ──< UnitDotOverride           (alternate maps of the site)
              ├──< Stage ──< StageView ──< UnitDotOverride (etap I / II / III maps)
              ├──< ProjectDocument                        (downloadable PDFs)
              └──< GalleryImage

Company ──< GeneratedFile                                 (Blob URLs for dane.gov.pl artifacts)

NewsPost ──< NewsBlock                                    (paragraph | image, ordered)
AboutSection (singleton id="main", photos JSON)
TeamMember, UpcomingInvestment, NewCity                   (flat list models)

MonitorResult (daily dane.gov.pl health snapshot)
LoginAttempt (rate-limit source for /api/admin/auth/login)
```

**Deprecated, kept temporarily:** `Project.aboutHeading`, `aboutText`, `mapEmbedUrl`, `locationAddress`, `locationTransport`, `locationSurroundings`, and the entire `AboutFeature` model. The new `/inwestycje/[slug]` page reads `ProjectSection` rows instead. Safe to drop after confirming no external consumer reads them.

### Unit price tracking

`/api/admin/units` POST and PUT auto-compute `fullPrice = price + parkingPrice + storagePrice + rightsPrice + otherPrice` and append a `PriceHistory` row whenever any price component changes. `/api/admin/seed-price-history` is a one-shot backfill for units that pre-date this logic.

### `UnitDotOverride` triple-key

Each row pins exactly one of `projectId` / `planViewId` / `stageViewId` (the others null) — that's the map this dot belongs to. The unique constraints `(unitId, projectId)`, `(unitId, planViewId)`, `(unitId, stageViewId)` enforce one override per (unit, map). The `/api/admin/unit-dot-overrides` POST/DELETE handler routes by `mapKind` ("project" | "planview" | "stageview").

---

## Auth & roles

`lib/auth.ts` issues HMAC-SHA256 signed session cookies (`admin_session`, 7-day TTL) using Web Crypto so the same code runs in Node (server components / API routes) and the Edge runtime (`middleware.ts`). The cookie payload is `<expiresAtMs>.<role>` plus a signature — the password is never inside.

**Roles:**

| Role | Granted by | Access |
| --- | --- | --- |
| `admin` | `ADMIN_PASSWORD` | Everything under `/admin` and `/api/admin` |
| `manager` | `MANAGER_PASSWORD` (must be set and ≠ admin) | `/admin/units/*` (full), `/admin/companies` list + `/admin/companies/[id]/view` (read-only), `/api/admin/units/*` + `/api/admin/companies/*` (with handler-level method checks). Everything else → 403 (API) or redirect (page) |

**Rate limiting:** `/api/admin/auth/login` counts failed `LoginAttempt` rows for the requesting IP in the last 15 min — 5+ failures returns 429. Every attempt (success or fail) is logged.

`middleware.ts` is the single gate — it verifies the session, branches on role, and either lets the request through, redirects to `/admin/login?from=<path>`, or returns a 401/403 JSON for API paths.

---

## Routes

### Public pages

| Path | Purpose |
| --- | --- |
| `/` | Home (N9-styled, uses N9's hero/about/projects components) |
| `/projects/[slug]` | Legacy N9 project page (still active during transition) |
| `/inwestycje` | Investments list (new) |
| `/inwestycje/[slug]` | CMS-driven project page — renders `ProjectSection` rows in order |
| `/aktualnosci` + `/aktualnosci/[slug]` | News list + post |
| `/lokalizacja` | Multi-city Google Map with all projects (lat/lng) |

### Admin pages

| Path | Role |
| --- | --- |
| `/admin` | admin — projects dashboard table |
| `/admin/companies/{new,[id],[id]/view}` | admin (manager: view-only) |
| `/admin/projects/{new,[id],[id]/overlay}` | admin |
| `/admin/units` | admin + manager |
| `/admin/news/{new,[id]}`, `/admin/about`, `/admin/team`, `/admin/plan-editor` | admin |
| `/admin/login` | public |

### Public APIs

| Path | Notes |
| --- | --- |
| `GET /api/news` | Published posts only |
| `GET /api/projects/[slug]` | Full project |
| `GET /api/projects/[slug]/{plan-views,stages,units}` | Per-relation reads |
| `GET /api/projects/[slug]/units/[unitId]/pdf` | Server-rendered PDF (cacheable) |
| `POST /api/contact` | Sends to recipients hardcoded in `app/api/contact/route.ts:6` via Resend |
| `GET /api/dane-gov/[slug]?type=xml\|md5\|csv&date=YYYY-MM-DD` | Serves the WP-compatible artifacts |

### Admin APIs

Under `/api/admin/`: `auth/login`, `auth/logout`, `companies`, `companies/[id]/generate` (XML/CSV on demand), `projects`, `projects/[id]/{geocode,reset,svg,plan-views}`, `sections`, `section-items`, `stages`, `stage-views/{,[id]/svg}`, `project-documents`, `gallery-images`, `house-types`, `floor-plans`, `rooms`, `unit-dot-overrides`, `units/{bulk-status}`, `news`, `about-section`, `team-members`, `upcoming-investments`, `new-cities`, `upload`, `seed-price-history`. All require an authenticated session; some method/path combinations are admin-only.

### Cron routes

Each verifies `Authorization: Bearer ${CRON_SECRET}`.

| Path | Schedule (UTC) | Action |
| --- | --- | --- |
| `/api/cron/dane-gov` | `0 1 * * *` | Generate tomorrow's CSV + XML + MD5 for every company, upload to Blob |
| `/api/cron/dane-gov-monitor` | `0 2 * * *` | Health checks every dataset, write `MonitorResult`, email on warning/critical |
| `/api/cron/dane-gov-weekly` | `0 6 * * 5` | Friday rollup email |

---

## dane.gov.pl reporting

Mature regulatory subsystem ported from the production VMD site. Each `Company` with an `extIdent` configured will be included in the daily cron output.

### What gets generated

- **Daily CSV** — 60-column file matching dane.gov.pl's Polish schema, one row per priced Unit owned by the company
- **Dataset XML** — index of all CSVs (historical + today's) with stable per-resource `extIdent` values
- **MD5 sidecar** — checksum of the XML, used by dane.gov.pl to detect changes

`extIdent` derivation: dataset uses `company.extIdent` (year 1) or `company.extIdent.slice(0,32) + year` (subsequent years). Resource extIdents are derived deterministically via `DEWA + MD5(companyExtIdent + "|" + date)` so re-running the cron produces stable IDs.

### Legacy URL compatibility

dane.gov.pl polls the original WordPress paths. Both `vercel.json` rewrites and `middleware.ts` cover them:

```
/wp-content/uploads/raporty/<slug>-dataset.xml
/wp-content/uploads/raporty/<slug>-dataset.md5
/wp-content/uploads/raporty/mieszkania-<slug>-YYYY-MM-DD.csv
/raporty/<slug>-dataset.{xml,md5}            # alternate prefix
/raporty/mieszkania-<slug>-YYYY-MM-DD.csv
```

The middleware handles the `.xml.md5` doubled-extension case that the static vercel.json patterns miss.

### On-demand regeneration

`POST /api/admin/companies/[id]/generate` (admin-only, 60s `maxDuration`) triggers a fresh CSV/XML/MD5 cycle for one company. Wired to the "Generuj teraz" button in `/admin/companies/[id]`.

### Storage

Artifacts live in Vercel Blob. `GeneratedFile` table maps a logical path (`<slug>-dataset.xml`, etc.) to its current Blob URL.

---

## Environment variables

See `.env.example` for the full list. Required to boot:

- `POSTGRES_PRISMA_URL` (pooled)
- `POSTGRES_URL_NON_POOLING` (direct, for migrations)
- `ADMIN_PASSWORD`
- `SESSION_SECRET` (≥16 chars, `openssl rand -hex 32`)

Required for production features:

- `BLOB_READ_WRITE_TOKEN` — uploads + dane.gov.pl artifacts
- `CRON_SECRET` — Vercel cron auth (same value in Vercel env + local for dev curls)
- `RESEND_API_KEY` — `/api/contact` + monitor alerts
- `GOOGLE_MAPS_API_KEY` — server (geocoding)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser (maps)
- `NEXT_PUBLIC_BASE_URL` — absolute URLs in dane.gov.pl XML

Optional:

- `MANAGER_PASSWORD` — enables the manager role
- `MONITOR_ALERT_RECIPIENTS` — comma-separated override for dane.gov.pl alerts (default `vlad@qualops.io`)
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` — custom vector map style

## Deployment (Vercel)

1. Add every env var above in Project Settings → Environment Variables (Production / Preview / Development as appropriate).
2. Confirm Project Settings → Cron Jobs shows the three jobs from `vercel.json`.
3. `git push` — `build` runs `prisma generate && prisma migrate deploy && next build` automatically.
4. First deploy only: in Neon (or your Postgres), verify the schema matches `prisma/migrations/`.

---

## Non-obvious design decisions

1. **Theme tokens, not hex.** Every ported component was sed-swapped to N9 semantic tokens (`text-primary`, `text-foreground`, `bg-card`, `bg-muted/30`, `border-border`, `text-destructive`). Inline `#6E2E2A` / `#3E1718` / `#FAF8F5` / `gray-*` / `red-*` from the source were systematically replaced. The PDF template is the exception — `@react-pdf/renderer` renders outside CSS, so palette constants (`INK`, `ACCENT`, `PANEL`) live literally in `lib/pdf/unit-pdf-template.tsx`.
2. **Functional SVG colors kept literal.** Status fills (green/yellow/red), drawing handles, compass needle red — these are universally meaningful and not "branded", so they stayed as plain hex in the overlay/stage editors.
3. **Manager-role allowlist is path-shaped.** Defined in `middleware.ts` (`MANAGER_API_PREFIXES`, `isManagerAllowedPagePath`). API handlers add a second `hasRole('admin')` check for destructive methods.
4. **Polish diacritic transliteration in PDFs.** react-pdf's built-in Helvetica is Latin-1 only. `lib/pdf/unit-pdf-template.tsx` has a `pl()` helper that maps `ąćęłńóśźż` → ASCII before render.
5. **`Header` (source) → `Navbar` (N9).** Source's brand-specific `components/header.tsx` was *not* ported — N9's `Navbar` is used everywhere. Same for `Footer`. Bulk import rename was applied during the public-route port.
6. **No global marketing fallbacks on `/inwestycje/[slug]`.** Source renders `<BuyingProcess />` when the CMS "jak kupić" section is empty, and `<Contact />` when contact fields are missing. N9 skips both — the page silently omits empty sections. Add CMS content in the admin to populate.
7. **`bcryptjs` is unused.** Password check is `crypto.timingSafeEqual` against the env-stored plain value, exactly like the source. The dep is not installed (it was listed in source but never imported).
8. **Source is read-only reference.** `../v0-real-estate-developer-website` is production for a different brand. Never modify it. Use it only for reading source-of-truth implementations.

---

## Migration history

Single full port from `../v0-real-estate-developer-website` completed 2026-05-13/14. See git history for the per-task breakdown. Migrations in `prisma/migrations/`:

- `0_init/` — baseline of pre-migration N9 schema (resolved as applied, never re-executed)
- `20260513224225_upgrade_full_cms/` — 15 new models + extensions to `Project`, `Unit`, `PlanView`, `StageView`. 396 lines of additive SQL.

To diff DB against current `schema.prisma` and produce the next migration:

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_<name>
npx prisma migrate diff \
  --from-url "$POSTGRES_URL_NON_POOLING" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<dir>/migration.sql
npx prisma migrate deploy
```

(The interactive `prisma migrate dev` form doesn't work in non-TTY shells like Claude Code's sandbox.)

## Future cleanup

1. **Drop deprecated `Project` columns** and the `AboutFeature` model. After confirming no external consumer reads them, generate a destructive migration via the `migrate diff` workflow above.
2. **Remove `app/projects/[slug]/`** once `/inwestycje/[slug]` covers all visitor flows.
3. **Optional dane.gov.pl historical import** — only if Nowa Wola House has prior WordPress CSV/XML history that needs to land in `GeneratedFile`. The source's `scripts/migrate-to-blob.ts` and `diff-wp-vs-db.ts` are the reference workflow (not ported because no historical data exists yet).
