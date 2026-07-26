import { render } from "./render";
import { TARGETS } from "./targets";
import { createResolver, parseTokens } from "./tokens";

const ROOT = `${import.meta.dir}/..`;

const read = (root: string, path: string) => Bun.file(`${root}/${path}`).text();

/** Every target rendered, in the order `TARGETS` declares them. */
export async function renderTargets(root = ROOT) {
  const tokens = parseTokens(await read(root, "color.yaml"));

  return Promise.all(
    TARGETS.map(async (target) => {
      const resolve = createResolver(tokens, target.mode);
      const ground = target.ground === null ? null : resolve(target.ground).hex;
      const template = await read(root, target.template);

      return { target, contents: render(template, resolve, { ground, hexStyle: target.hexStyle }) };
    }),
  );
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
