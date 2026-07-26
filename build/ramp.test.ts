import { expect, test } from "bun:test";

import { FAMILIES, type Family, RUNGS, STONE, chroma, derive, hue, hueGap, oklabFromHex, spine } from "./ramp";
import { type Mode, parseTokens } from "./tokens";

const tokens = parseTokens(await Bun.file(`${import.meta.dir}/../color.yaml`).text());

const MODES = ["theme-dark", "theme-light"] satisfies Mode[];

const NUMBERED = /^\$color\.palette\.([a-z]+)-(\d+)$/;

const entries = Object.entries(tokens).flatMap(([name, token]) => {
  const [, family, slot] = NUMBERED.exec(name) ?? [];
  if (!family || !slot) return [];

  return [{ name, family, slot, values: token.values }];
});

const value = (family: string, slot: string, mode: Mode) =>
  entries.find((entry) => entry.family === family && entry.slot === slot)?.values[mode];

const measure = (family: string, slot: string, mode: Mode) => oklabFromHex(value(family, slot, mode) ?? "#000000");

/**
 * The two rungs stone keeps to itself: the ground the theme is drawn on, and the
 * far extreme the strongest foreground reaches for. Neither is a place a family
 * belongs. A chromatic value at the ground is the ground, and one at the extreme
 * has no chroma left to carry — a red up there comes out pink.
 */
const STONE_ONLY = ["00", "1000"];

const rungs = entries
  .filter((entry) => entry.family === "stone" && !STONE_ONLY.includes(entry.slot))
  .map((entry) => entry.slot);

const families = Object.keys(FAMILIES) as Family[];

/**
 * The scale number is a lightness and nothing else. That is the claim the whole
 * two-layer file rests on: it is what lets a light theme fill the same numbers
 * with its own values, and what lets a role move between families without
 * quietly moving up or down. A family that skips a rung breaks it as surely as
 * one that lands on the wrong lightness — the role that wanted that weight has
 * nowhere to go, so it takes the neighbouring one instead.
 */
test.each(families)("%s stands on every rung stone shares", (family) => {
  const own = entries.filter((entry) => entry.family === family).map((entry) => entry.slot);

  expect(own.toSorted()).toEqual(rungs.toSorted());
});

// Eight bits cannot land on a lightness exactly; rounding to a hex moves it by
// about a tenth. Past half a step is the value being wrong, not the hex coarse.
const LIGHTNESS = 0.005;

test.each(MODES)("one slot is one lightness in %s", (mode) => {
  const wrong = rungs.flatMap((slot) => {
    const target = measure("stone", slot, mode).L;

    return families.flatMap((family) => {
      const found = measure(family, slot, mode).L;
      if (Math.abs(found - target) <= LIGHTNESS) return [];

      return [`${family}-${slot} sits at L ${(found * 100).toFixed(1)}, not the ${(target * 100).toFixed(1)} its rung holds`];
    });
  });

  expect(wrong).toEqual([]);
});

// Same reason in degrees: once chroma gets small a single step of rounding
// swings the measured angle, and the near-ground slots are where it gets small.
const HUE = 3;

/**
 * One hue down the whole ramp is what makes a ramp read as one color rather than
 * as a set of related ones. The tolerance is generous where it has to be, and no
 * eye can see a hue carried that faintly anyway.
 */
test.each(MODES)("a family holds one hue down its whole ramp in %s", (mode) => {
  const wrong = families.flatMap((family) =>
    rungs.flatMap((slot) => {
      const gap = hueGap(hue(measure(family, slot, mode)), FAMILIES[family].hue);
      if (Math.abs(gap) <= HUE) return [];

      return [`${family}-${slot} is ${gap.toFixed(1)} degrees off the ${FAMILIES[family].hue} its family holds`];
    }),
  );

  expect(wrong).toEqual([]);
});

/**
 * The value itself, which subsumes both checks above and the chroma one there is
 * no separate test for. It comes last because the two before it say what the
 * palette means and this one only says the arithmetic was carried out.
 */
test.each(MODES)("every chromatic value is the one its rung and family imply in %s", (mode) => {
  const wrong = families.flatMap((family) =>
    rungs.flatMap((slot) => {
      const spine = value("stone", slot, mode);
      if (!spine) return [];

      const want = derive(spine, family);
      const found = value(family, slot, mode);
      if (found?.toLowerCase() === want) return [];

      return [`${family}-${slot} is ${found ?? "missing"}, not the ${want} stone-${slot} implies`];
    }),
  );

  expect(wrong).toEqual([]);
});

/**
 * stone answers to nothing above, because stone is what everything else is
 * measured against — but it still has to be a ramp. A slot that runs the other
 * way in one theme has quietly turned the number into an arbitrary id, and the
 * first thing to break is whichever role assumed 900 sat further out than 700.
 */
test.each(MODES)("the stone ramp climbs away from the ground in %s", (mode) => {
  const ground = measure("stone", "00", mode).L;
  const stone = entries
    .filter((entry) => entry.family === "stone")
    .map((entry) => ({ slot: entry.slot, distance: Math.abs(measure("stone", entry.slot, mode).L - ground) }))
    .sort((one, other) => Number(one.slot) - Number(other.slot));

  const backwards = stone.flatMap((entry, index) => {
    const nearer = stone[index - 1];
    if (!nearer || entry.distance >= nearer.distance) return [];

    return [`stone-${entry.slot} sits nearer the ground than stone-${nearer.slot}`];
  });

  expect(backwards).toEqual([]);
});

