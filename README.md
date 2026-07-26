# Material Stone

A warm, high-contrast palette.

## Installation

- [Visual Studio Code](./themes/vscode/README.md)
  - [Marketplace](https://marketplace.visualstudio.com/items?itemName=te6.material-stone)
- [Claude Code](./themes/claude-code/README.md)
- [fish](./themes/fish/README.md)

## Palette

[`color.yaml`](./color.yaml) is the source of truth, and holds every hex the
themes are built from bar one: Anthropic's orange is written straight into the
Claude Code template, because a mark that belongs to someone else does not
answer to the ground a theme is standing on. It has two layers: a palette of raw
values named by hue and by distance from the background, and semantic tokens
that each point at one palette entry. Role groups stay independent even where they land on the same value —
`ansi.red` is a contract with every program you run, `syntax.tag` is a styling
choice, and one must not move because the other did.

Every theme file under `themes/` is generated. Each has a template in
[`templates/`](./templates) that is its native format verbatim, with token
expressions where the colors go, so nothing about a tool's file needs modeling:
modifier flags, scope arrays, and repeated keys survive untouched. Targets that
cannot express alpha get it flattened against a ground they declare.

```sh
bun run build   # regenerate every theme
bun run check   # fail if a generated file no longer matches its template
bun test
```

Every tool gets both variants, from one palette between them: a semantic token
names its palette entry once and that pointer holds in both themes, so only the
palette layer is written twice.

How the two arrive depends on what the tool can do with them. fish reads the
terminal's background and switches itself, so its variants live in one file
under `[light]`, `[dark]` and `[unknown]` headers and the generator renders the
same template once per section. VS Code and Claude Code cannot choose, so theirs
are separate files and picking one is a setting you change by hand.

## Screenshots

![Screenshot of the light variant](./static/light.png)
![Screenshot of the dark variant](./static/dark.png)
