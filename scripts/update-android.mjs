import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.env.T3CODE_SOURCE ?? join(projectRoot, "..", "t3code"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
  }
}

function read(command, args) {
  const result = spawnSync(command, args, { cwd: projectRoot, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed with exit code ${result.status}.`);
  }
  return result.stdout.trim();
}

const sourceStatus = read("git", ["-C", sourceRoot, "status", "--porcelain"]);
if (sourceStatus) {
  throw new Error(`T3 Code source checkout must be clean before updating:\n${sourceStatus}`);
}

const branch = read("git", ["-C", sourceRoot, "symbolic-ref", "--short", "HEAD"]);
const upstream = read("git", ["-C", sourceRoot, "rev-parse", "--abbrev-ref", "@{upstream}"]);
run("git", ["-C", sourceRoot, "fetch", "--prune"]);

const [ahead, behind] = read("git", [
  "-C",
  sourceRoot,
  "rev-list",
  "--left-right",
  "--count",
  `HEAD...${upstream}`,
])
  .split(/\s+/)
  .map(Number);

if (ahead > 0) {
  throw new Error(`${branch} is ${ahead} commit(s) ahead of ${upstream}; refusing to rewrite it.`);
}
if (behind > 0) {
  run("git", ["-C", sourceRoot, "merge", "--ff-only", upstream]);
}

run("corepack", ["pnpm", "check:mobile"]);
run("corepack", ["pnpm", "build:android"]);
