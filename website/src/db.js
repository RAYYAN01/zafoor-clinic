// Single source of truth: this pool points at the SAME Postgres database
// the CRM (crm/prisma/schema.prisma) uses. No separate/duplicate database —
// a booking made here is a row the CRM sees immediately, and vice versa.
const { Pool } = require("pg")

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set. Set it to the same connection string the CRM uses (see ../crm/.env)."
  )
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

pool.on("error", (err) => {
  console.error("[db] Unexpected error on idle client", err)
})

module.exports = { pool }
