// Vercel serverless entry point. Wraps the Express app from ../src/app.js
// (no app.listen() here — Vercel's Node runtime handles the HTTP server).
module.exports = require("../src/app")
