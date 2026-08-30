# VectroniaOne

## UI/UX Pro Max skill

The [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill
is installed globally for Claude Code (`~/.claude/skills/`) via its npm CLI:

```bash
npm install -g ui-ux-pro-max-cli
uipro init --ai claude --global
```

`scripts/setup-ui-ux-pro-max.sh` performs that install and runs automatically on
`SessionStart` (see `.claude/settings.json`), so ephemeral containers get the
skill back without any manual step. Running it again when the skill is already
present is a no-op.

The skill's search scripts need Python 3.x (standard library only).
