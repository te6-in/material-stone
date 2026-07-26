# Material Stone Theme for Claude Code

A warm, high-contrast palette for [Claude Code](https://claude.com/claude-code).

Dark only for now. Every color is a value taken from [the Visual Studio Code theme](../vscode/themes/dark.json), which is the source of truth for the palette.

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
- The diff backgrounds have no opaque counterpart in the Visual Studio Code
  theme, which layers them as `#c3e29460` / `#e97c8260` over the editor
  background. They are those composites flattened against `#181513`, with the
  dimmed pair at the `40` alpha the theme uses for overview-ruler marks.
- Claude Code paints its own foreground colors but not the terminal background.
  Pair this with a terminal background of `#181513`.
