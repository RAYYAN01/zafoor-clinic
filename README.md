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

## Known limitations / next steps

- **Live database testing wasn't run against the current schema** in this
  session (the only reachable database had leftover pre-trim rows and
  resetting it required user confirmation that wasn't given). Everything
  has been verified statically instead: `tsc --noEmit`, `next build`,
  `node --check` on every website file, and a live boot test of the Express
  server (confirmed routing/EJS/error-handling work; DB-touching requests
  correctly return the styled error page when the DB is unreachable).
  **Run `npx prisma db push && npm run db:seed` and click through both
  apps before considering this production-ready.**
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
