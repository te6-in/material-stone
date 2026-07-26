import { type HexStyle, type Mode, type Token, splitAlpha } from "./tokens";

const PALETTE = "$color.palette.";
const RAW = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const EXPRESSION = /\$\{[^}]*\}/g;

type Tokens = Record<string, Token>;

/** Every mode a palette entry declares, so two entries can be compared whole. */
const signature = (token: Token) =>
  JSON.stringify(
    Object.entries(token.values)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mode, value]) => [mode, value.toLowerCase()]),
  );

/**
 * The rules the palette has to keep to stay worth having: one entry per idea,
 * every hex in the palette layer, every palette entry earning its place, and
 * no semantic token leaning on another semantic token — a contract must not
 * move because a styling choice did.
 *
 * Two entries count as the same idea only when they agree in every mode. A pair
 * that shares a hex in one theme and splits in another is two ideas that happen
 * to collide once, which is the normal shape of a role the dark theme merged
 * and the light theme keeps apart.
 */
export function lintTokens(tokens: Tokens, mode: Mode) {
  const problems: string[] = [];
  const declaredBy = new Map<string, { hex: string; names: string[] }>();
  const referenced = new Set<string>();

  for (const [name, token] of Object.entries(tokens)) {
    const raw = token.values[mode];
    const isPalette = name.startsWith(PALETTE);

    if (RAW.test(raw)) {
      if (!isPalette) {
        problems.push(`${name} holds a raw value; only the palette layer may`);
        continue;
      }

      const key = signature(token);
      const group = declaredBy.get(key) ?? { hex: raw.toLowerCase(), names: [] };
      declaredBy.set(key, { ...group, names: [...group.names, name] });
      continue;
    }

    const [target] = splitAlpha(raw);
    referenced.add(target);

    if (!isPalette && !target.startsWith(PALETTE))
      problems.push(`${name} points at ${target}; semantic tokens reference the palette directly`);
  }

  for (const { hex, names } of declaredBy.values()) {
    if (names.length > 1) problems.push(`${hex} is declared twice: ${names.join(", ")}`);
  }

  for (const name of Object.keys(tokens)) {
    if (name.startsWith(PALETTE) && !referenced.has(name))
      problems.push(`${name} is unreachable from the semantic layer`);
  }

  return problems;
}

/**
 * A hex that survives into a template is a value the palette will never know
 * about. It is the failure that left tokyonight's Sublime day theme unreadable
 * for two years, so the build reports it — but as a warning, not a wall. A mark
 * that belongs to someone else, like Anthropic's orange, holds one value under
 * every theme and gains nothing from a palette slot that moves with the ground.
 */
export function lintTemplate(template: string, hexStyle: HexStyle) {
  const literal = hexStyle === "bare" ? /#[0-9a-fA-F]{3,8}\b|\b[0-9a-fA-F]{6}\b/g : /#[0-9a-fA-F]{3,8}\b/g;

  return template
    .replace(EXPRESSION, " ")
    .split("\n")
    .flatMap((line, index) =>
      [...line.matchAll(literal)].map((match) => `line ${index + 1} still holds a literal color: ${match[0]}`),
    );
}
