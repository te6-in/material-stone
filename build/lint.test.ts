import { describe, expect, test } from "bun:test";

import { lintTemplate, lintTokens } from "./lint";
import { parseTokens } from "./tokens";

/** Both modes, because a token that declares one is not a token the schema takes. */
const entry = (name: string, value: string) =>
  `${name}:\n  values:\n    theme-dark: ${value}\n    theme-light: ${value}`;

const GREEN = entry("$color.palette.green-700", '"#c3e294"');
const USES_GREEN = entry("$color.state.added", "$color.palette.green-700");

describe("lintTokens", () => {
  test("passes a palette entry with one semantic token pointing at it", () => {
    expect(lintTokens(parseTokens([GREEN, USES_GREEN].join("\n")), "theme-dark")).toEqual({
      problems: [],
      warnings: [],
    });
  });

  test("flags a semantic token that points at another semantic token", () => {
    const { problems } = lintTokens(
      parseTokens([GREEN, USES_GREEN, entry("$color.diff.added-word", "$color.state.added")].join("\n")),
      "theme-dark",
    );

    expect(problems).toEqual([
      "$color.diff.added-word points at $color.state.added; semantic tokens reference the palette directly",
    ]);
  });

  test("flags two palette entries holding the same value", () => {
    const { problems } = lintTokens(
      parseTokens([GREEN, entry("$color.palette.green-701", '"#c3e294"'), USES_GREEN].join("\n")),
      "theme-dark",
    );

    expect(problems).toContain("#c3e294 is declared twice: $color.palette.green-700, $color.palette.green-701");
  });

  test("leaves two entries alone when they share a value in one mode and split in another", () => {
    const split = [
      '$color.palette.green-701:\n  values:\n    theme-dark: "#c3e294"\n    theme-light: "#4c6b1d"',
      entry("$color.state.success", "$color.palette.green-701"),
    ].join("\n");

    expect(lintTokens(parseTokens([GREEN, USES_GREEN, split].join("\n")), "theme-dark").problems).toEqual([]);
  });

  // A warning and not a problem: a complete ramp holds rungs no role has asked
  // for yet, and the build has no way to tell those from the ones a rename left
  // behind. Counting them is the most it can honestly do.
  test("warns about a palette entry nothing points at", () => {
    const { problems, warnings } = lintTokens(parseTokens(GREEN), "theme-dark");

    expect(problems).toEqual([]);
    expect(warnings).toEqual(["$color.palette.green-700 is unreachable from the semantic layer"]);
  });

  test("flags a raw value outside the palette layer", () => {
    const { problems } = lintTokens(parseTokens([GREEN, USES_GREEN, entry("$color.state.error", '"#e97c82"')].join("\n")), "theme-dark");

    expect(problems).toContain("$color.state.error holds a raw value; only the palette layer may");
  });

  test.each(["theme-dark", "theme-light"] as const)("passes the real token file in %s", async (mode) => {
    const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());

    expect(lintTokens(tokens, mode).problems).toEqual([]);
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
