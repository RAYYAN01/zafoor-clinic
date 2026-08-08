# Zafoor Clinic CRM

The staff-facing app for Zafoor Clinic — patient records, appointments,
EMR/consultation workflow, billing, the services catalog, and public
website content management. Built on Next.js (App Router), Prisma, and
Postgres.

See the [repo-root README](../README.md) for the full picture (this app +
the public website + how they share one database).

## Modules

- **Patients** — registration (UHID), family members, insurance,
  emergency contacts, medical alerts, allergies, documents, tags, CRM
  notes/follow-ups/feedback.
- **Appointments** — booking, doctor availability & leave, queue,
  waiting list, reschedule/cancel/no-show, sourced from both the CRM and
  the public website.
- **EMR** — encounter-based consultations: chief complaints, vitals,
  diagnoses, SOAP notes with autosave + version history, prescriptions,
  referral notes, certificates, doctor templates, digital signatures.
- **Billing** — bills, line items, payments, refunds, patient advances,
  cash sessions, expenses, financial reports.
- **Services** — the clinic's review catalog (Hairfall/Acne/Thyroid/Skin/
  Diabetes/General Review), shown on the public website and used for
  billing.
- **Website Content** — clinic settings (address/phone/hours/homepage
  copy), FAQs, and admin-curated patient reviews, all rendered by the
  public website.

## Tech Stack

- **Framework:** Next.js (App Router, Turbopack), React, TypeScript
- **UI:** Tailwind CSS + shadcn/ui (built on Base UI)
- **Database:** PostgreSQL via Prisma ORM (driver adapters)
- **Auth:** Cookie/session-based, scrypt password hashing, server-side
  role checks (`src/lib/auth.ts`) — see `requireRole()` usages for the
  current RBAC coverage.
- **Validation:** Zod
- **Forms/state:** Server Actions with `useTransition`

## Getting Started

```bash
npm install

npx prisma dev              # local ephemeral Postgres — keep running in its own terminal
# copy the printed DATABASE_URL into .env (and into ../website/.env — same DB)

npx prisma db push
npx prisma generate
npm run db:seed             # staff logins, services, demo patients/appointments/billing

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> `npx prisma dev` picks a fresh local port each time it starts. If you
> restart it, update `DATABASE_URL` in both `.env` files and re-run
> `db:push`/`db:seed`.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed/reseed demo data |
| `npx prisma studio` | Browse the database in a GUI |

## Notes

- The local `prisma dev` database is ephemeral (development only). Point
  `DATABASE_URL` at a real Postgres instance for anything beyond local dev.
- RBAC currently guards the highest-risk actions (billing cancellation,
  refunds, payments, expenses, patient status changes, service catalog
  writes). Extend `requireRole()` calls in `src/actions/*.ts` as more
  modules need tighter restriction.
