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
