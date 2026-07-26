import { type HexStyle, type Resolve, splitAlpha } from "./tokens";

const EXPRESSION = /\$\{([^}]+)\}/g;

const channel = (hex: string, ground: string, alpha: number, offset: number) =>
  Math.round(
    (Number.parseInt(hex.slice(offset, offset + 2), 16) * alpha +
      Number.parseInt(ground.slice(offset, offset + 2), 16) * (255 - alpha)) /
      255,
  );

export const flatten = (hex: string, alpha: number, ground: string) =>
  `#${[1, 3, 5].map((offset) => channel(hex, ground, alpha, offset).toString(16).padStart(2, "0")).join("")}`;

function format(hex: string, alpha: number | null, ground: string | null) {
  if (alpha === null) return hex;
  if (ground) return flatten(hex, alpha, ground);

  return `${hex}${alpha.toString(16).padStart(2, "0")}`;
}

/**
 * One renderer for every target. `ground` is the color to flatten alpha
 * against, or null when the target can carry alpha itself.
 */
export function render(template: string, resolve: Resolve, { ground, hexStyle }: { ground: string | null; hexStyle: HexStyle }) {
  return template.replace(EXPRESSION, (_, expression: string) => {
    const [name, inline] = splitAlpha(expression.trim());
    const { hex, alpha } = resolve(name);
    const value = format(hex, inline ?? alpha, ground);

    return hexStyle === "bare" ? value.slice(1) : value;
  });
}
