# Material Stone Theme for fish

A warm, high-contrast palette for [fish](https://fishshell.com/).

Dark only for now. This file is generated from [`color.yaml`](../../color.yaml) and
[its template](../../templates); edit those, not this, and run `bun run build`.

## Installation

Copy the theme into fish's theme directory, then select it:

```fish
cp material-stone-dark.theme ~/.config/fish/themes/
fish_config theme choose material-stone-dark
```

`choose` only applies to the current session. To make it stick, either add the
`fish_config theme choose` line to `~/.config/fish/config.fish`, or write the
colors to universal variables once:

```fish
fish_config theme save material-stone-dark
```

## Notes

- `fish_color_cwd` and `fish_color_user`/`fish_color_host` only show up in fish's
  default prompt. A custom prompt (starship, tide, …) draws its own colors.
- The prompt background is not fish's to set. Pair this with a terminal
  background of `#181513`.
