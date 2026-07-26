const MODES = ["theme-light", "theme-dark"] as const;

export type Mode = (typeof MODES)[number];
export type HexStyle = "prefixed" | "bare";

export type Token = { description?: string; values: Partial<Record<Mode, string>> };

const HEX = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function parseTokens(source: string) {
  const doc = Bun.YAML.parse(source) as { kind?: string; data?: { tokens?: Record<string, Token> } } | null;
  if (doc?.kind !== "Tokens") throw new Error("not a Tokens document");

  return doc.data?.tokens ?? {};
}

/** "$color.palette.green-700/60" -> ["$color.palette.green-700", 0x60] */
export function splitAlpha(expression: string): [string, number | null] {
  const slash = expression.lastIndexOf("/");
  if (slash === -1) return [expression, null];

  return [expression.slice(0, slash), Number.parseInt(expression.slice(slash + 1), 16)];
}

/**
 * Which palette entry a role points at is the semantic decision, and it holds in
 * every mode — only the palette layer is written per mode. So a token that
 * declares a reference under one mode and nothing under another points at the
 * same entry in both, and a role that genuinely needs a different entry in one
 * mode says so explicitly. A hex carries no such reading: a mode that wants one
 * has to spell it out.
 */
export function valueFor(token: Token, mode: Mode) {
  const own = token.values[mode];
  if (own !== undefined) return own;

  const references = [...new Set(Object.values(token.values).filter((value) => !HEX.test(value)))];

  return references.length === 1 ? references[0] : undefined;
}

export function createResolver(tokens: Record<string, Token>, mode: Mode) {
  // The stack is per call, not per resolver: a lookup that throws must not
  // leave a name behind that makes the next lookup report a phantom cycle.
  function walk(name: string, stack: readonly string[]): { hex: string; alpha: number | null } {
    if (stack.includes(name)) throw new Error(`cycle: ${[...stack, name].join(" -> ")}`);

    const token = tokens[name];
    if (!token) throw new Error(`unknown token ${name}`);

    const raw = valueFor(token, mode);
    if (raw === undefined) throw new Error(`${name} has no ${mode} value`);

    if (HEX.test(raw))
      return { hex: raw.slice(0, 7), alpha: raw.length === 9 ? Number.parseInt(raw.slice(7), 16) : null };

    const [reference, alpha] = splitAlpha(raw);
    const inner = walk(reference, [...stack, name]);

    return { hex: inner.hex, alpha: alpha ?? inner.alpha };
  }

  return (name: string) => walk(name, []);
}

export type Resolve = ReturnType<typeof createResolver>;
