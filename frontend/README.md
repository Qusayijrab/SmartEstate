# SmartEstate · Next.js frontend

The browser-facing app for SmartEstate. Owns the full UI, all CRUD (auth,
listings, favorites, compare), and proxies AI requests to the Python FastAPI
service.

```
Browser ──► Next.js App Router pages
            ├── /api/auth/*  /api/listings/*  /api/users/*    →  Prisma  →  SQLite (frontend/dev.db)
            └── /api/ai/*                                     →  Python FastAPI on :5000
```

## Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19**
- **Tailwind CSS v4** (CSS-first config in `app/globals.css`)
- **Prisma 7** with **better-sqlite3 driver adapter** (`@prisma/adapter-better-sqlite3`)
- **iron-session** for cookie-based auth
- **bcryptjs** for password hashing
- **Zod** for request validation
- **lucide-react** for icons
- **clsx** for conditional classNames

## Pages (14 routes)


| Route                                   | Purpose                                                     |
| --------------------------------------- | ----------------------------------------------------------- |
| `/`                                     | Home — hero, services, market heatmap, AI module gallery    |
| `/login`, `/signup`, `/forgot-password` | Auth flows                                                  |
| `/marketplace`                          | Filterable list of all listings                             |
| `/property-details/[id]`                | Single listing with gallery, AI signals, favorite/compare   |
| `/post-property`                        | Create a new listing (multipart upload)                     |
| `/post-property/[id]/edit`              | Edit a listing you own                                      |
| `/dashboard`                            | 3 tabs: My listings, Favorites, Compare                     |
| `/compare`                              | Side-by-side property comparison (cap 3)                    |
| `/property-estimator`                   | AI page wired to `/api/ai/property` (multipart with photos) |
| `/loans`                                | AI page wired to `/api/ai/loan`                             |
| `/land`                                 | AI page wired to `/api/ai/land`                             |
| `/areas`                                | District lists pulled from the Python AI service            |


## Setup

```bash
# 1. install deps
pnpm install

# 2. copy env
cp .env.example .env
# edit IRON_SESSION_PASSWORD to a 32+ char random string in production

# 3. create the SQLite db & generate the prisma client
pnpm prisma db push
pnpm db:seed   # optional — creates two demo users + two listings

# 4. start the AI backend (in a separate terminal, from /backend)
#    cd ../backend && uvicorn app:app --reload --port 5000

# 5. run the Next.js dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (created by `pnpm db:seed`)


| Email                        | Password      | Role   |
| ---------------------------- | ------------- | ------ |
| `demo.seller@smartestate.ai` | `password123` | seller |
| `demo.buyer@smartestate.ai`  | `password123` | buyer  |


## Environment variables


| Name                    | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`          | SQLite file URL, e.g. `file:./dev.db`                                           |
| `IRON_SESSION_PASSWORD` | 32+ char random string used to encrypt the session cookie                       |
| `PY_AI_URL`             | Where the Python FastAPI service is listening (default `http://127.0.0.1:5000`) |


## Project layout

```
app/                  Next.js App Router pages + API routes
components/
  ai/                 LoanForm, PropertyEstimatorForm, LandValuationForm
  auth/               LoginForm, SignupForm, ForgotPasswordForm, AuthShell
  compare/            CompareRemoveButton
  dashboard/          DashboardTabs
  home/               MarketHeatmap, HomeReveal
  listings/           ListingCard, ListingGallery, ListingForm, FilterSidebar
  nav/                SiteNav, SiteFooter
  ui/                 Button, Input, Modal, Tabs, Toast
lib/
  ai.ts               Python service proxy helpers (JSON + multipart)
  db.ts               Prisma client singleton (better-sqlite3 adapter)
  listings.ts         Listing → DTO mapping (mirrors the legacy Flask shape)
  session.ts          iron-session helpers + requireUser()
  uploads.ts          Multipart → public/uploads/ writer
  utils.ts            slugify, formatNumber, formatPrice, initials
  validations.ts      Zod schemas
prisma/
  schema.prisma       User, Listing, Favorite, CompareListing
  seed.ts             Demo users + two listings
public/uploads/       Listing/property photos written here
prisma.config.ts      Required by Prisma 7 (datasource URL lives here)
```

## Useful scripts

```bash
pnpm dev         # next dev (Turbopack)
pnpm build       # next build
pnpm start       # next start

pnpm db:push     # prisma db push (apply schema)
pnpm db:generate # prisma generate
pnpm db:seed     # seed demo data
pnpm db:studio   # prisma studio
```

## Notes / gotchas

- The legacy HTML pages used inconsistent links (e.g. `property.html` vs
`Property.html`). Routes here are normalised to clean kebab-case paths and
the home page is updated to match.
- `app/api/ai/property/route.ts` forwards the raw request body so multipart
photo uploads stream straight to the Python service without re-parsing.
- Listing images are stored in `public/uploads/`; the JSON shape is
`{ src: "/uploads/foo.jpg", label: "Living Room" }` to match what the legacy
Flask backend produced.
- Compare list is capped at 3 listings per user (mirrors the Flask cap).
- Forgot-password is a stub that returns the same friendly message regardless
of whether the email exists, exactly like the Flask version.

