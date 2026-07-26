import type { Mode } from "./schema";

/**
 * Where a palette value comes from.
 *
 * A slot is a lightness and nothing else, so `red-900` and `green-900` read as
 * the same weight and a role can move between families without moving up or
 * down. The lightness is stone's: every family sits on the rung stone holds,
 * and stone sits on the ladder below, which is the only place it is written.
 *
 * Warmth is not applied per family. It arrives twice over — every family stands
 * on stone's ladder, and the warm half of the hue circle is where most of the
 * families already are — and an earlier draft that also tinted each value
 * toward stone had to be dropped: adding stone's chromaticity and holding the
 * family's hue are the same degree of freedom, and stone's own chroma, up to
 * 0.026, was enough to swing green by sixteen degrees. Hue holds; the tint goes.
 */

/**
 * The colour each theme is drawn on.
 *
 * Authored rather than derived, and the one entry in the palette that is: a
 * theme is chosen by its background before anything else about it is decided,
 * so the ground is the fixed point the rest of the ramp is measured from rather
 * than something the model gets to reconstruct. Neither ground is reachable
 * from the shared chroma profile below anyway — the two were written
 * independently and disagree by more than eight bits can hide — and rounding
 * the editor background by a channel to make a table tidier is the wrong trade.
 */
export const GROUND = {
  "theme-dark": "#181513",
  "theme-light": "#e9e6e3",
} as const satisfies Record<Mode, string>;

/**
 * How far each rung stands from its own theme's ground.
 *
 * Not spaced evenly, and not the same in both columns. The rhythm is tight near
 * the ground where the surfaces stack, tight again through the text weights,
 * and wide across the middle nobody uses — spacing it evenly was tried and it
 * lifted the low dark surfaces off the ground by enough to see.
 *
 * The two columns diverge by as much as 0.073, at 600. That is deliberate and
 * it is the one asymmetry this file keeps: against a dark ground a colour reads
 * by its hue, so the syntax weights can crowd into the bright band, while
 * against a light one hue alone stops separating and the same roles have to be
 * spread down the ramp instead. A rung therefore means one lightness within a
 * theme, and only roughly the same distance across the two. Mirror symmetry is
 * not enforced anywhere, on purpose.
 */
export const LADDER = {
  "theme-dark": {
    "00": 0, "100": 0.0188, "200": 0.0496, "300": 0.0916, "400": 0.1805, "500": 0.2945,
    "600": 0.4149, "700": 0.4746, "800": 0.5008, "900": 0.6031, "950": 0.664, "1000": 0.7247,
  },
  "theme-light": {
    "00": 0, "100": 0.0289, "200": 0.0498, "300": 0.0801, "400": 0.1592, "500": 0.2526,
    "600": 0.342, "700": 0.416, "800": 0.4927, "900": 0.5659, "950": 0.639, "1000": 0.7111,
  },
} as const satisfies Record<Mode, Record<string, number>>;

export type Rung = keyof (typeof LADDER)["theme-dark"];

// Sorted rather than taken as written: "00" is not an array index, so it is the
// one key an object literal hands back last instead of first.
export const RUNGS = (Object.keys(LADDER["theme-dark"]) as Rung[]).toSorted((one, other) => Number(one) - Number(other));

/**
 * The grey the whole theme is built out of, and the warmth it carries.
 *
 * One hue, which is what it already was: measured off the hand-authored values
 * and weighted by chroma, the two themes came to 52.7 and 53.8, and pinning
 * both to 52 moved twenty-two of the twenty-four hexes by nothing at all. The
 * spread the numbers appear to show — anywhere from 43 to 68 — is eight-bit
 * rounding swinging an angle that almost no chroma is carrying.
 *
 * Chroma is a profile rather than the constant the families get, because the
 * families do not really hold a constant either: theirs tapers at both ends
 * because the gamut closes in and takes it away. stone never comes near that
 * wall at a chroma of 0.026, so nothing would taper it, and a grey ramp held at
 * one chroma the whole way turns its near-black into brown and its near-white
 * into cream. The taper has to be authored, so here it is — warmest through the
 * middle greys, where warmth is the only thing distinguishing them from grey,
 * and nearly gone at both extremes, where it would read as a cast instead.
 *
 * The 700 entry used to sit below both of its neighbours, in both themes. It
 * carried two keys and nobody noticed; it is on the line from 600 to 800 now.
 */
export const STONE = {
  hue: 52,
  chroma: {
    "100": 0.007, "200": 0.00877, "300": 0.01091, "400": 0.01427, "500": 0.02227, "600": 0.02581,
    "700": 0.02231, "800": 0.02001, "900": 0.00753, "950": 0.00491, "1000": 0.00295,
  },
} as const satisfies { hue: number; chroma: Record<Exclude<Rung, "00">, number> };

