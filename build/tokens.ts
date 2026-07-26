import { type Mode, validateDocument } from "./schema";

export type { Mode };
export type HexStyle = "prefixed" | "bare";

/**
 * Both modes, always. A token that means the same thing in both themes writes
 * the same reference twice rather than leaving a mode out: the pointer is one
 * line either way, and a reader never has to know a rule to see what a token
 * resolves to in the theme they are looking at.
 */
export type Token = { description?: string; values: Record<Mode, string> };

const HEX = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Throws unless the document matches `color.schema.json`. */
export function parseTokens(source: string) {
  const document = Bun.YAML.parse(source) ?? {};
  const problems = validateDocument(document);

  if (problems.length > 0)
    throw new Error(
      ["token document does not match color.schema.json:", ...problems.map((problem) => `  ${problem}`)].join("\n"),
    );

  return document as Record<string, Token>;
}

/** "$color.palette.green-700/60" -> ["$color.palette.green-700", 0x60] */
export function splitAlpha(expression: string): [string, number | null] {
  const slash = expression.lastIndexOf("/");
  if (slash === -1) return [expression, null];

  return [expression.slice(0, slash), Number.parseInt(expression.slice(slash + 1), 16)];
}

export function createResolver(tokens: Record<string, Token>, mode: Mode) {
  // The stack is per call, not per resolver: a lookup that throws must not
  // leave a name behind that makes the next lookup report a phantom cycle.
  function walk(name: string, stack: readonly string[]): { hex: string; alpha: number | null } {
    if (stack.includes(name)) throw new Error(`cycle: ${[...stack, name].join(" -> ")}`);

    const token = tokens[name];
    if (!token) throw new Error(`unknown token ${name}`);

    const raw = token.values[mode];

    if (HEX.test(raw))
      return { hex: raw.slice(0, 7), alpha: raw.length === 9 ? Number.parseInt(raw.slice(7), 16) : null };

    const [reference, alpha] = splitAlpha(raw);
    const inner = walk(reference, [...stack, name]);

    return { hex: inner.hex, alpha: alpha ?? inner.alpha };
  }

  return (name: string) => walk(name, []);
}

export type Resolve = ReturnType<typeof createResolver>;
