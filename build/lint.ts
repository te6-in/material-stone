import { type HexStyle, type Mode, splitAlpha } from "./tokens";

const PALETTE = "$color.palette.";
const RAW = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const EXPRESSION = /\$\{[^}]*\}/g;

type Tokens = Record<string, { values: Partial<Record<Mode, string>> }>;

/**
 * The rules the palette has to keep to stay worth having: one hex per idea,
 * every hex in the palette layer, every palette entry earning its place, and
 * no semantic token leaning on another semantic token — a contract must not
 * move because a styling choice did.
 */
export function lintTokens(tokens: Tokens, mode: Mode) {
  const problems: string[] = [];
  const declaredBy = new Map<string, string[]>();
  const referenced = new Set<string>();

  for (const [name, token] of Object.entries(tokens)) {
    const raw = token.values[mode];
    if (raw === undefined) continue;

    const isPalette = name.startsWith(PALETTE);

    if (RAW.test(raw)) {
      if (!isPalette) problems.push(`${name} holds a raw value; only the palette layer may`);
      else declaredBy.set(raw.toLowerCase(), [...(declaredBy.get(raw.toLowerCase()) ?? []), name]);
      continue;
    }

    const [target] = splitAlpha(raw);
    referenced.add(target);

    if (!isPalette && !target.startsWith(PALETTE))
      problems.push(`${name} points at ${target}; semantic tokens reference the palette directly`);
  }

  for (const [hex, names] of declaredBy) {
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
 * for two years.
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
