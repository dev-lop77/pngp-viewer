import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works unmodified on Vercel, Netlify, or
  // GitHub Pages (the last of which serves from a repo subpath) - see
  // docs/ARCHITECTURE.md §9, deployment target not finalized yet.
  base: './',
});
