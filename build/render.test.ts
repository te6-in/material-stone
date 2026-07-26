import { describe, expect, test } from "bun:test";

import { flatten, render } from "./render";

const CANVAS = "#181513";

const resolve = (name: string) =>
  ({
    "$color.palette.green-700": { hex: "#c3e294", alpha: null },
    "$color.palette.red-700": { hex: "#e97c82", alpha: null },
    "$color.diff.added-fill": { hex: "#c3e294", alpha: 0x60 },
  })[name] ?? (() => { throw new Error(`unknown token ${name}`); })();

describe("flatten", () => {
  test("returns the color untouched at full alpha", () => {
    expect(flatten("#c3e294", 0xff, CANVAS)).toBe("#c3e294");
  });

  test("returns the ground at zero alpha", () => {
    expect(flatten("#c3e294", 0x00, CANVAS)).toBe(CANVAS);
  });

  test("matches the composites the Claude Code theme was carrying by hand", () => {
    expect(flatten("#c3e294", 0x60, CANVAS)).toBe("#586244");
    expect(flatten("#c3e294", 0x40, CANVAS)).toBe("#434833");
    expect(flatten("#e97c82", 0x60, CANVAS)).toBe("#673c3d");
    expect(flatten("#e97c82", 0x40, CANVAS)).toBe("#4c2f2f");
  });
});

describe("render", () => {
  test("substitutes a token and leaves the rest of the line alone", () => {
    const out = render('  "editor.background": "${$color.palette.green-700}",', resolve, { ground: null, hexStyle: "prefixed" });

    expect(out).toBe('  "editor.background": "#c3e294",');
  });

  test("passes through text that holds no token", () => {
    const template = "selection-foreground = cell-foreground\nminimum-contrast = 0\n";

    expect(render(template, resolve, { ground: null, hexStyle: "prefixed" })).toBe(template);
  });

  test("keeps modifier flags that follow a token", () => {
    const out = render("fish_color_comment ${$color.palette.green-700} --italics", resolve, {
      ground: CANVAS,
      hexStyle: "bare",
    });

    expect(out).toBe("fish_color_comment c3e294 --italics");
  });

  test("drops the hash when the target writes bare hex", () => {
    expect(render("${$color.palette.red-700}", resolve, { ground: null, hexStyle: "bare" })).toBe("e97c82");
  });

  test("appends eight-digit alpha when the target can express it", () => {
    expect(render("${$color.diff.added-fill}", resolve, { ground: null, hexStyle: "prefixed" })).toBe("#c3e29460");
  });

  test("flattens alpha when the target declares a ground", () => {
    expect(render("${$color.diff.added-fill}", resolve, { ground: CANVAS, hexStyle: "prefixed" })).toBe("#586244");
  });

  test("lets the template apply its own alpha", () => {
    expect(render("${$color.palette.green-700/40}", resolve, { ground: CANVAS, hexStyle: "prefixed" })).toBe("#434833");
  });

  test("lets the template override the alpha the token carries", () => {
    expect(render("${$color.diff.added-fill/40}", resolve, { ground: CANVAS, hexStyle: "prefixed" })).toBe("#434833");
  });

  test("substitutes every occurrence", () => {
    const out = render("${$color.palette.red-700} ${$color.palette.green-700} ${$color.palette.red-700}", resolve, {
      ground: null,
      hexStyle: "prefixed",
    });

    expect(out).toBe("#e97c82 #c3e294 #e97c82");
  });

  test("throws on a token the palette does not define", () => {
    expect(() => render("${$color.palette.nope}", resolve, { ground: null, hexStyle: "prefixed" })).toThrow(/unknown token/);
  });
});
