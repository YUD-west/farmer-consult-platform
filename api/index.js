/**
 * Vercel serverless entry only — must default-export an Express app (a request listener).
 * Do not use src/app.js: Vercel treats that path as a special entry and rejects { createApp } exports.
 */
const { createApp } = require("../src/expressApp");

const app = createApp();
module.exports = app;
