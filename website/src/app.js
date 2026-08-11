require("dotenv/config")
const path = require("node:path")
const express = require("express")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")

const pagesRouter = require("./routes/pages")
const apiRouter = require("./routes/api")
const { getClinicSettings } = require("./queries")

const app = express()

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // EJS output is fully server-controlled (no user HTML is ever
        // rendered unescaped) — no inline-script allowance needed.
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        mediaSrc: ["'self'"],
        frameSrc: ["https://www.google.com"],
      },
    },
  })
)
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serves css/js and the clinic's own photos/videos (src/public/images,
// /logo, /videos) locally. On Vercel these paths are instead served
// directly as static files (see ../vercel.json) — this line is a no-op
// there but kept so `npm run dev:server` still works unchanged.
app.use(express.static(path.join(__dirname, "public"), { maxAge: "7d" }))

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false })
app.use("/api", apiLimiter, apiRouter)

app.use("/", pagesRouter)

app.use(async (req, res) => {
  const clinic = res.locals.clinic || (await getClinicSettings().catch(() => null))
  res.status(404).render("404", { title: "Page not found", description: "", clinic })
})

app.use(async (err, req, res, _next) => {
  console.error(err)
  const clinic = res.locals.clinic || (await getClinicSettings().catch(() => null))
  res.status(500).render("500", { title: "Something went wrong", description: "", clinic })
})

module.exports = app
