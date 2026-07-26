import { describe, expect, test } from "bun:test";

import { type Mode, validateDocument } from "./schema";

const values = { "theme-dark": "#c3e294", "theme-light": "#4c6b1d" };
const document = (token: unknown) => ({ "$color.palette.green-700": token });

describe("validateDocument", () => {
  test("passes a token that writes both modes", () => {
    expect(validateDocument(document({ values }))).toEqual([]);
  });

  test("passes a description alongside the values", () => {
    expect(validateDocument(document({ description: "why it exists", values }))).toEqual([]);
  });

  test("passes an empty document", () => {
    expect(validateDocument({})).toEqual([]);
  });

  test("flags a missing mode", () => {
    const problems = validateDocument(document({ values: { "theme-dark": "#c3e294" } }));

    expect(problems).toEqual(["$color.palette.green-700 declares no theme-light"]);
  });

  test("flags a misspelled mode as both an absence and an intruder", () => {
    const problems = validateDocument(document({ values: { "theme-dark": "#c3e294", "theme-ligth": "#4c6b1d" } }));

    expect(problems).toEqual([
      "$color.palette.green-700 declares no theme-light",
      "$color.palette.green-700 declares an unknown mode theme-ligth",
    ]);
  });

  test("flags a token with no values at all", () => {
    expect(validateDocument(document({}))).toEqual(["$color.palette.green-700 has no values"]);
  });

  test("flags a misspelled field", () => {
    const problems = validateDocument(document({ descriptoin: "oops", values }));

    expect(problems).toEqual(["$color.palette.green-700 has an unknown field descriptoin"]);
  });

  // The failure the old shape hid: a three-digit hex is not a hex, so it fell
  // through to being read as a reference and surfaced as `unknown token #fff`.
  test("flags a hex that is not six or eight digits", () => {
    const problems = validateDocument(document({ values: { ...values, "theme-dark": "#fff" } }));

    expect(problems).toEqual(["$color.palette.green-700 theme-dark is neither a hex nor a token reference: #fff"]);
  });

  test("flags a typo in a reference", () => {
    const problems = validateDocument(document({ values: { ...values, "theme-dark": "$colour.palette.green-700" } }));

    expect(problems).toEqual([
      "$color.palette.green-700 theme-dark is neither a hex nor a token reference: $colour.palette.green-700",
    ]);
  });

  test("takes a reference carrying an alpha suffix", () => {
    expect(validateDocument(document({ values: { ...values, "theme-dark": "$color.palette.green-700/60" } }))).toEqual([]);
  });

  test("flags a value that is not a string", () => {
    const problems = validateDocument(document({ values: { ...values, "theme-dark": 5 } }));

    expect(problems).toEqual(["$color.palette.green-700 theme-dark is not a string"]);
  });

  test("flags a name that is not group and role", () => {
    expect(validateDocument({ "$color.canvas": { values } })).toEqual(["$color.canvas is not a token name"]);
    expect(validateDocument({ "$color.Surface.Canvas": { values } })).toEqual([
      "$color.Surface.Canvas is not a token name",
    ]);
  });

  test("flags a document that is not a map of tokens", () => {
    expect(validateDocument([])).toEqual(["the document is not a map of tokens"]);
  });

  test("passes the real token file", async () => {
    const source = await Bun.file(`${import.meta.dir}/../color.yaml`).text();

    expect(validateDocument(Bun.YAML.parse(source))).toEqual([]);
  });
});

/**
 * `Mode` is read off the schema rather than written beside it, so these two
 * lines are the guard on that: the first stops the union narrowing, the second
 * stops it widening to `string`, which is how the derivation would fail
 * silently and take every mode-shaped type with it.
 */
test("the mode type is exactly what the schema declares", () => {
  const modes: Mode[] = ["theme-dark", "theme-light"];
  // @ts-expect-error a mode the schema does not declare
  const absent: Mode = "theme-dim";

  expect([...modes, absent]).toHaveLength(3);
});
