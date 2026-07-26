import { expect, test } from "bun:test";

import { createResolver, parseTokens } from "./tokens";

const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());
const resolve = createResolver(tokens, "theme-dark");

const semantic = Object.keys(tokens).filter((name) => !name.startsWith("$color.palette."));

/**
 * A token at zero alpha draws nothing. Exactly one of them means to: an element
 * whose fill or border is turned off. Anything else that lands there is a
 * control the user cannot see, which is how the focus ring went missing.
 */
test("only the token that means invisible is invisible", () => {
  expect(semantic.filter((name) => resolve(name).alpha === 0)).toEqual(["$color.surface.transparent"]);
});

test("every semantic token resolves", () => {
  expect(() => semantic.forEach((name) => resolve(name))).not.toThrow();
});
