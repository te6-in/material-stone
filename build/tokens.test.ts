import { describe, expect, test } from "bun:test";

import { createResolver, parseTokens } from "./tokens";

/** Both modes, because a token that declares one is not a token the schema takes. */
const entry = (name: string, value: string) =>
  `${name}:\n  values:\n    theme-dark: ${value}\n    theme-light: ${value}`;

/** The one shape worth spelling out by hand: a slot whose themes disagree. */
const split = (name: string, dark: string, light: string) =>
  `${name}:\n  values:\n    theme-dark: ${dark}\n    theme-light: ${light}`;

const GREEN = split("$color.palette.green-700", '"#c3e294"', '"#4c6b1d"');

describe("parseTokens", () => {
  test("returns every declared token", () => {
    const tokens = parseTokens([GREEN, entry("$color.state.added", "$color.palette.green-700")].join("\n"));

    expect(Object.keys(tokens)).toEqual(["$color.palette.green-700", "$color.state.added"]);
  });

  test("reads an empty document as no tokens", () => {
    expect(parseTokens("")).toEqual({});
  });

  test("throws on a token that declares only one mode", () => {
    const half = '$color.palette.green-700:\n  values:\n    theme-dark: "#c3e294"';

    expect(() => parseTokens(half)).toThrow(/\$color\.palette\.green-700 declares no theme-light/);
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

  // The whole reason the pointer is written twice: the role is the same in both
  // themes and the value it lands on is not.
  test("reads the mode's own end of the slot the reference names", () => {
    const tokens = parseTokens([GREEN, entry("$color.state.added", "$color.palette.green-700")].join("\n"));

    expect(createResolver(tokens, "theme-dark")("$color.state.added")).toEqual({ hex: "#c3e294", alpha: null });
    expect(createResolver(tokens, "theme-light")("$color.state.added")).toEqual({ hex: "#4c6b1d", alpha: null });
  });

  test("lets a role point at a different slot in each mode", () => {
    const resolve = createResolver(
      parseTokens(
        [
          GREEN,
          split("$color.palette.red-700", '"#e97c82"', '"#83161c"'),
          split("$color.state.added", "$color.palette.green-700", "$color.palette.red-700"),
        ].join("\n"),
      ),
      "theme-light",
    );

    expect(resolve("$color.state.added")).toEqual({ hex: "#83161c", alpha: null });
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
      parseTokens(
        [entry("$color.state.error", "$color.state.deleted"), entry("$color.state.deleted", "$color.state.error")].join("\n"),
      ),
      "theme-dark",
    );

    expect(() => resolve("$color.state.error")).toThrow(/cycle/);
  });

  test("keeps working after a failed lookup", () => {
    const resolve = createResolver(parseTokens([GREEN, entry("$color.state.added", "$color.palette.missing")].join("\n")), "theme-dark");

    expect(() => resolve("$color.state.added")).toThrow(/unknown token/);
    expect(resolve("$color.palette.green-700")).toEqual({ hex: "#c3e294", alpha: null });
  });
});
