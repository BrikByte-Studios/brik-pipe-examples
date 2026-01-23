import fs from "fs";
import path from "path";

const glob = process.env.CYPRESS_SPECS_GLOB || "tests/e2e/cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}";
const shardIndex = parseInt(process.env.BRIK_SHARD_INDEX || "0", 10);
const shardTotal = parseInt(process.env.BRIK_SHARD_TOTAL || "1", 10);

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// Determine root folder to walk based on your glob prefix
// e.g. "tests/e2e/cypress/e2e/..."
let root = "tests/e2e/cypress/e2e";
if (!glob.startsWith("tests/e2e/cypress/e2e")) {
  // fallback: safest reasonable guess
  root = "tests/e2e/cypress/e2e";
}

let files = walk(root, []).filter(f =>
  /\.(cy|spec)\.(js|jsx|ts|tsx)$/.test(f)
);

files.sort();

// modulo split
const selected = files.filter((_, i) => (i % shardTotal) === shardIndex);

process.stdout.write(selected.join(","));
