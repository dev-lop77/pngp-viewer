#!/usr/bin/env bash
# Build and publish the viewer to GitHub Pages.
#
# Only the built site is published (user's decision, 2026-08-03): the gh-pages
# branch is an ORPHAN holding dist/ plus .nojekyll and nothing else - no
# sources, no docs, no tools, and none of the main history's 123 MB (which
# includes a 43.5 MB intermediate heightmap a static host has no use for).
#
# .nojekyll is not optional: without it Pages runs the output through Jekyll,
# which silently skips files and directories beginning with an underscore.
#
# Pages itself needs no configuring - GitHub enables it automatically for a
# branch named gh-pages. (Doing it via the API needs a token with Pages:write,
# which is not worth requesting just for this.)
#
# Usage: tools/dev/deploy.sh
set -euo pipefail

BRANCH=gh-pages
REMOTE=origin
SITE=https://dev-lop77.github.io/pngp-viewer/
WORKTREE="$(git rev-parse --show-toplevel)/.deploy-worktree"

cd "$(git rev-parse --show-toplevel)"

echo "== Building =="
npm run build

echo "== Preparing the $BRANCH worktree =="
# Reuse a stale worktree rather than failing on it - this script gets re-run.
git worktree remove --force "$WORKTREE" 2>/dev/null || true
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git worktree add "$WORKTREE" "$BRANCH" >/dev/null
else
  git worktree add --orphan -b "$BRANCH" "$WORKTREE" >/dev/null
fi

# Replace the site contents wholesale so a renamed/removed asset can't linger.
# Everything except .git and .nojekyll goes, then dist/ is copied in fresh.
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name .git ! -name .nojekyll -exec rm -rf {} +
cp -r dist/. "$WORKTREE"/
touch "$WORKTREE/.nojekyll"
# The README ships with the site (user's decision, 2026-08-05). It is the only
# document that does: gh-pages is the repository's default branch, so this is what
# makes the GitHub page say what the project is and link to the live viewer,
# without reopening the "sources stay local" decision.
cp README.md "$WORKTREE"/

# Refuse to publish anything that isn't the built site. Two independent checks,
# because the single extension blacklist this replaces had already gone wrong:
# it refused every *.png, and the OSM canopy mask (data/forest.<hash>.png) is a
# legitimate data asset - so from the moment the vegetation landed the guard would
# have blocked every deploy, which is exactly the wrong failure direction for
# insurance. A whitelist of what the build produces cannot rot that way.
ALLOWED_TOP='index\.html|assets|data|\.nojekyll|README\.md|\.git'
unexpected="$(find "$WORKTREE" -mindepth 1 -maxdepth 1 -printf '%f\n' | grep -Ev "^($ALLOWED_TOP)$" || true)"
if [ -n "$unexpected" ]; then
  echo "REFUSING TO DEPLOY: unexpected entries at the site root - a stray copy of the sources?" >&2
  echo "$unexpected" >&2
  exit 1
fi
# And nothing that carries source code may appear anywhere inside it. *.map is in
# the list deliberately: a sourcemap publishes the sources it maps back to, so
# turning on build.sourcemap would quietly undo the whole decision.
if find "$WORKTREE" -path "$WORKTREE/.git" -prune -o \
     \( -name '*.mjs' -o -name '*.sh' -o -name '*.map' \) -print | grep -q .; then
  echo "REFUSING TO DEPLOY: found sources in the site payload:" >&2
  find "$WORKTREE" -path "$WORKTREE/.git" -prune -o \
    \( -name '*.mjs' -o -name '*.sh' -o -name '*.map' \) -print >&2
  exit 1
fi

echo "== Publishing =="
git -C "$WORKTREE" add -A
if git -C "$WORKTREE" diff --cached --quiet; then
  echo "Nothing changed since the last deploy - not pushing."
else
  git -C "$WORKTREE" status --short
  git -C "$WORKTREE" commit -q -m "Publish the built viewer

$(git log -1 --format='From %h %s' main 2>/dev/null || echo 'Built site update')"
  git -C "$WORKTREE" push -q "$REMOTE" "$BRANCH"
  echo "Pushed."
fi

git worktree remove --force "$WORKTREE"

echo
echo "Site: $SITE"
echo "Pages usually rebuilds in ~30s. To wait for it and confirm:"
echo "  until curl -sS $SITE | grep -q '<title>'; do sleep 5; done"
echo "  gh api repos/dev-lop77/pngp-viewer/pages/builds/latest --jq '.status'"
echo "Then check the real thing, not just 'built': node tools/verify.mjs $SITE"
