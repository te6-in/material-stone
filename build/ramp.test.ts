import { expect, test } from "bun:test";

import { type Mode, createResolver, parseTokens } from "./tokens";

const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());

function channel(hex: string, offset: number) {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** OKLab L*, the one axis that reads the same to the eye in either theme. */
function lightness(hex: string) {
  const r = channel(hex, 1);
  const g = channel(hex, 3);
  const b = channel(hex, 5);

  const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const medium = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const short = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return (0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short) * 100;
}

// Hand-authored ramps are not evenly spaced and never will be, so only a slot
// that lands on the wrong side of its neighbour by more than a visible step
// counts as backwards.
const TOLERANCE = 5;

const NUMBERED = /^\$color\.palette\.([a-z]+)-(\d+)$/;
const slot = (name: string) => Number(NUMBERED.exec(name)?.[2] ?? 0);

const ramps = new Map<string, string[]>();
for (const name of Object.keys(tokens)) {
  const hue = NUMBERED.exec(name)?.[1];
  if (!hue) continue;

  ramps.set(hue, [...(ramps.get(hue) ?? []), name]);
}

/**
 * The scale number counts distance from the background, which is the whole
 * reason a light theme can fill the same slots and leave every token below it
 * alone. A slot that runs the other way in one theme has quietly turned the
 * number into an arbitrary id, and the first thing to break is whichever role
 * assumed 900 sat further out than 700.
 *
 * Every slot answers in every mode, so nothing here abstains: a ramp this
 * cannot measure fails rather than quietly shrinking to the part it could.
 */
test.each(["theme-dark", "theme-light"] satisfies Mode[])("the %s ramps climb away from the ground", (mode) => {
  const resolve = createResolver(tokens, mode);

  const ground = lightness(resolve("$color.surface.canvas").hex);
  const distance = (name: string) => Math.abs(lightness(resolve(name).hex) - ground);

  const backwards: string[] = [];
  for (const slots of ramps.values()) {
    const measured = [...slots].sort((a, b) => slot(a) - slot(b)).map((name) => ({ name, distance: distance(name) }));

    measured.forEach((entry, index) => {
      const nearer = measured[index - 1];
      if (!nearer) return;

      if (entry.distance < nearer.distance - TOLERANCE)
        backwards.push(`${entry.name} sits nearer the ground than ${nearer.name}`);
    });
  }

  expect(backwards).toEqual([]);
});
