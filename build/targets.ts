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
 * times. VS Code and Claude Code cannot do that, so their variants are separate
 * files, chosen by hand.
 */
export const TARGETS = [
  {
    template: "templates/claude-code.dark.json",
    output: "themes/claude-code/material-stone-dark.json",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-dark" }],
  },
  {
    template: "templates/claude-code.light.json",
    output: "themes/claude-code/material-stone-light.json",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
    sections: [{ header: null, mode: "theme-light" }],
  },
  {
    template: "templates/fish.theme",
    output: "themes/fish/material-stone.theme",
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
    template: "templates/vscode.dark.json",
    output: "themes/vscode/themes/dark.json",
    hexStyle: "prefixed",
    ground: null,
    sections: [{ header: null, mode: "theme-dark" }],
  },
  {
    template: "templates/vscode.light.json",
    output: "themes/vscode/themes/light.json",
    hexStyle: "prefixed",
    ground: null,
    sections: [{ header: null, mode: "theme-light" }],
  },
] as const satisfies ReadonlyArray<{
  template: string;
  output: string;
  hexStyle: HexStyle;
  ground: string | null;
  sections: ReadonlyArray<{ header: string | null; mode: Mode }>;
}>;

export type Target = (typeof TARGETS)[number];
