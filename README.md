# Zafoor Clinic — Website + CRM

No. 69/70, St. Xavier Street, Broadway, Sevenwells, George Town, Chennai - 600001
Opposite Huda Mosque · 8940399403 · ZafoorClinic@gmail.com
Mon–Sat 6:00 PM–10:00 PM · Sunday closed

Two apps, one database:

```
crm/       Next.js 16 + Prisma + Postgres — the clinic's internal CRM/EMR/billing system
website/   Node.js + Express + EJS + Tailwind CSS — the public marketing + booking site
           (src/public/{images,logo,videos} holds the clinic's real photos/videos)
```

`crm/prisma/schema.prisma` is the single source of truth for the data model. The
website talks to the **same** Postgres database with raw `pg` queries
(`website/src/queries.js`) — a booking made on the public site is a row the
CRM sees immediately; there is no sync job and no second database.

## Architecture

- **CRM** (`crm/`): staff-facing app — patients, appointments, EMR/encounters,
  billing, services catalog, and website content management (clinic settings,
  FAQs, reviews). Real session-based auth (`crm/src/lib/auth.ts`) with
  role-based authorization (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `BILLING`).
- **Website** (`website/`): public site — Home, About, Services (+ per-service
  pages), Doctors, 5-step appointment booking, Reviews, Contact, Location,
  FAQ, Privacy, Terms. Server-rendered HTML5 via EJS, styled with Tailwind
  CSS, vanilla JS for the booking flow and mobile nav — no frontend
  framework, per the project brief.

This repo started from an existing Next.js/Prisma hospital-ERP baseline
(`hospital-crm`) that was audited and trimmed down to what a single
outpatient review clinic needs — see the git history for what was removed
and why (HRMS, hospital operations, corporate/insurance billing, etc.).

## Setup

### 1. Database

Both apps need the same `DATABASE_URL`. For local development, the CRM's
`npx prisma dev` spins up an ephemeral local Postgres with zero setup:

```bash
cd crm
npx prisma dev            # keep running in its own terminal; copy the DATABASE_URL it prints
```

Put that connection string in **both** `crm/.env` and `website/.env`
(copy from the `.env.example` in each folder). For anything beyond local
dev, point `DATABASE_URL` at a real Postgres instance instead.

### 2. CRM

```bash
cd crm
npm install
npx prisma db push        # create tables from schema.prisma
npm run db:seed           # staff logins, services, demo patients/appointments
npm run dev                # http://localhost:3000
```

Seeded logins (change immediately in production):
`admin@zafoorclinic.test`, `doctor@zafoorclinic.test`, `reception@zafoorclinic.test` — password `ChangeMe123!`.

### 3. Website

```bash
cd website
npm install
npm run build:css         # compile Tailwind once (or `npm run watch:css` while developing)
npm run dev:server         # http://localhost:3001
```

## Deployment (Vercel)

Both apps are deployed as **separate Vercel projects** from this one repo
(GitHub-connected — pushes to `master` auto-deploy both):

- CRM: `zafoor-clinic-crm` → https://zafoor-clinic-crm.vercel.app (Root
  Directory: `crm`)
- Website: `zafoor-clinic-website` → https://zafoor-clinic-website-two.vercel.app
  (Root Directory: `website`)

The website deploys via `website/vercel.json`: `src/public/{css,js,images,
logo,videos}` are served directly as static files (`@vercel/static`),
everything else (pages, `/api/*`) runs through `website/api/index.js` as a
Node serverless function (`@vercel/node`) wrapping the same Express app
`npm run dev:server` uses locally (`website/src/app.js`).

**⚠️ Required follow-up — both projects currently have a placeholder
`DATABASE_URL`** (`postgresql://user:password@replace-with-real-host:...`)
so the build succeeds, but every DB-touching page will 500 until you:

1. Provision a real Postgres (Neon, Supabase, Vercel Postgres/Prisma
   Postgres from the Storage tab, or your own instance).
2. Set the **same** `DATABASE_URL` on both projects:
   `vercel env rm DATABASE_URL production` then
   `vercel env add DATABASE_URL production` (or via each project's
   Settings → Environment Variables in the dashboard).
3. Run `npx prisma db push && npm run db:seed` from `crm/` against that
   same URL.
4. Redeploy both (`vercel --prod`, or just push a commit — GitHub is
   connected).

## Known limitations / next steps

- See the **Deployment** section above — the live Vercel deployments need
  a real `DATABASE_URL` before they'll actually work end-to-end. Locally,
  this has been fully verified live: seeded database, both servers
  running, a real booking made through the website and confirmed showing
  up in the CRM, double-booking correctly rejected, password hashing
  round-tripped, RBAC-gated actions confirmed.
- Contact page's message form uses a `mailto:` submit (opens the visitor's
  mail client) rather than a backend-persisted message — genuinely
  functional, but a nicer version would save to the CRM's `Message` model.
- No SMS/WhatsApp/email notifications are wired up (no third-party keys
  were provided) — the architecture (env vars, `Message`/`Notification`-
  shaped data) is ready for it.
- Video consultations, corporate billing, and insurance-claims workflows
  were deliberately dropped as out of scope for a small single-clinic
  outpatient practice — see the schema trim commit if any of these turn
  out to be needed after all.
- `website/src/public/{images,logo,videos}` (~250MB) is committed as
  plain static files for simplicity. For a real production deploy, move
  these to a CDN/object store (S3, Cloudinary, etc.) and point the `<img>`/
  `<video>` `src` attributes there instead — keeps the git repo light and
  gives you image resizing/compression for free.
