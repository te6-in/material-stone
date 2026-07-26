import { expect, test } from "bun:test";

const REPO = `${import.meta.dir}/..`;

const read = (path: string) => Bun.file(`${REPO}/${path}`).text();

/**
 * A pair of templates is one file wearing two labels: same keys, same scope
 * arrays, same modifier flags, and only the palette underneath them differs.
 * Nothing but the label may diverge, or an edit to one theme quietly stops
 * reaching the other.
 */
const PAIRS = [
  {
    tool: "VS Code",
    dark: "templates/vscode.dark.json",
    light: "templates/vscode.light.json",
    labels: [
      { from: '"Material Stone Dark"', to: '"Material Stone Light"' },
      { from: '"type": "dark"', to: '"type": "light"' },
    ],
  },
  {
    tool: "Claude Code",
    dark: "templates/claude-code.dark.json",
    light: "templates/claude-code.light.json",
    labels: [
      { from: '"material-stone-dark"', to: '"material-stone-light"' },
      { from: '"base": "dark"', to: '"base": "light"' },
    ],
  },
];

test.each(PAIRS)("the $tool templates differ only in their labels", async ({ dark, light, labels }) => {
  const [written, relabelled] = await Promise.all([read(light), read(dark)]);

  expect(written).toBe(labels.reduce((text, { from, to }) => text.replace(from, to), relabelled));
});
