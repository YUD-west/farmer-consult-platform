/**
 * Vercel serverless entry: all HTTP traffic is rewritten here; Express serves API + static HTML.
 */
const { createApp } = require("../src/app");

module.exports = createApp();
