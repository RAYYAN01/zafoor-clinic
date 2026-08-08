# Zafoor Clinic — Public Website

Node.js + Express + EJS + Tailwind CSS. No frontend framework — server-
rendered semantic HTML5, vanilla JS for the booking flow and mobile nav.

Reads/writes the **same** Postgres database as `../crm` via raw `pg`
queries (`src/queries.js`, `src/db.js`) — nothing here is a mock or a
second data store. See the [repo-root README](../README.md) for the full
picture.

## Pages

Home, About, Services (+ one page per service, e.g. `/services/hairfall-review`),
Doctors, Book Appointment (5-step flow), Reviews, Contact, Location, FAQ,
Privacy Policy, Terms & Conditions.

## Setup

```bash
npm install
cp .env.example .env        # set DATABASE_URL to the SAME value as ../crm/.env
npm run build:css           # compile Tailwind once
npm run dev:server          # http://localhost:3001
```

While actively editing styles, run `npm run watch:css` in a second
terminal instead of `build:css`, or `npm run dev` to run both at once.

## How booking works

`POST /api/appointments` validates the submission, finds-or-creates the
`Patient` by phone number, and inserts an `Appointment` row with
`source = 'WEBSITE'` and `status = 'PENDING'` — inside a transaction that
re-checks the slot isn't already taken. It shows up in the CRM's
appointments list immediately; front-desk staff confirm/reschedule it
from there.

`GET /api/availability?doctorId&date` computes open slots from
`DoctorAvailability` + existing bookings, mirroring the logic in
`../crm/src/actions/appointments.ts` so both apps agree on what counts as
available.
