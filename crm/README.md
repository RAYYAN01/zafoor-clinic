# Naaz Hospital CRM

A full hospital management platform covering patient care, clinical records,
billing, day-to-day hospital operations, and HR — built as a single Next.js
application.

## Modules

### Phase 1 — Patient CRM
Patient registration with a single digital identity (UHID), family members,
insurance, emergency contacts, medical alerts, allergies, documents. Full
appointment system (booking, queue, waiting list, video consultation),
patient timeline, global search, and a CRM layer (notes, follow-ups,
communication log, feedback).

### Phase 2 — Electronic Medical Records (EMR)
Encounter-based clinical workspace: SOAP notes with autosave and version
history, vitals, diagnoses, prescriptions, doctor templates, voice
dictation, digital signatures, lab/radiology reports, discharge summaries,
referral notes, and certificates.

### Phase 3 — Billing & Finance
OP/IP/Emergency/Lab/Radiology/Pharmacy billing, insurance and corporate
billing, package billing, GST-compliant invoices and receipts, refunds,
advance payments, outstanding dues tracking, cash counter with daily
closing, a revenue dashboard, expense tracking, and financial reports.

### Phase 4 — Hospital Operations
Bed and ward management, ICU monitoring, operation theatre scheduling,
emergency triage, ambulance dispatch, laboratory workflow with barcoded
sample tracking, radiology orders with PACS attachments, pharmacy
inventory with purchase orders and vendor management, biomedical asset
tracking, and facility tickets (housekeeping/laundry/maintenance).

### Phase 5 — HRMS
Employee profiles, departments and designations, attendance with biometric
punch-log reconciliation, payroll and salary structures, leave management,
shift scheduling, performance reviews, training programs, recruitment and
onboarding, announcements, internal chat, task management, a meeting
scheduler, an aggregated HR calendar, exit management, employee documents,
and printable ID cards.

## Tech Stack

- **Framework:** Next.js (App Router, Turbopack), React, TypeScript
- **UI:** Tailwind CSS + shadcn/ui (built on Base UI)
- **Database:** PostgreSQL via Prisma ORM (driver adapters)
- **Validation:** Zod
- **Forms/state:** Server Actions with `useTransition`

## Getting Started

### Prerequisites
- Node.js 20+
- No local Postgres install needed — this project uses Prisma's built-in
  ephemeral dev database.

### Setup

```bash
npm install

# Start a local Postgres instance (keep this running in its own terminal)
npx prisma dev

# In a separate terminal: point the app at it and set up the schema
npx prisma db push
npx prisma generate

# Seed demo data (staff, patients, EMR, billing, operations, HR — everything)
npm run db:seed

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `npx prisma dev` picks a fresh local port each time it starts.
> If you restart it, copy the new `DATABASE_URL` it prints into your `.env`
> file, then re-run `prisma db push` and `db:seed` before starting the app.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed/reseed demo data |
| `npx prisma studio` | Browse the database in a GUI |

## Notes

- Authentication is intentionally not implemented — `src/lib/auth.ts`
  provides a placeholder `getCurrentUser()` identity layer that every
  module relies on. Swap it for a real session system without touching
  downstream code.
- The local database is ephemeral (development only). Do not use this
  setup as-is in production.
