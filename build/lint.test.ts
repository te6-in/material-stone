import { describe, expect, test } from "bun:test";

import { lintTemplate, lintTokens } from "./lint";
import { parseTokens } from "./tokens";

function doc(body: string) {
  return parseTokens(
    ["kind: Tokens", "metadata:", "  id: color", "data:", "  collection: color", "  tokens:", body].join("\n"),
  );
}

const entry = (name: string, dark: string) => `    ${name}:\n      values:\n        theme-dark: ${dark}`;

const GREEN = entry("$color.palette.green-700", '"#c3e294"');
const USES_GREEN = entry("$color.state.added", "$color.palette.green-700");

describe("lintTokens", () => {
  test("passes a palette entry with one semantic token pointing at it", () => {
    expect(lintTokens(doc([GREEN, USES_GREEN].join("\n")), "theme-dark")).toEqual([]);
  });

  test("flags a semantic token that points at another semantic token", () => {
    const problems = lintTokens(
      doc([GREEN, USES_GREEN, entry("$color.diff.added-word", "$color.state.added")].join("\n")),
      "theme-dark",
    );

    expect(problems).toEqual([
      "$color.diff.added-word points at $color.state.added; semantic tokens reference the palette directly",
    ]);
  });

  test("flags two palette entries holding the same value", () => {
    const problems = lintTokens(
      doc([GREEN, entry("$color.palette.green-701", '"#c3e294"'), USES_GREEN].join("\n")),
      "theme-dark",
    );

    expect(problems).toContain("#c3e294 is declared twice: $color.palette.green-700, $color.palette.green-701");
  });

  test("leaves two entries alone when they share a value in one mode and split in another", () => {
    const split = [
      '    $color.palette.green-701:\n      values:\n        theme-dark: "#c3e294"\n        theme-light: "#4c6b1d"',
      "    $color.state.success:\n      values:\n        theme-dark: $color.palette.green-701",
    ].join("\n");

    expect(lintTokens(doc([GREEN, USES_GREEN, split].join("\n")), "theme-dark")).toEqual([]);
  });

  test("flags a palette entry nothing points at", () => {
    const problems = lintTokens(doc(GREEN), "theme-dark");

    expect(problems).toEqual(["$color.palette.green-700 is unreachable from the semantic layer"]);
  });

  test("flags a raw value outside the palette layer", () => {
    const problems = lintTokens(doc([GREEN, USES_GREEN, entry("$color.state.error", '"#e97c82"')].join("\n")), "theme-dark");

    expect(problems).toContain("$color.state.error holds a raw value; only the palette layer may");
  });

  test("passes the real token file", async () => {
    const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());

    expect(lintTokens(tokens, "theme-dark")).toEqual([]);
  });
});

describe("lintTemplate", () => {
  test("passes a fully tokenized template", () => {
    expect(lintTemplate('{ "editor.background": "${$color.surface.canvas}" }', "prefixed")).toEqual([]);
  });

  test("flags a hex left behind in a template", () => {
    expect(lintTemplate('{ "editor.background": "#181513" }', "prefixed")).toEqual([
      "line 1 still holds a literal color: #181513",
    ]);
  });

  test("flags eight-digit hex too", () => {
    expect(lintTemplate('{ "activityBar.border": "#4b423d60" }', "prefixed")).toEqual([
      "line 1 still holds a literal color: #4b423d60",
    ]);
  });

  test("flags bare hex only where the target writes bare hex", () => {
    expect(lintTemplate("fish_color_normal e7e5e4", "bare")).toEqual(["line 1 still holds a literal color: e7e5e4"]);
    expect(lintTemplate("fish_color_normal e7e5e4", "prefixed")).toEqual([]);
  });

  test("reports the line each literal sits on", () => {
    expect(lintTemplate("ok ${$color.a}\nstill ok\nbad #ff8f82", "prefixed")).toEqual([
      "line 3 still holds a literal color: #ff8f82",
    ]);
  });

  test("leaves words that only look like hex alone", () => {
    expect(lintTemplate("italic\nstrikethrough\nunderline\ncell-foreground", "bare")).toEqual([]);
  });

  test("does not flag the token expressions themselves", () => {
    expect(lintTemplate("fish_color_comment ${$color.syntax.comment} --italics", "bare")).toEqual([]);
  });
});
