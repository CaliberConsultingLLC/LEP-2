import { defineConfig } from 'vite';

// Serves the production build under a hostname that is NOT a dev host, so the
// public path can be exercised locally.
//
// This exists because the bugs it guards against are invisible from a normal
// dev machine. `localhost` is a dev host: it seeds the staging persona, mounts
// the dev panel, and honours ?dev=1. A browser that has been running the app
// for months is the worst possible place to check what a stranger sees.
//
// `compass.localhost` resolves to loopback in every modern browser but is not
// a dev host, so the build behaves exactly as it will on
// compass.northstarpartners.org.
//
//   npm run build
//   npx vite preview --config scripts/vite.prodhost.config.js
//   open http://compass.localhost:4180
//
// What should be true there: no seeded localStorage, no dev panel,
// /dashboard?dev=1 redirects to /sign-in, /demo asks for a password, and
// /demo/catalog and /dev-* are not found.
export default defineConfig({
  preview: {
    host: true,
    port: 4180,
    strictPort: true,
    allowedHosts: ['compass.localhost'],
  },
});
