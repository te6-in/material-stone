import { expect, test } from "bun:test";

import type { Mode } from "./schema";
import { createResolver, parseTokens } from "./tokens";

const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());

const semantic = Object.keys(tokens).filter((name) => !name.startsWith("$color.palette."));

const MODES = ["theme-dark", "theme-light"] satisfies Mode[];

/**
 * A token at zero alpha draws nothing. Exactly one of them means to: an element
 * whose fill or border is turned off. Anything else that lands there is a
 * control the user cannot see, which is how the focus ring went missing.
 */
test.each(MODES)("only the token that means invisible is invisible in %s", (mode) => {
  const resolve = createResolver(tokens, mode);

  expect(semantic.filter((name) => resolve(name).alpha === 0)).toEqual(["$color.surface.transparent"]);
});

// Both modes, because a role that resolves in one and not the other is a hole in
// exactly one theme — the failure the old shape could not see.
test.each(MODES)("every semantic token resolves in %s", (mode) => {
  const resolve = createResolver(tokens, mode);

  expect(() => semantic.forEach((name) => resolve(name))).not.toThrow();
});
