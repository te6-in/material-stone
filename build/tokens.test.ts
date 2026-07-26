import { describe, expect, test } from "bun:test";

import { createResolver, parseTokens } from "./tokens";

const entry = (name: string, dark: string) => `${name}:\n  values:\n    theme-dark: ${dark}`;

const GREEN = entry("$color.palette.green-700", '"#c3e294"');

describe("parseTokens", () => {
  test("returns every declared token", () => {
    const tokens = parseTokens([GREEN, entry("$color.state.added", "$color.palette.green-700")].join("\n"));

    expect(Object.keys(tokens)).toEqual(["$color.palette.green-700", "$color.state.added"]);
  });
});

describe("resolve", () => {
  test("returns the value of a palette token", () => {
    const resolve = createResolver(parseTokens(GREEN), "theme-dark");

    expect(resolve("$color.palette.green-700")).toEqual({ hex: "#c3e294", alpha: null });
  });

  test("follows a reference", () => {
    const resolve = createResolver(parseTokens([GREEN, entry("$color.state.added", "$color.palette.green-700")].join("\n")), "theme-dark");

    expect(resolve("$color.state.added")).toEqual({ hex: "#c3e294", alpha: null });
  });

  test("follows a chain of references", () => {
    const resolve = createResolver(
      parseTokens(
        [
          GREEN,
          entry("$color.spectrum.green", "$color.palette.green-700"),
          entry("$color.state.added", "$color.spectrum.green"),
        ].join("\n"),
      ),
      "theme-dark",
    );

    expect(resolve("$color.state.added")).toEqual({ hex: "#c3e294", alpha: null });
  });

  test("carries the alpha written on a reference", () => {
    const resolve = createResolver(parseTokens([GREEN, entry("$color.diff.added-fill", "$color.palette.green-700/60")].join("\n")), "theme-dark");

    expect(resolve("$color.diff.added-fill")).toEqual({ hex: "#c3e294", alpha: 0x60 });
  });

  test("inherits the alpha of the token it points at", () => {
    const resolve = createResolver(
      parseTokens(
        [
          GREEN,
          entry("$color.diff.added-fill", "$color.palette.green-700/60"),
          entry("$color.diff.alias", "$color.diff.added-fill"),
        ].join("\n"),
      ),
      "theme-dark",
    );

    expect(resolve("$color.diff.alias")).toEqual({ hex: "#c3e294", alpha: 0x60 });
  });

  test("lets the nearer alpha win over an inherited one", () => {
    const resolve = createResolver(
      parseTokens(
        [
          GREEN,
          entry("$color.diff.added-fill", "$color.palette.green-700/60"),
          entry("$color.diff.alias", "$color.diff.added-fill/20"),
        ].join("\n"),
      ),
      "theme-dark",
    );

    expect(resolve("$color.diff.alias")).toEqual({ hex: "#c3e294", alpha: 0x20 });
  });

  test("reads eight-digit hex as a color plus alpha", () => {
    const resolve = createResolver(parseTokens(entry("$color.palette.veil", '"#c3e29460"')), "theme-dark");

    expect(resolve("$color.palette.veil")).toEqual({ hex: "#c3e294", alpha: 0x60 });
  });

  test("throws on an unknown token", () => {
    const resolve = createResolver(parseTokens(GREEN), "theme-dark");

    expect(() => resolve("$color.palette.nope")).toThrow(/unknown token \$color\.palette\.nope/);
  });

  test("throws on a reference cycle", () => {
    const resolve = createResolver(
      parseTokens([entry("$color.a", "$color.b"), entry("$color.b", "$color.a")].join("\n")),
      "theme-dark",
    );

    expect(() => resolve("$color.a")).toThrow(/cycle/);
  });

  test("throws when the token has no value for the mode", () => {
    const resolve = createResolver(parseTokens(GREEN), "theme-light");

    expect(() => resolve("$color.palette.green-700")).toThrow(/no theme-light value/);
  });

  test("carries a reference into a mode the token does not declare", () => {
    const light = '$color.palette.green-700:\n  values:\n    theme-light: "#4c6b1d"';
    const resolve = createResolver(parseTokens([light, entry("$color.state.added", "$color.palette.green-700")].join("\n")), "theme-light");

    expect(resolve("$color.state.added")).toEqual({ hex: "#4c6b1d", alpha: null });
  });

  test("does not carry a hex into a mode the token does not declare", () => {
    const resolve = createResolver(parseTokens([GREEN, entry("$color.state.added", "$color.palette.green-700")].join("\n")), "theme-light");

    expect(() => resolve("$color.state.added")).toThrow(/\$color\.palette\.green-700 has no theme-light value/);
  });

  test("keeps working after a failed lookup", () => {
    const resolve = createResolver(parseTokens([GREEN, entry("$color.state.added", "$color.palette.missing")].join("\n")), "theme-dark");

    expect(() => resolve("$color.state.added")).toThrow(/unknown token/);
    expect(resolve("$color.palette.green-700")).toEqual({ hex: "#c3e294", alpha: null });
  });
});
