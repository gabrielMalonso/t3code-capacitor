import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.T3CODE_SOURCE ?? join(projectRoot, "..", "t3code"));
const sourceDist = join(sourceRoot, "apps", "web", "dist");
const webDir = join(projectRoot, "www");
const primaryEnvironmentUrl =
  process.env.T3CODE_PRIMARY_URL ?? "https://mac-mini-de-gabriel.tailad333c.ts.net";

const build = spawnSync(
  "corepack",
  ["pnpm", "--dir", sourceRoot, "--filter", "@t3tools/web", "build"],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_HTTP_URL: primaryEnvironmentUrl },
  },
);

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

await stat(sourceDist);
await mkdir(webDir, { recursive: true });

const canonicalProjectRoot = await realpath(projectRoot);
const canonicalWebDir = await realpath(webDir);
if (canonicalWebDir !== join(canonicalProjectRoot, "www")) {
  throw new Error(`Refusing to replace unexpected web directory: ${canonicalWebDir}`);
}

console.log(`Replacing generated web bundle: ${canonicalWebDir}`);
await rm(canonicalWebDir, { recursive: true });
await cp(sourceDist, canonicalWebDir, { recursive: true });

const insetDirections = ["top", "right", "bottom", "left"];
const replacementCounts = Object.fromEntries(insetDirections.map((direction) => [direction, 0]));

const patchInsets = async (directory) => {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await patchInsets(path);
      continue;
    }
    if (![".css", ".html", ".js"].includes(extname(entry.name))) {
      continue;
    }

    let contents = await readFile(path, "utf8");
    const original = contents;
    for (const direction of insetDirections) {
      const needle = `env(safe-area-inset-${direction})`;
      const fallback = `var(--safe-area-inset-${direction},env(safe-area-inset-${direction},0px))`;
      const matches = contents.split(needle).length - 1;
      replacementCounts[direction] += matches;
      contents = contents.split(needle).join(fallback);
    }
    if (contents !== original) {
      await writeFile(path, contents);
    }
  }
};

await patchInsets(canonicalWebDir);

for (const direction of insetDirections) {
  if (replacementCounts[direction] === 0) {
    throw new Error(`No safe-area-inset-${direction} usage found in the T3 Code web build.`);
  }
}

const indexPath = join(canonicalWebDir, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
if (!indexHtml.includes("viewport-fit=cover")) {
  throw new Error("The T3 Code viewport is missing viewport-fit=cover.");
}

const revision = spawnSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
});
const metadata = {
  source: relative(projectRoot, sourceRoot),
  revision: revision.status === 0 ? revision.stdout.trim() : null,
  builtAt: new Date().toISOString(),
  primaryEnvironmentUrl,
  safeAreaFallbacks: replacementCounts,
};
await writeFile(
  join(canonicalWebDir, "t3code-capacitor-build.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);

console.log(`Patched safe-area fallbacks: ${JSON.stringify(replacementCounts)}`);
