import type { HexStyle, Mode } from "./tokens";

/**
 * Every file the generator owns. `ground` is the token whose value alpha
 * flattens against, or null where the target can carry alpha itself. It is a
 * reference rather than a hex so a change to the canvas moves the composites
 * with it.
 *
 * Dark only. The light VS Code theme is still hand-authored.
 */
export const TARGETS = [
  {
    template: "templates/claude-code.json",
    output: "themes/claude-code/material-stone-dark.json",
    mode: "theme-dark",
    hexStyle: "prefixed",
    ground: "$color.surface.canvas",
  },
  {
    template: "templates/fish.theme",
    output: "themes/fish/material-stone-dark.theme",
    mode: "theme-dark",
    hexStyle: "bare",
    ground: "$color.surface.canvas",
  },
  {
    template: "templates/vscode.dark.json",
    output: "themes/vscode/themes/dark.json",
    mode: "theme-dark",
    hexStyle: "prefixed",
    ground: null,
  },
] as const satisfies ReadonlyArray<{
  template: string;
  output: string;
  mode: Mode;
  hexStyle: HexStyle;
  ground: string | null;
}>;

export type Target = (typeof TARGETS)[number];
