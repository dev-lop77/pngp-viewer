# Dev workflow scripts

A small, growing library of scripts for command sequences that come up
often enough during development to be worth not retyping - starting with
starting/stopping the local test server. Add to this folder (with a short
README update) whenever a multi-step command sequence gets used more than
a couple of times, rather than re-deriving it each session.

## Testing in a real browser (VS Code port forwarding)

The usual flow when asked to check something in an actual browser rather
than headlessly:

1. `tools/dev/start-dev.sh` (fast iteration, HMR) or
   `tools/dev/start-preview.sh` (closer to real static hosting - builds
   first, then serves the production bundle; use this one when the thing
   being checked is specifically about the deployed build, e.g.
   `docs/ARCHITECTURE.md` §9's GitHub Pages/Apache targets).
2. Forward the printed port with VS Code (`Ports` panel -> Forward a Port,
   or it may auto-detect once something's listening) and open it in a
   real, local browser.
3. `tools/dev/stop.sh` when done (stops both default ports; pass explicit
   port numbers to stop only specific ones).

Both start scripts:
- kill anything already on the target port first (avoids `EADDRINUSE` on
  a re-run),
- run the server in the background and poll until it actually responds
  rather than a blind `sleep`,
- log to `tools/dev/logs/` (gitignored via the repo's `*.log` rule) so a
  failed start can be diagnosed without re-running blind.

## Scripts

- `start-dev.sh [port]` — `vite` dev server, default port 5173.
- `start-preview.sh [port]` — `npm run build` + `vite preview`, default
  port 4173. Slower to start (rebuilds every time) but is the accurate
  simulation of real static hosting — this is what caught the
  `import.meta.env.BASE_URL` sub-path bug, see `docs/PROGRESS.md`.
- `stop.sh [port ...]` — stops whatever's listening on the given ports
  (default: 5173 and 4173, i.e. both of the above).
- `deploy.sh` — builds and publishes to GitHub Pages
  (<https://dev-lop77.github.io/pngp-viewer/>).
- `shoot.mjs "<place>" [out.png] [--climb=m] [--pitch=deg] [--look=deg]` —
  screenshots the viewer standing at a named place, by driving the search
  box. `tools/verify.mjs` only ever shoots the 3918 m spawn point, up in
  the rock band, which is useless for anything happening at treeline
  altitude. `--climb` rises in fly mode (polling the HUD altitude, since
  fly speed is `controls.js`'s business) and pitches down, which is the
  only way to judge what reads at landscape scale — forest cover, LOD,
  band transitions.
- `solve-albedo.mjs [hex ...]` — inverts BRDF → lights → exposure → ACES
  to turn "what this should look like on screen" into the albedo hex to
  put in the code. Needed because the two are far apart here: Lambert
  divides by π, so a natural-looking forest green renders nearly black.
  See `docs/ARCHITECTURE.md` §5.

## Deploying

`tools/dev/deploy.sh` is the whole thing: build, sync `dist/` into an orphan
`gh-pages` worktree, commit, push. Safe to re-run — it reuses a stale
worktree, and says "nothing changed" instead of pushing an empty commit.

Only the built site is published (decided 2026-08-03): no sources, docs or
tools, and none of the main history. The script *refuses to push* if it finds
`.mjs`/`.sh`/`.md`/`.png` in the payload, so that decision can't be undone by
accident later.

Pages needs no setup — GitHub enables it automatically for a branch named
`gh-pages`. Two things that cost time the first time round:

- A **fine-grained** PAT needs `Contents: Read and write`, or the push fails
  with `403 Write access to repository not granted`. Confusingly,
  `GET /repos/…` still reports `"push": true` — that field is the *account's*
  role, not the token's permissions. Changing a fine-grained token's
  permissions takes effect immediately, with no need to re-run `gh auth login`.
- Pages on a **private** repo needs a paid plan; this repo is public.

After deploying, don't stop at Pages reporting `built` — check the live site:
`node tools/verify.mjs https://dev-lop77.github.io/pngp-viewer/`.
