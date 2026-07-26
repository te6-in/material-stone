# Material Stone Theme for fish

A warm, high-contrast palette for [fish](https://fishshell.com/).

This file is generated from [`color.yaml`](../../color.yaml) and
[its template](../../templates); edit those, not this, and run `bun run build`.

## Installation

Copy the theme into fish's theme directory, then select it:

```fish
cp material-stone.theme ~/.config/fish/themes/
fish_config theme choose material-stone
```

`choose` applies to the current session, so put that line in
`~/.config/fish/config.fish` to make it stick.

Do not use `fish_config theme save`. It writes the colors to universal
variables, which opts the theme out of following the terminal — fish says as
much in its own docs.

## Switching

By itself. The file carries `[light]`, `[dark]` and `[unknown]` sections; fish
asks the terminal for its background colour, picks the matching one, and
installs a handler that re-picks when the answer changes. Terminals that
support mode 2031 push that change rather than waiting to be asked, so the
colours flip mid-session in every open shell. This needs fish 4.3 or newer.

`[unknown]` is what fish falls back to when the terminal will not answer; it
holds the dark colours. Note that a theme declaring any section at all has to
declare that one too — otherwise `theme choose` fails outright and leaves the
colours untouched, which is worse than picking wrong.

To pin one variant regardless:

```fish
fish_config theme choose material-stone --color-theme=light
```

Whether anything actually switches is up to the terminal. It has to change its
own background between light and dark and report it — in iTerm2 that means
turning on *Use Separate Colors for Light and Dark Mode* and giving the light
side a light preset; Ghostty does it with
`theme = light:material-stone-light,dark:material-stone-dark`.

## Notes

- `fish_color_cwd` and `fish_color_user`/`fish_color_host` only show up in fish's
  default prompt. A custom prompt (starship, tide, …) draws its own colors and
  will not follow the terminal unless you teach it to.
- The prompt background is not fish's to set. Pair the dark variant with a
  terminal background of `#181513`, the light one with `#e9e6e3` — the
  `preferred_background` line in each section says the same thing.
