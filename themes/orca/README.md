# Material Stone Theme for Orca

A warm, high-contrast palette for [Orca](https://github.com/stablyai/orca).

These files are generated from [`color.yaml`](../../color.yaml) and
[their templates](../../templates); edit those, not these, and run `bun run build`.

They are written in Warp's theme format, because that is the only theme file
Orca reads. The same two files are Warp themes.

## Installation

Put them where Orca goes looking:

```sh
mkdir -p ~/.warp/themes
cp material-stone-dark.yaml material-stone-light.yaml ~/.warp/themes/
```

Or, from a checkout of this repo, `bun run link` symlinks them there instead —
Orca follows symlinked theme files. Warp does not have to be installed; the
directory only has to exist.

Then, in Orca, *Settings → Terminal → Theme palette → Import from Warp*, select
both and import. The picker above it has a Dark and a Light tab: choose Material
Stone Dark under one and Material Stone Light under the other.

Unlike the other tools here, the import is a copy — the colors are written into
Orca's own settings and stop tracking the file. So `bun run build` is not the
whole update; a rebuild has to be followed by another import. That second import
lands on the entry that is already there and leaves your selection pointing at
it, because the theme's id is built from its name and its filename.

Do not re-import with *Choose File*. That path keys the id off a hash of the
contents instead, so a changed color arrives as a second theme and the selected
one keeps the old colors. *Import from Warp* and *Choose Folder* both key off the
filename.

## Switching

By itself, off Orca's own light/dark mode — not off the terminal background, and
not off the system directly. Orca holds a theme per mode, so the Light tab has to
be told not to reuse the dark one: turn *Match dark mode* off there, then pick
the light theme. With it on, the dark theme is used in both.

Orca's mode is its own setting, which can be System.

## Notes

- Leave *Settings → Terminal → Color Overrides* empty. Whatever it holds is
  painted over the theme that is showing, and there is one map for both modes —
  so a color set while the dark theme is up follows you into the light one.
  *Reset all color overrides* clears it. Note that importing from Ghostty fills
  it: that import writes colors into the override map rather than adding a theme.
- The format carries a background, a foreground, a cursor and the sixteen ANSI
  slots, and nothing else. Orca's own theme record has room for selection and
  cursor-accent colors, but there is no field to import them from, so they arrive
  unset and xterm.js falls back to its defaults.
- ANSI black, bright black, white and bright white hold the same value under both
  variants. They are a contract with every program you run, and the palette
  answers that contract with the same pure values either way rather than moving
  them with the ground — which is why white reads faint on the light canvas.
- Orca is where the terminal background comes from, so this is the file that puts
  the fish theme on its intended ground: `#181513` dark, `#e9e6e3` light.
