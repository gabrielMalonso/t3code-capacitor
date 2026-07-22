import { spawnSync } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.T3CODE_SOURCE ?? join(projectRoot, "..", "t3code"));
const patchesDir = join(projectRoot, "patches");
const webDir = join(projectRoot, "www");
const primaryEnvironmentUrl =
  process.env.T3CODE_PRIMARY_URL ?? "https://mac-mini-de-gabriel.tailad333c.ts.net";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function read(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed with exit code ${result.status}.`);
  }
  return result.stdout.trim();
}

const sourceStatus = read("git", ["-C", sourceRoot, "status", "--porcelain"]);
if (sourceStatus) {
  throw new Error(`T3 Code source checkout must be clean before building:\n${sourceStatus}`);
}

const revision = read("git", ["-C", sourceRoot, "rev-parse", "HEAD"]);
const patchNames = (await readdir(patchesDir))
  .filter((name) => extname(name) === ".patch")
  .sort();
const buildRoot = await mkdtemp(join(tmpdir(), "t3code-capacitor-build-"));

try {
  run("git", ["clone", "--shared", "--no-checkout", sourceRoot, buildRoot]);
  run("git", ["-C", buildRoot, "checkout", "--detach", revision]);
  await linkInstalledDependencies(buildRoot);

  for (const patchName of patchNames) {
    const patchPath = join(patchesDir, patchName);
    run("git", ["-C", buildRoot, "apply", "--check", patchPath]);
    run("git", ["-C", buildRoot, "apply", patchPath]);
  }

  const buildEnvironment = {
    ...process.env,
    VITE_HOSTED_APP_CHANNEL: process.env.T3CODE_HOSTED_APP_CHANNEL ?? "nightly",
  };
  delete buildEnvironment.VITE_HTTP_URL;
  delete buildEnvironment.VITE_WS_URL;
  run("corepack", ["pnpm", "--dir", buildRoot, "--filter", "@t3tools/web", "build"], {
    env: buildEnvironment,
  });

  const sourceDist = join(buildRoot, "apps", "web", "dist");
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

  await patchGeneratedBundle(canonicalWebDir, {
    patchNames,
    primaryEnvironmentUrl,
    revision,
  });
} finally {
  await rm(buildRoot, { recursive: true, force: true });
}

async function linkInstalledDependencies(targetRoot) {
  const packageFiles = read("git", [
    "-C",
    sourceRoot,
    "ls-files",
    "package.json",
    ":(glob)**/package.json",
  ]);
  const packageDirectories = new Set([
    ".",
    ...packageFiles.split("\n").filter(Boolean).map((path) => dirname(path)),
  ]);

  for (const packageDirectory of packageDirectories) {
    const sourceModules = join(sourceRoot, packageDirectory, "node_modules");
    try {
      await stat(sourceModules);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const targetPackage = join(targetRoot, packageDirectory);
    await mkdir(targetPackage, { recursive: true });
    await symlink(sourceModules, join(targetPackage, "node_modules"), "dir");
  }
}

async function patchGeneratedBundle(canonicalWebDir, buildMetadata) {
  const insetDirections = ["top", "right", "bottom", "left"];
  const replacementCounts = Object.fromEntries(insetDirections.map((direction) => [direction, 0]));

  const patchInsets = async (directory) => {
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

  const metadata = {
    source: relative(projectRoot, sourceRoot),
    revision: buildMetadata.revision,
    patches: buildMetadata.patchNames,
    builtAt: new Date().toISOString(),
    primaryEnvironmentUrl: buildMetadata.primaryEnvironmentUrl,
    safeAreaFallbacks: replacementCounts,
  };
  await writeFile(
    join(canonicalWebDir, "t3code-capacitor-build.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );

  console.log(`Applied mobile patches: ${buildMetadata.patchNames.join(", ") || "none"}`);
  console.log(`Patched safe-area fallbacks: ${JSON.stringify(replacementCounts)}`);
}
