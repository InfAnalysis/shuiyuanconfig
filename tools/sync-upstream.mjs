#!/usr/bin/env node
// Merges new Greasy Fork releases of 水源助手 into this fork.
//
// The fork is Prettier-formatted and the Greasy Fork file is not, so the merge
// compares everything in Prettier's format; otherwise every line would
// conflict. upstream/ keeps the last merged release byte for byte as the base.
//
// Usage: node tools/sync-upstream.mjs [--no-pull] [--no-push] [--dry-run]
//                                     [--quiet] [--upstream-file PATH]
// Exit codes: 0 up to date or merged, 1 unexpected failure, 2 merge conflict,
// 3 bad upstream file, 4 repository not ready, 5 download failed.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BRANCH = "main";
const FORK_FILE = "水源助手.user.js";
const UPSTREAM_FILE = "upstream/水源助手.user.js";
const UPSTREAM_URL =
  "https://update.greasyfork.org/scripts/429382/%E6%B0%B4%E6%BA%90%E5%8A%A9%E6%89%8B.user.js";
const SCRIPT_NAME = "水源助手";
const MIN_UPSTREAM_BYTES = 100_000;
const COMMIT_PREFIX = "Merge Greasy Fork release";
// Pinned: a newer Prettier could reformat lines and cause false conflicts.
const PRETTIER = [
  "--yes",
  "prettier@3.9.10",
  "--parser",
  "babel",
  "--trailing-comma",
  "es5",
];
// These header lines belong to the fork, so a merge must never touch them.
const FORK_OWNED_META = ["version", "downloadURL", "updateURL"];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};

class Stop extends Error {
  constructor(code, message, { notify = true } = {}) {
    super(message);
    this.code = code;
    this.notify = notify;
  }
}

const log = (message) => console.log(new Date().toISOString(), message);

const notify = (message) => {
  if (process.platform !== "darwin" || flag("--quiet")) {
    return;
  }
  const script = `display notification ${JSON.stringify(message)} with title "${SCRIPT_NAME}上游同步"`;
  spawnSync("osascript", ["-e", script]);
};

const run = (command, commandArgs, options = {}) =>
  spawnSync(command, commandArgs, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });

