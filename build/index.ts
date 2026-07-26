import { lintTemplate } from "./lint";
import { render } from "./render";
import { type Target, TARGETS } from "./targets";
import { createResolver, parseTokens } from "./tokens";

const ROOT = `${import.meta.dir}/..`;

const read = (root: string, path: string) => Bun.file(`${root}/${path}`).text();

/**
 * A file is its template rendered once per section. The ground is resolved per
 * section too, so a light section flattens its alpha against the light canvas
 * rather than against whichever one happens to be listed first.
 */
function compose(target: Target, tokens: ReturnType<typeof parseTokens>, template: string) {
  return target.sections
    .map(({ header, mode }) => {
      const resolve = createResolver(tokens, mode);
      const ground = target.ground === null ? null : resolve(target.ground).hex;
      const body = render(template, resolve, { ground, hexStyle: target.hexStyle });

      return header === null ? body : `[${header}]\n${body}`;
    })
    .join("\n");
}

/** Every target rendered, in the order `TARGETS` declares them. */
export async function renderTargets(root = ROOT) {
  const tokens = parseTokens(await read(root, "color.yaml"));

  const rendered = await Promise.all(
    TARGETS.map(async (target) => {
      const template = await read(root, target.template);

      return { target, template, contents: compose(target, tokens, template) };
    }),
  );

  // Said once per build, and only said: a literal is a color the palette will
  // never move, which is usually a mistake and sometimes the whole point.
  const literals = rendered.flatMap(({ target, template }) =>
    lintTemplate(template, target.hexStyle).map((problem) => `  ${target.template} ${problem}`),
  );

  if (literals.length > 0) console.warn(["literal colors outside the palette:", ...literals].join("\n"));

  return rendered;
}

export async function writeTargets(root = ROOT) {
  const rendered = await renderTargets(root);
  await Promise.all(rendered.map(({ target, contents }) => Bun.write(`${root}/${target.output}`, contents)));

  return rendered.map(({ target }) => target.output);
}

/** One line per target whose file on disk no longer matches the template. */
export async function checkTargets(root = ROOT) {
  const drift: string[] = [];

  for (const { target, contents } of await renderTargets(root)) {
    const file = Bun.file(`${root}/${target.output}`);
    if (!(await file.exists())) {
      drift.push(`${target.output}: missing`);
      continue;
    }

    const disk = await file.text();
    if (disk === contents) continue;

    const fresh = contents.split("\n");
    const stale = disk.split("\n");
    // -1 means the file on disk is a prefix of the render: the first missing line.
    const line = stale.findIndex((text, index) => text !== fresh[index]);

    drift.push(`${target.output}: differs from line ${line === -1 ? stale.length + 1 : line + 1}`);
  }

  return drift;
}

if (import.meta.main) {
  if (process.argv.includes("--check")) {
    const drift = await checkTargets();
    for (const problem of drift) console.log(problem);

    console.log(drift.length === 0 ? `${TARGETS.length} targets up to date` : `${drift.length} target(s) drifted`);
    if (drift.length > 0) process.exit(1);
  } else {
    for (const output of await writeTargets()) console.log(`wrote ${output}`);
  }
}
