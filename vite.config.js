import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// The version shown in the HUD comes from package.json and from nowhere else. A number typed
// into two files is a number that will disagree with itself, and the one the user sees would
// be the wrong one - so it is injected at build time rather than copied. tools/verify.mjs
// asserts the published page agrees with this file.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Relative base so the build works unmodified on Vercel, Netlify, or
  // GitHub Pages (the last of which serves from a repo subpath) - see
  // docs/ARCHITECTURE.md §9, deployment target not finalized yet.
  base: './',
});