const git = (...gitArgs) => {
  const result = run("git", ["-C", REPO, ...gitArgs]);
  if (result.status !== 0) {
    throw new Error(`git ${gitArgs[0]} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
};

const metaPattern = (key) => new RegExp(`^// @${key}\\s.*$`, "m");
const metaLine = (text, key) => text.match(metaPattern(key))?.[0] ?? null;
const metaValue = (text, key) =>
  metaLine(text, key)?.trim().split(/\s+/).slice(2).join(" ") ?? null;
const withMetaLine = (text, key, line) =>
  text.replace(metaPattern(key), () => line);

const versionParts = (version) => version.split(".").map(Number);

const compareVersions = (a, b) => {
  const [left, right] = [versionParts(a), versionParts(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference !== 0) {
      return Math.sign(difference);
    }
  }
  return 0;
};

// Fork versions are <base>.<revision>, so they always sort above the upstream
// release they contain and Tampermonkey sees every merge as an update.
const nextForkVersion = (forkVersion, upstreamVersion) => {
  const parts = versionParts(forkVersion);
  const base = parts.slice(0, 3).join(".");
  if (compareVersions(upstreamVersion, base) > 0) {
    return `${upstreamVersion}.1`;
  }
  return `${base}.${(parts[3] ?? 0) + 1}`;
};

const downloadUpstream = () => {
  const path = option("--upstream-file");
  if (path) {
    return readFileSync(path, "utf8");
  }
  const result = run("curl", ["-fsSL", "--max-time", "120", UPSTREAM_URL]);
  if (result.status !== 0) {
    throw new Stop(5, `download failed: ${result.stderr.trim()}`, {
      notify: false,
    });
  }
  return result.stdout;
};

const assertParses = (dir, text, label) => {
  const path = join(dir, "check.js");
  writeFileSync(path, text);
  const result = run(process.execPath, ["--check", path]);
  if (result.status !== 0) {
    throw new Stop(3, `${label} does not parse as JavaScript`);
  }
};

const assertValidUpstream = (dir, text) => {
  const version = metaValue(text, "version");
  if (
    !text.includes("// ==UserScript==") ||
    metaValue(text, "name") !== SCRIPT_NAME ||
    !/^\d+(\.\d+)*$/.test(version ?? "") ||
    Buffer.byteLength(text) < MIN_UPSTREAM_BYTES
  ) {
    throw new Stop(3, "downloaded upstream does not look like the script");
  }
  assertParses(dir, text, "upstream");
};

const prettify = (text) => {
  const result = run("npx", PRETTIER, { input: text });
  if (result.status !== 0) {
    throw new Stop(3, `prettier failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
};

const mergeUpstream = (dir, fork, lastUpstream, newUpstream) => {
  const comparable = (text) =>
    FORK_OWNED_META.reduce(
      (current, key) => withMetaLine(current, key, metaLine(fork, key)),
      prettify(text)
    );
  writeFileSync(join(dir, "fork.js"), fork);
  writeFileSync(join(dir, "base.js"), comparable(lastUpstream));
  writeFileSync(join(dir, "new.js"), comparable(newUpstream));
  const result = run(
    "git",
    [
      "merge-file",
      "-p",
      "-L",
      "fork",
      "-L",
      "last-upstream",
      "-L",
      "new-upstream",
      "fork.js",
      "base.js",
      "new.js",
    ],
    { cwd: dir }
  );
  if (result.status === 0) {
    return result.stdout;
  }
  if (result.status >= 1 && result.status <= 127) {
    const conflictPath = join(tmpdir(), "shuiyuan-upstream-conflict.user.js");
    writeFileSync(conflictPath, result.stdout);
    throw new Stop(
      2,
      `${result.status} merge conflict(s) with upstream ${metaValue(newUpstream, "version")}; nothing changed, markers are in ${conflictPath}`
    );
  }
  throw new Error(`git merge-file failed: ${result.stderr.trim()}`);
};

const repoIsReady = () =>
  git("rev-parse", "--abbrev-ref", "HEAD") === BRANCH &&
  git("status", "--porcelain", "--", FORK_FILE, UPSTREAM_FILE) === "";

const pushPendingMerge = () => {
  if (
    !flag("--no-push") &&
    git("rev-list", "--count", "@{upstream}..HEAD") !== "0" &&
    git("log", "-1", "--format=%s").startsWith(COMMIT_PREFIX)
  ) {
    git("push", "-q", "origin", BRANCH);
    log("pushed a merge left over from an earlier run");
  }
};

const main = (dir) => {
  const newUpstream = downloadUpstream();
  assertValidUpstream(dir, newUpstream);
  const upstreamVersion = metaValue(newUpstream, "version");
  const storedPath = join(REPO, UPSTREAM_FILE);

  if (!repoIsReady()) {
    if (readFileSync(storedPath, "utf8") === newUpstream) {
      log("repository busy and upstream unchanged; nothing to do");
      return;
    }
    throw new Stop(
      4,
      `upstream ${upstreamVersion} is available, but ${BRANCH} is not clean`
    );
  }
  if (!flag("--no-pull") && !flag("--dry-run")) {
    git("pull", "-q", "--ff-only", "origin", BRANCH);
  }

  const lastUpstream = readFileSync(storedPath, "utf8");
  if (lastUpstream === newUpstream) {
    pushPendingMerge();
    log(`up to date with upstream ${upstreamVersion}`);
    return;
  }

  const forkPath = join(REPO, FORK_FILE);
  const fork = readFileSync(forkPath, "utf8");
  const version = nextForkVersion(metaValue(fork, "version"), upstreamVersion);
  const merged = withMetaLine(
    mergeUpstream(dir, fork, lastUpstream, newUpstream),
    "version",
    `// @version      ${version}`
  );
  assertParses(dir, merged, "merged script");
  if (flag("--dry-run")) {
    log(`dry run: would merge upstream ${upstreamVersion} as ${version}`);
    return;
  }

  writeFileSync(forkPath, merged);
  writeFileSync(storedPath, newUpstream);
  git("add", "--", FORK_FILE, UPSTREAM_FILE);
  git("commit", "-q", "-m", `${COMMIT_PREFIX} ${upstreamVersion} as ${version}`);
  if (!flag("--no-push")) {
    git("push", "-q", "origin", BRANCH);
  }
  log(`merged upstream ${upstreamVersion} as ${version}`);
  notify(`已合并上游 ${upstreamVersion}，新版本 ${version}`);
};

const workDir = mkdtempSync(join(tmpdir(), "shuiyuan-sync-"));
try {
  main(workDir);
} catch (error) {
  console.error(new Date().toISOString(), error.message);
  if (!(error instanceof Stop) || error.notify) {
    notify(error.message);
  }
  process.exitCode = error instanceof Stop ? error.code : 1;
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
