# Material Stone Theme for Claude Code

A warm, high-contrast palette for [Claude Code](https://claude.com/claude-code).

Dark only for now. This file is generated from [`color.yaml`](../../color.yaml) and
[its template](../../templates); edit those, not this, and run `bun run build`.

## Installation

Copy the theme into Claude Code's theme directory:

```sh
mkdir -p ~/.claude/themes
cp material-stone-dark.json ~/.claude/themes/
```

Then point `~/.claude/settings.json` at it:

```json
{
  "theme": "custom:material-stone-dark"
}
```

## Notes

- Two colors are deliberately not from the palette: `claude` and `claudeShimmer`
  are Anthropic's brand orange.
- Claude Code cannot express alpha, so the diff fills arrive here flattened
  against the canvas. The palette holds them as green and red at `60` and `40`,
  and the generator does the compositing.
- Claude Code paints its own foreground colors but not the terminal background.
  Pair this with a terminal background of `#181513`.
