/**
 * Vercel compatibility entrypoint.
 * Some deployments may resolve /src/app.js as a serverless function module.
 * Export an Express request handler directly (default export in CJS).
 */
const { createApp } = require("./expressApp");

const app = createApp();

module.exports = app;
