#!/usr/bin/env bash
# Collapse the published branch's history to a single commit, WITHOUT changing a byte of
# what is published.
#
# WHY THIS EXISTS, and READ THE SECOND PARAGRAPH BEFORE REACHING FOR IT. gh-pages carries
# the built site including the binary heightfields, and its history is never rewritten, so
# every rebuild of the terrain tier or the ground photo leaves its superseded copy behind
# for ever. gh-pages is the one branch where nothing is lost by forgetting: it holds build
# OUTPUT, reproducible from main by tools/dev/deploy.sh, and not one of its commits is
# worth reading.
#
# BUT IT RECOVERS FAR LESS THAN RAW BLOB SUMS SUGGEST, and the first run of this script is
# the evidence. Measured 2026-08-17: gh-pages' history held 107.0 MB of blob content
# against main's 37.1 MB, which looked like 70 MB of accumulated waste. Collapsing 13
# commits into 1 recovered THREE megabytes - .git went 74 -> 71 MB. Git delta-compresses
# near-duplicate binaries extremely well, so the superseded copies were nearly free
# already, and a sum of uncompressed blob sizes is not a measure of what a pack costs.
#
# What .git actually holds is the site itself: the CURRENT published tree is 77.2 MB in 19
# files, half of it the 38.1 MB five-metre tier level, and main alone packs to 14 MB. So if
# the repository feels large, the size is the published assets and not history - do not
# come here expecting otherwise. The lever that would work is not keeping gh-pages locally
# at all (deploy.sh recreates it as an orphan when absent), which trades ~56 MB of disk for
# fetching the branch on every deploy. The user chose to keep it, 2026-08-17.
#
# WHAT MAKES THIS SAFE, and it is worth understanding before running it on the branch the
# public actually fetches: the new commit is built with `git commit-tree` from the EXISTING
# tree object, with no parents. Nothing is rebuilt, nothing is copied, no file is written.
# The tree hash is therefore identical by construction, which is the strongest statement
# available that the published content did not change - a tree hash covers every path and
# every byte under it. The script asserts it anyway, and refuses to push if it differs.
#
# It also refuses when the local branch and the remote disagree, because then the local
# history is not the published one and collapsing it would publish something else.
#
# gh-pages is this repo's DEFAULT branch and is unprotected, so the force-push does go
# through. The old history is kept locally under refs/backup/ and can be pushed back.
#
# Usage: tools/dev/reset-gh-pages.sh [--yes]
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

BRANCH=gh-pages
REMOTE=origin

command -v git >/dev/null || { echo 'no git' >&2; exit 1; }

git show-ref --verify --quiet "refs/heads/$BRANCH" \
  || { echo "No local $BRANCH branch - nothing to collapse." >&2; exit 1; }

LOCAL="$(git rev-parse "$BRANCH")"
REMOTE_HASH="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | cut -f1)"
if [ -z "$REMOTE_HASH" ]; then
  echo "No $BRANCH on $REMOTE - deploy first." >&2
  exit 1
fi
if [ "$LOCAL" != "$REMOTE_HASH" ]; then
  echo "REFUSING: local $BRANCH is $LOCAL but $REMOTE has $REMOTE_HASH." >&2
  echo "Fetch or deploy until they agree - otherwise this would publish local state" >&2
  echo "under the guise of only collapsing history." >&2
  exit 1
fi

TREE="$(git rev-parse "$BRANCH^{tree}")"
COUNT="$(git rev-list --count "$BRANCH")"
if [ "$COUNT" -le 1 ]; then
  echo "$BRANCH already has $COUNT commit - nothing to collapse."
  exit 0
fi

BLOBS_MB="$(git rev-list --objects "$BRANCH" \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '/^blob/ {s+=$3} END {printf "%.1f", s/1048576}')"

echo "== $BRANCH: $COUNT commits, ${BLOBS_MB} MB of blob content in its history"
echo "   tree $TREE  (this is what stays identical)"
echo "   $(git ls-tree -r --name-only "$BRANCH" | wc -l) published files"

if [ "${1:-}" != "--yes" ]; then
  printf 'Collapse to one commit and force-push? [y/N] '
  read -r reply
  case "$reply" in y | Y | yes) ;; *) echo 'Aborted.'; exit 0 ;; esac
fi

BACKUP="refs/backup/$BRANCH-$(git log -1 --format=%cd --date=format:%Y%m%d-%H%M%S "$BRANCH")"
git update-ref "$BACKUP" "$LOCAL"
echo "== Old history kept at $BACKUP ($LOCAL)"
echo "   to put it back:  git update-ref refs/heads/$BRANCH $LOCAL && git push --force $REMOTE $BRANCH"

# The whole operation: one root commit, same tree, no parents.
NEW="$(git commit-tree "$TREE" -m "Publish the built viewer

History collapsed to a single commit by tools/dev/reset-gh-pages.sh. The tree is
byte-identical to the $COUNT commits it replaces - this branch holds build output,
reproducible from main, and its history only accumulated ${BLOBS_MB} MB of superseded
binaries.")"

NEW_TREE="$(git rev-parse "$NEW^{tree}")"
if [ "$NEW_TREE" != "$TREE" ]; then
  echo "REFUSING TO PUSH: the new commit's tree is $NEW_TREE, not $TREE." >&2
  exit 1
fi
echo "== New root commit $NEW, tree verified identical"

git update-ref "refs/heads/$BRANCH" "$NEW"
git push --force "$REMOTE" "$BRANCH"
echo "== Pushed."

PUSHED="$(git ls-remote "$REMOTE" "refs/heads/$BRANCH" | cut -f1)"
[ "$PUSHED" = "$NEW" ] || { echo "REMOTE MISMATCH: $PUSHED != $NEW" >&2; exit 1; }
echo "== $REMOTE now at $PUSHED, one commit, same tree"
echo
echo "The old objects are unreachable locally now. To reclaim the space:"
echo "  git reflog expire --expire=now --all && git gc --prune=now"
echo "That also drops $BACKUP, so do it only once the live site has been checked:"
echo "  node tools/verify.mjs https://dev-lop77.github.io/pngp-viewer/"