/**
 * Every rung the ladder declares is a rung stone actually has, and no others. A
 * rung in the model that the file never filled would be a lightness the
 * families all stand on and nothing anchors.
 */
test("stone stands on exactly the rungs the ladder declares", () => {
  const own = entries.filter((entry) => entry.family === "stone").map((entry) => entry.slot);

  expect(own.toSorted()).toEqual([...RUNGS].toSorted());
});

/**
 * The same claim the families answer to, turned on the grey they all stand on:
 * one hue, one authored chroma profile, one ladder. It is stated as the value
 * because the value is what the model owes — the two checks below say what that
 * value is supposed to mean.
 */
test.each(MODES)("stone is the value its ladder and profile imply in %s", (mode) => {
  const wrong = RUNGS.flatMap((slot) => {
    const found = value("stone", slot, mode);
    const want = spine(slot, mode);
    if (found?.toLowerCase() === want) return [];

    return [`stone-${slot} is ${found ?? "missing"}, not the ${want} the ladder implies`];
  });

  expect(wrong).toEqual([]);
});

// Measured as a distance rather than an angle, because stone carries so little
// chroma that one step of eight-bit rounding swings the angle by nine degrees
// near the extremes while moving the colour by nothing. This is that same step.
const SIDEWAYS = 0.002;

/**
 * The warmth points one way the whole ramp down, which is what makes stone read
 * as a warm grey rather than as a grey with tinted ends.
 *
 * The ground is exempt: it is authored rather than derived, and it is the one
 * value in the palette allowed to be simply what it is.
 */
test.each(MODES)("stone's warmth points one way in %s", (mode) => {
  const wrong = RUNGS.filter((slot) => slot !== "00").flatMap((slot) => {
    const found = oklabFromHex(value("stone", slot, mode) ?? "#000000");
    const sideways = chroma(found) * Math.abs(Math.sin((hueGap(hue(found), STONE.hue) * Math.PI) / 180));
    if (sideways <= SIDEWAYS) return [];

    return [`stone-${slot} sits ${sideways.toFixed(4)} off the ${STONE.hue} its ramp holds`];
  });

  expect(wrong).toEqual([]);
});

/**
 * Warmth rises off the ground, peaks through the middle greys, and falls away
 * again — a shape rather than a constant, because the gamut is nowhere near
 * this chroma and so nothing else would ever taper it. A grey ramp held at one
 * chroma the whole way turns its near-black into brown and its near-white into
 * cream.
 *
 * The check is for a single peak, not for the shape's exact profile. It exists
 * because `stone-700` spent this whole palette's life sitting below both of its
 * neighbours, in both themes, carrying two keys and answering to nothing.
 */
test("stone's warmth rises and falls once", () => {
  const profile = RUNGS.filter((slot) => slot !== "00").map((slot): number => STONE.chroma[slot]);
  const peak = profile.indexOf(Math.max(...profile));

  const dips = profile.flatMap((size, index) => {
    const before = profile[index - 1];
    if (before === undefined) return [];
    if (index <= peak ? size >= before : size <= before) return [];

    return [`the profile turns back on itself at rung ${index + 1} of ${profile.length}`];
  });

  expect(dips).toEqual([]);
});

/**
 * The families have to stay apart from each other too, or `spectrum` cannot do
 * the one job it has. This is the loosest check in the file on purpose: the ring
 * is not evenly spaced and should not be, since the theme spends more of it on
 * the colors code actually uses. It only catches a new family landing on top of
 * one already there.
 */
test("no two families share a hue", () => {
  const ordered = families
    .map((family) => ({ family, hue: FAMILIES[family].hue }))
    .sort((one, other) => one.hue - other.hue);

  const crowded = ordered.flatMap((entry, index) => {
    const previous = ordered.at(index - 1);
    if (!previous) return [];

    const gap = Math.abs(hueGap(entry.hue, previous.hue));
    if (gap >= 15) return [];

    return [`${entry.family} and ${previous.family} are ${gap} degrees apart`];
  });

  expect(crowded).toEqual([]);
});

// Three in a row is a plateau. Two is a coincidence, and one is the gamut
// answering a question the constant was supposed to answer.
const PLATEAU = 3;

/**
 * Chroma is not free at every lightness, and a family whose constant almost no
 * rung can hold is a family whose constant decides nothing — the ramp would look
 * the same with any number in there, because the cube is picking every value.
 * The check is deliberately weak: most rungs are near one ground or the other,
 * where chroma collapses for every hue, so a flat middle is all a well-formed
 * family owes.
 */
test.each(MODES)("a family's chroma holds across a plateau in %s", (mode) => {
  const starved = families.flatMap((family) => {
    const held = rungs.filter((slot) => chroma(measure(family, slot, mode)) >= FAMILIES[family].chroma - 0.002);
    if (held.length >= PLATEAU) return [];

    return [`${family} reaches its ${FAMILIES[family].chroma} chroma on ${held.length} of ${rungs.length} rungs`];
  });

  expect(starved).toEqual([]);
});