/**
 * Hue in degrees and chroma, both constant down a family's whole ramp.
 *
 * Chroma is absolute rather than a fraction of what the gamut allows. The
 * fraction is the more principled invariant and it is the wrong one here: the
 * sRGB cube is widest through the middle lightnesses, so a fraction fitted to
 * the values this theme actually has — all of which sit high, where the cube is
 * narrow — lands around three times that chroma in the middle and turns every
 * mid slot fluorescent. The measured palette is close to constant chroma
 * already: light blue runs 0.129, 0.130, 0.130 down its whole ramp.
 *
 * Constant chroma cannot hold at both ends, where the cube closes in and no
 * value that size exists. There `CEILING` takes over, which is why a ramp
 * rises, plateaus, and falls away again rather than holding one saturation
 * throughout — the same taper the hand-authored entries already had.
 *
 * Listed around the hue circle rather than alphabetically, because the gaps
 * between neighbours are the point: these are the colors that have to stay
 * apart from each other. The wide one between green and cyan is real, and the
 * narrow one between indigo and purple is the tightest pair in the theme.
 */
export const FAMILIES = {
  red: { hue: 21, chroma: 0.135 },
  orange: { hue: 41, chroma: 0.115 },
  yellow: { hue: 78, chroma: 0.11 },
  green: { hue: 127, chroma: 0.105 },
  cyan: { hue: 210, chroma: 0.09 },
  blue: { hue: 264, chroma: 0.115 },
  indigo: { hue: 292, chroma: 0.115 },
  purple: { hue: 311, chroma: 0.115 },
  rose: { hue: 346, chroma: 0.115 },
} as const satisfies Record<string, { hue: number; chroma: number }>;

export type Family = keyof typeof FAMILIES;

export type Oklab = { L: number; a: number; b: number };

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

const toGamma = (channel: number) => (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055);

export function oklabFromHex(hex: string): Oklab {
  const r = toLinear(Number.parseInt(hex.slice(1, 3), 16) / 255);
  const g = toLinear(Number.parseInt(hex.slice(3, 5), 16) / 255);
  const b = toLinear(Number.parseInt(hex.slice(5, 7), 16) / 255);

  const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const medium = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const short = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  };
}

function linearFromOklab({ L, a, b }: Oklab) {
  const long = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

export function hexFromOklab(color: Oklab) {
  const channels = linearFromOklab(color).map((channel) => {
    const byte = Math.round(255 * toGamma(Math.min(1, Math.max(0, channel))));

    return byte.toString(16).padStart(2, "0");
  });

  return `#${channels.join("")}`;
}

export const chroma = ({ a, b }: Oklab) => Math.hypot(a, b);

export const hue = ({ a, b }: Oklab) => ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;

/** Signed degrees from `want` to `found`, the short way round. */
export const hueGap = (found: number, want: number) => ((found - want + 540) % 360) - 180;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

// One part in 2^24 of the cube, finer than eight bits can express, so the
// search never decides the answer — rounding to a hex does.
const STEPS = 24;

/**
 * The most chroma sRGB still holds at this lightness and hue.
 *
 * A search rather than a formula: the cube's edge in OKLab is not a shape worth
 * approximating when twenty-four halvings settle it exactly, and a palette this
 * small never feels the cost.
 */
export function reach(L: number, degrees: number) {
  const a = Math.cos(radians(degrees));
  const b = Math.sin(radians(degrees));

  const holds = (scale: number) =>
    linearFromOklab({ L, a: a * scale, b: b * scale }).every(
      (channel) => channel >= -1e-6 && channel <= 1 + 1e-6,
    );

  let inside = 0;
  let outside = 0.5;
  for (let step = 0; step < STEPS; step++) {
    const middle = (inside + outside) / 2;
    if (holds(middle)) inside = middle;
    else outside = middle;
  }

  return inside;
}

/**
 * How close to the edge of the cube any one value is allowed to sit.
 *
 * Wherever the constant does not fit, the ramp would otherwise clip straight to
 * the edge, and the edge is a bad place to stand: channels pin at 00 or ff and
 * eight bits stop being able to tell neighbouring slots apart. A tenth of the
 * way back is enough to keep them distinct, and it is deliberately light —
 * pulling back further does soften the near-blacks, but a slot is supposed to
 * read at one saturation the whole way down the ramp, so a low slot that came
 * out as a faint tint would be answering a question nobody asked.
 */
const CEILING = 0.9;

/**
 * The value stone takes on a rung.
 *
 * Away from the ground is up from a dark one and down from a light one, which
 * is the whole of the difference between the two themes at this layer.
 */
export function spine(rung: Rung, mode: Mode) {
  if (rung === "00") return GROUND[mode];

  const ground = oklabFromHex(GROUND[mode]).L;
  const L = ground + (ground < 0.5 ? 1 : -1) * LADDER[mode][rung];
  const size = STONE.chroma[rung];

  return hexFromOklab({ L, a: size * Math.cos(radians(STONE.hue)), b: size * Math.sin(radians(STONE.hue)) });
}

/** The value a family takes on the rung `spine` holds. */
export function derive(spine: string, family: Family) {
  const { L } = oklabFromHex(spine);
  const { hue: degrees, chroma: want } = FAMILIES[family];

  const size = Math.min(want, CEILING * reach(L, degrees));

  return hexFromOklab({ L, a: size * Math.cos(radians(degrees)), b: size * Math.sin(radians(degrees)) });
}
