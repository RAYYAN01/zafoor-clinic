// Local/traditional-hosting entry point — starts a long-running HTTP
// server. Not used on Vercel, which instead imports ./app.js directly as
// a serverless function (see ../api/index.js and ../vercel.json).
const app = require("./app")

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Zafoor Clinic website running at http://localhost:${PORT}`)
})
