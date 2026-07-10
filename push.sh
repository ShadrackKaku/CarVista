#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# CarVista — one-step push helper
# Pushes this repo to your GitHub branch using YOUR git credentials.
#
# Usage:
#   ./push.sh
#
# Prerequisites: git installed, and either
#   • a credential helper / cached login, or
#   • run `gh auth login` first (GitHub CLI), or
#   • have a Personal Access Token ready to paste when prompted.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/ShadrackKaku/CarVista.git"
BRANCH="claude/ghana-automotive-marketplace-exjc37"

# Initialise git if this was extracted without history.
if [ ! -d .git ]; then
  echo "→ No git history found; initialising a fresh repository…"
  git init
  git add -A
  git commit -m "CarVista: Ghana automotive marketplace & import platform"
  git branch -M "$BRANCH"
fi

# Ensure the remote points at your repo.
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "→ Pushing branch '$BRANCH' to $REPO_URL"
git push -u origin "$BRANCH"

echo "✓ Done. View your branch at: https://github.com/ShadrackKaku/CarVista/tree/$BRANCH"
