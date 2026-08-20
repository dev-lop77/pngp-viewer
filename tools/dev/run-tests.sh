#!/usr/bin/env bash
# Run the browser test suite, timing every test, with a FAST subset for the case that
# comes up most: checking a change before publishing.
#
# The user's instruction, 2026-08-17: "per la prossima pubblicazione esegui solo i test
# veloci e lancia i test completi solo su specifica richiesta od esigenza di (pre)
# debug." So --fast is the default and the whole suite is opt-in.
#
# WHY the suite is slow at all, since it is worth not misdiagnosing: headless Chromium
# here is SwiftShader at about 1 frame per second, so every browser test pays for a
# software rasteriser. The deliberate waitForTimeout calls add up to only ~2.5 min
# across the suite, so trimming sleeps would not fix it.
#
# THE SPLIT IS MEASURED, NOT GUESSED, and guessing would have got it wrong: test-sky
# has almost no deliberate waits and still takes six minutes, while test-groundcover's
# 33 s of sleeps are a tenth of its runtime. Durations from a clean full run on
# 2026-08-17 (14:38-14:59, one test at a time, nothing else on the machine):
#
#     rendered-height     1 s     controls-focus    156 s
#     wildlife           12 s     viewstate         167 s*
#     birds              14 s     height-tier       172 s
#     mouselook          15 s     groundcover       334 s
#     terrain-albedo     49 s     sky               356 s
#     nowebgl             2 s     ortho-viewstate   207 s
#
# * viewstate's 167 s is from 2026-08-17 and it now needs ten minutes: it opens a second page
#   and two WebGL contexts on one software rasteriser do not share it (13 s against 528 for
#   the same spawn). It had stopped passing at all and nobody knew, because a slow test that
#   is never asked for is a test that has stopped running.
#     vegetation         59 s
#     snow               64 s
#     basemap            65 s
#
# test-audio is the one still without a number of its own: it ran before timing began.
# It holds 53 s of deliberate sleeps, more than any other, so it is treated as slow
# until measured. test-controls-focus WAS in the fast list on the first pass, on no
# evidence, and its own measurement moved it out - which is the point of recording these.
#
# Every run appends its own timings to tools/dev/logs/test-times.tsv, so the lists
# below can be corrected from data instead of from memory. If a test crosses the line,
# move it - do not let this comment and the list disagree.
#
# Usage:
#   tools/dev/run-tests.sh              # fast subset (the default)
#   tools/dev/run-tests.sh --all        # every test
#   tools/dev/run-tests.sh --slow       # only the slow ones
#   tools/dev/run-tests.sh test-sky     # any explicit list
#
# Requires the dev server: tools/dev/start-dev.sh
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# Over ~2 minutes on the reference run. These are the ones a publish check skips.
SLOW=(test-sky test-groundcover test-height-tier test-viewstate test-controls-focus)
# 207 s on 2026-08-20, so it crosses the line the moment it is written - three full page
# loads, because "and it is still on when you come back" cannot be tested with fewer. Moved
# here by the rule six lines up rather than left in the fast list because it is new and
# convenient. The cost is real and worth stating: a publish check no longer covers the
# orthophoto's switch. Acceptable while that switch is off by default and unpublished.
SLOW+=(test-ortho-viewstate)
# Not timed on the reference run, and audio alone holds 53 s of deliberate sleeps, so
# it is treated as slow until it has a number of its own.
SLOW+=(test-audio)

LOG_DIR=tools/dev/logs
mkdir -p "$LOG_DIR"
TIMES="$LOG_DIR/test-times.tsv"
[ -s "$TIMES" ] || printf 'when\ttest\tseconds\tresult\n' > "$TIMES"

is_slow() { for s in "${SLOW[@]}"; do [ "$1" = "$s" ] && return 0; done; return 1; }

MODE=fast
EXPLICIT=()
for a in "$@"; do
  case "$a" in
    --all) MODE=all ;;
    --fast) MODE=fast ;;
    --slow) MODE=slow ;;
    -*) echo "unknown flag: $a" >&2; exit 2 ;;
    *) EXPLICIT+=("$a") ;;
  esac
done

TESTS=()
if [ "${#EXPLICIT[@]}" -gt 0 ]; then
  MODE=explicit
  for name in "${EXPLICIT[@]}"; do TESTS+=("tools/${name%.mjs}.mjs"); done
else
  for f in tools/test-*.mjs; do
    base="$(basename "$f" .mjs)"
    case "$MODE" in
      all) TESTS+=("$f") ;;
      fast) is_slow "$base" || TESTS+=("$f") ;;
      slow) is_slow "$base" && TESTS+=("$f") ;;
    esac
  done
fi

if ! curl -sS -o /dev/null http://localhost:5173/ 2>/dev/null; then
  echo "No dev server on :5173 - run tools/dev/start-dev.sh first." >&2
  exit 1
fi

echo "== $MODE: ${#TESTS[@]} test(s) =="
[ "$MODE" = fast ] && echo "   SKIPPING (slow): ${SLOW[*]}"
echo

failed=()
started=$(date +%s)
for t in "${TESTS[@]}"; do
  base="$(basename "$t" .mjs)"
  printf '%-26s ' "$base"
  t0=$(date +%s)
  if out="$(node "$t" 2>&1)"; then
    result=PASS
  else
    result=FAIL
    failed+=("$base")
  fi
  secs=$(( $(date +%s) - t0 ))
  printf '%s  %4ds\n' "$result" "$secs"
  printf '%s\t%s\t%s\t%s\n' "$(date -Is)" "$base" "$secs" "$result" >> "$TIMES"
  # Only a failure's output is worth printing; a pass is its own report.
  [ "$result" = FAIL ] && printf '%s\n' "$out" | tail -25
done

echo
echo "== $((  $(date +%s) - started ))s total, ${#TESTS[@]} run, ${#failed[@]} failed =="
if [ "${#failed[@]}" -gt 0 ]; then
  printf 'FAILED: %s\n' "${failed[*]}"
  exit 1
fi
# Never let a fast run be mistaken for full coverage.
[ "$MODE" = fast ] && echo "This was the FAST subset. Not run: ${SLOW[*]}"
exit 0
