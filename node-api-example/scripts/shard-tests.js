/**
 * Deterministically selects test files for a given shard.
 *
 * Usage:
 *   node scripts/shard-tests.js tests/unit 1 8
 *
 * Notes:
 * - Sorting ensures determinism across runs.
 * - Modulo distribution is stable and cheap.
 * - Filters to common test filenames: *.test.* / *.spec.*
 */
const fs = require("fs");
const path = require("path");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const [root, shardStr, totalStr] = process.argv.slice(2);
const shard = Number(shardStr);
const total = Number(totalStr);

if (!root || !Number.isInteger(shard) || !Number.isInteger(total) || shard < 1 || total < 1) {
  console.error("Usage: node scripts/shard-tests.js <dir> <shard> <total>");
  process.exit(2);
}

const isTestFile = (p) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(p) || /\.(test|spec)\.[jt]s$/.test(p);

const files = walk(root).filter(isTestFile).sort();
const picked = files.filter((_, i) => (i % total) === (shard - 1));

process.stdout.write(picked.join("\n"));
