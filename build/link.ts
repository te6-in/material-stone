import { lstat, mkdir, readlink, rm, symlink } from "node:fs/promises";
import { resolve } from "node:path";

import { TARGETS } from "./targets";

// Resolved rather than joined: these paths are written into $HOME as link
// targets, where a `build/..` in the middle is something a reader has to undo.
const ROOT = resolve(import.meta.dir, "..");
const HOME = process.env.HOME ?? "";

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** What sits at a path, or null when nothing does. Never follows a symlink. */
async function entryAt(path: string) {
  try {
    return await lstat(path);
  } catch {
    return null;
  }
}

/**
 * A link points a tool at this checkout rather than at a copy of it, so a
 * rebuild is the whole update — Claude Code even reloads a running session off
 * the watcher. Targets with no `install` are left alone.
 */
const LINKS = TARGETS.flatMap((target) =>
  target.install === null
    ? []
    : [
        {
          source: `${ROOT}/${target.output}`,
          directory: `${HOME}/${target.install}`,
          destination: `${HOME}/${target.install}/${basename(target.output)}`,
        },
      ],
);

/**
 * Everything standing between here and a clean link, gathered before anything
 * is written so a run either happens or does not.
 *
 * The directory check is the one that matters. A themes directory is often a
 * symlink into a dotfiles repo, and writing through it would put these links
 * inside that repo instead of in $HOME — which is the duplication this is meant
 * to remove, laundered through a symlink.
 */
async function problems() {
  const found: string[] = [];

  for (const { source, directory, destination } of LINKS) {
    if (!(await Bun.file(source).exists())) found.push(`${source} is not built yet; run \`bun run build\` first`);

    const folder = await entryAt(directory);
    if (folder?.isSymbolicLink()) {
      found.push(`${directory} is a link to ${await readlink(directory)}; something else owns it`);
      continue;
    }

    const current = await entryAt(destination);
    if (!current || current.isSymbolicLink()) continue;

    found.push(`${destination} is a file, not a link; move it aside first`);
  }

  return found;
}

async function link() {
  for (const { source, directory, destination } of LINKS) {
    await mkdir(directory, { recursive: true });
    if (await entryAt(destination)) await rm(destination);

    await symlink(source, destination);
    console.log(`linked ${destination}`);
  }
}

/** Only ever removes a link this script made; anything else is someone's file. */
async function unlink() {
  for (const { source, destination } of LINKS) {
    const current = await entryAt(destination);
    if (!current?.isSymbolicLink()) continue;
    if ((await readlink(destination)) !== source) continue;

    await rm(destination);
    console.log(`unlinked ${destination}`);
  }
}

if (import.meta.main) {
  if (process.argv.includes("--unlink")) {
    await unlink();
  } else {
    const found = await problems();
    for (const problem of found) console.error(problem);

    if (found.length > 0) process.exit(1);
    await link();
  }
}
