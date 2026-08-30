#!/usr/bin/env bash
# Install the UI/UX Pro Max skill globally for Claude Code.
#
# Containers for Claude Code on the web are ephemeral, so the global install at
# ~/.claude/skills/ is lost when a session ends. This script restores it and is
# safe to re-run: it is a no-op once the skill is present.
set -euo pipefail

SKILL_DIR="${HOME}/.claude/skills/ui-ux-pro-max"

if [ -f "${SKILL_DIR}/SKILL.md" ]; then
  echo "ui-ux-pro-max already installed at ${SKILL_DIR}"
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found; skipping ui-ux-pro-max install" >&2
  exit 0
fi

npm install -g ui-ux-pro-max-cli
uipro init --ai claude --global
