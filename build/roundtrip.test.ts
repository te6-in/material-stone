import { describe, expect, test } from "bun:test";

import { extract } from "./extract";
import { render } from "./render";
import { createResolver, parseTokens } from "./tokens";

const root = `${import.meta.dir}/..`;

// The gate on the whole pipeline: pull a template plus an as-is token file out
// of a theme nobody generated, render it back, and demand the bytes match. Any
// difference is the generator being wrong, never the palette being different.
describe.each([
  ["themes/vscode/themes/dark.json", "prefixed" as const],
  ["themes/vscode/themes/light.json", "prefixed" as const],
  ["themes/claude-code/material-stone-dark.json", "prefixed" as const],
  ["themes/fish/material-stone-dark.theme", "bare" as const],
])("%s", (path, hexStyle) => {
  test("survives a round trip through template and tokens", async () => {
    const original = await Bun.file(`${root}/${path}`).text();
    const { template, tokens } = extract(original, hexStyle);
    const resolve = createResolver(parseTokens(tokens), "theme-dark");

    expect(render(template, resolve, { ground: null, hexStyle })).toBe(original);
  });

  test("leaves no literal color in the template it produced", async () => {
    const { lintTemplate } = await import("./lint");
    const { template } = extract(await Bun.file(`${root}/${path}`).text(), hexStyle);

    expect(lintTemplate(template, hexStyle)).toEqual([]);
  });
});

describe("extract", () => {
  test("gives one token to each distinct color", () => {
    const { tokens } = extract('{"a":"#181513","b":"#181513","c":"#e7e5e4"}', "prefixed");

    expect(Object.keys(parseTokens(tokens))).toHaveLength(2);
  });

  test("keeps alpha out of the palette entry and on the use site", () => {
    const { template, tokens } = extract('{"a":"#4b423d60","b":"#4b423d"}', "prefixed");

    expect(Object.keys(parseTokens(tokens))).toHaveLength(1);
    expect(template).toContain("/60");
  });

  test("leaves values that are not colors alone", () => {
    const { template } = extract("selection-foreground = cell-foreground\nminimum-contrast = 0\n", "bare");

    expect(template).toBe("selection-foreground = cell-foreground\nminimum-contrast = 0\n");
  });
});
