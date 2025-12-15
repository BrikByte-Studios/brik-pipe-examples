/**
 * Deterministically selects test files for a given shard.
 *
 * Usage:
 *   node scripts/shard-tests.cjs tests/unit 1 8
 *
 * Behavior:
 * - Always exits 0 when inputs are valid (even if no files are selected).
 * - Matches JS/TS files under the provided directory.
 */
const fs = require("fs");
const path = require("path");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
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
  console.error("Usage: node scripts/shard-tests.cjs <dir> <shard> <total>");
  process.exit(2);
}

// Include most common file types Node projects use for tests.
// If you only want *.test.* / *.spec.* later, tighten this filter.
const isCandidate = (p) => /\.(cjs|mjs|js|ts)$/.test(p);

const files = walk(root).filter(isCandidate).sort();
const picked = files.filter((_, i) => (i % total) === (shard - 1));

process.stdout.write(picked.join("\n"));
process.exit(0);
