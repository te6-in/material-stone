import type { HexStyle } from "./tokens";

const COLOR = {
  prefixed: /#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g,
  bare: /\b([0-9a-fA-F]{6})\b/g,
} as const satisfies Record<HexStyle, RegExp>;

/**
 * Turns a hand-authored theme into the pair the generator eats: the file
 * verbatim with every color swapped for a token expression, and a token
 * document holding those colors. Rendering one through the other has to give
 * the original back byte for byte — that is what proves the generator before
 * the palette is allowed to change anything.
 *
 * Tokens are keyed by the exact spelling, so a file that writes both `#e7e5e4`
 * and `#E7E5E4` gets two entries. That is a wart of the scaffolding, not of
 * the palette, and it disappears with the file.
 *
 * Each entry writes its hex under both modes because the document has to pass
 * the schema like any other. Nothing here reads the light half — a hand-authored
 * file is one theme, and the round trip renders it in one mode.
 */
export function extract(source: string, hexStyle: HexStyle) {
  const names = new Map<string, string>();

  // The patterns differ in arity, so the argument after `hex` is the alpha
  // group for one and the match offset for the other. Check the type, not the
  // position.
  const template = source.replace(COLOR[hexStyle], (_match, hex: string, alpha: unknown) => {
    const name = `$color.palette.auto-${hex}`;
    names.set(hex, name);

    return `\${${name}${typeof alpha === "string" ? `/${alpha}` : ""}}`;
  });

  const entries = [...names]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hex, name]) => `${name}:\n  values:\n    theme-dark: "#${hex}"\n    theme-light: "#${hex}"`);

  return { template, tokens: entries.join("\n") };
}
