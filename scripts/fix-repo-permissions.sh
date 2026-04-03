#!/usr/bin/env bash
# Fix EACCES on dist/.next after Docker or sudo wrote into the repo (common: root-owned packages/*/dist).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
U="$(id -un)"
G="$(id -gn)"

fix_tree() {
  local p="$1"
  [[ -e "$p" ]] || return 0
  if chown -R "$U:$G" "$p" 2>/dev/null; then
    echo "chown OK: $p"
  else
    echo "Need elevated chown for: $p"
    sudo chown -R "$U:$G" "$p"
    echo "chown OK (sudo): $p"
  fi
}

echo "Repo: $ROOT"
for p in \
  "$ROOT/packages/shared/dist" \
  "$ROOT/packages/ui/dist" \
  "$ROOT/apps/web/.next" \
  "$ROOT/apps/crm/.next" \
  "$ROOT/apps/api/node_modules/.prisma"; do
  fix_tree "$p"
done

echo "Done. If turbo still hits EACCES, run: sudo chown -R $U:$G $ROOT/packages $ROOT/apps"
