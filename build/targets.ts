import type { HexStyle, Mode } from "./tokens";

/**
 * Every file the generator owns. `ground` is the token whose value alpha
 * flattens against, or null where the target can carry alpha itself. It is a
 * reference rather than a hex so a change to the canvas moves the composites
 * with it.
 *
 * `sections` is one rendering of the template each, laid end to end. Most files
 * hold a single theme and have one unnamed section. A fish theme holds every
 * theme it might be asked for at once, under `[light]`, `[dark]` and
 * `[unknown]` headers, and fish picks between them from the terminal
 * background — so there the same body is written once and rendered three
 * times. Orca takes two files and picks between them itself, off the app's own
 * light/dark mode. VS Code and Claude Code cannot do either, so their variants
 * are separate files, chosen by hand.
 *
 * `install` is the directory under $HOME the tool reads its themes from, so
 * `bun run link` can put the generated file where the tool will find it. VS
 * Code's is null: it installs from the marketplace, and linking a checkout over
 * that would only shadow the published extension. Orca's is the weaker sense of
 * the word: `~/.warp/themes` is where it goes looking for themes to import, and
 * an import copies the colors into its own settings, so a rebuild has to be
 * followed by a re-import to land.
 */
export const TARGETS = [
  {
    template: "templates/claude-code.dark.json",
    output: "themes/claude-code/material-stone-dark.json",
    install: ".claude/themes",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-dark" }],
  },
  {
    template: "templates/claude-code.light.json",
    output: "themes/claude-code/material-stone-light.json",
    install: ".claude/themes",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-light" }],
  },
  {
    template: "templates/fish.theme",
    output: "themes/fish/material-stone.theme",
    install: ".config/fish/themes",
    hexStyle: "bare",
    ground: "$color.surface.canvas",
    sections: [
      { header: "light", mode: "theme-light" },
      { header: "dark", mode: "theme-dark" },
      // Where fish lands when the terminal will not say what it is. A theme
      // that declares any section at all has to answer this one too, or
      // `theme choose` fails and leaves the colors untouched.
      { header: "unknown", mode: "theme-dark" },
    ],
  },
  {
    template: "templates/orca.dark.yaml",
    output: "themes/orca/material-stone-dark.yaml",
    install: ".warp/themes",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-dark" }],
  },
  {
    template: "templates/orca.light.yaml",
    output: "themes/orca/material-stone-light.yaml",
    install: ".warp/themes",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-light" }],
  },
  {
    template: "templates/vscode.dark.json",
    output: "themes/vscode/themes/dark.json",
    install: null,
    hexStyle: "prefixed",
    ground: null,
    sections: [{ header: null, mode: "theme-dark" }],
  },
  {
    template: "templates/vscode.light.json",
    output: "themes/vscode/themes/light.json",
    install: null,
    hexStyle: "prefixed",
    ground: null,
    sections: [{ header: null, mode: "theme-light" }],
  },
] as const satisfies ReadonlyArray<{
  template: string;
  output: string;
  hexStyle: HexStyle;
  ground: string | null;
  install: string | null;
  sections: ReadonlyArray<{ header: string | null; mode: Mode }>;
}>;

export type Target = (typeof TARGETS)[number];
