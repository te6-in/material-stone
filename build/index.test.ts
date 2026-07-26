import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TARGETS } from "./targets";

const REPO = `${import.meta.dir}/..`;

// The CLI walks up from its own directory, so a copy of the repo is enough to
// exercise it end to end without writing over the themes under review.
let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "material-stone-"));

  await cp(`${REPO}/build`, `${root}/build`, { recursive: true });
  await cp(`${REPO}/templates`, `${root}/templates`, { recursive: true });
  await cp(`${REPO}/color.yaml`, `${root}/color.yaml`);
});

afterAll(() => rm(root, { recursive: true, force: true }));

async function run(...args: string[]) {
  const child = Bun.spawn(["bun", "run", `${root}/build/index.ts`, ...args], { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(child.stdout).text();

  return { code: await child.exited, stdout };
}

describe("build", () => {
  test("writes every target", async () => {
    const { code, stdout } = await run();

    expect(code).toBe(0);
    for (const target of TARGETS) expect(stdout).toContain(`wrote ${target.output}`);
  });
});

describe("--check", () => {
  test("reports clean immediately after a build", async () => {
    await run();
    const { code, stdout } = await run("--check");

    expect(code).toBe(0);
    expect(stdout).toContain(`${TARGETS.length} targets up to date`);
  });

  test("reports drift after a byte is changed", async () => {
    await run();

    const path = `${root}/themes/fish/material-stone.theme`;
    await Bun.write(path, (await Bun.file(path).text()).replace("fish_color_error", "fish_color_erroR"));

    const { code, stdout } = await run("--check");

    expect(code).toBe(1);
    expect(stdout).toContain("themes/fish/material-stone.theme: differs from line 11");
    expect(stdout).toContain("1 target(s) drifted");
  });
});
