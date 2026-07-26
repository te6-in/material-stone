# Material Stone Theme for Claude Code

A warm, high-contrast palette for [Claude Code](https://claude.com/claude-code).

These files are generated from [`color.yaml`](../../color.yaml) and
[their templates](../../templates); edit those, not these, and run `bun run build`.

## Installation

Copy the themes into Claude Code's theme directory:

```sh
mkdir -p ~/.claude/themes
cp material-stone-dark.json material-stone-light.json ~/.claude/themes/
```

Or, from a checkout of this repo, `bun run link` symlinks them there instead —
then `bun run build` is the whole update, and Claude Code's watcher picks it up
without a restart.

Then pick one with `/theme`, or name it in `~/.claude/settings.json`:

```json
{
  "theme": "custom:material-stone-dark"
}
```

The name after `custom:` is the filename without `.json`, not the `name` field
inside the file.

## Switching

By hand. Claude Code's `Auto (match terminal)` reads the terminal background and
picks between its own built-in presets; it never chooses between two custom
themes, and a custom theme is pinned to whatever `base` its file declares. There
is no environment variable for it either — `/theme` and `settings.json` are the
two ways in.

If you want it to follow something automatically, keep one
`~/.claude/themes/material-stone.json` and have a script overwrite its contents
with the light or the dark body. Claude Code watches that directory and reloads
the theme into every running session, so the swap lands without a restart. Flip
the `base` field along with the colors.

## Notes

- Four colors are deliberately not from the palette: `claude`, `claudeShimmer`,
  `clawd_body` and `briefLabelClaude` are Anthropic's brand orange, and they hold
  the same value under both variants. A mark that belongs to someone else does
  not answer to the ground a theme is standing on.
- Claude Code cannot express alpha, so the diff fills arrive here flattened
  against the canvas. The palette holds them as green and red at `60` and `40`,
  and the generator does the compositing — against each variant's own canvas.
- Claude Code paints its own foreground colors but not the terminal background.
  Pair the dark variant with a terminal background of `#181513`, the light one
  with `#e9e6e3`.
