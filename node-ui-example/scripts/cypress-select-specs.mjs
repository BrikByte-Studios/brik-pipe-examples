import fs from "fs";
import path from "path";

const glob = process.env.CYPRESS_SPECS_GLOB || "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}";
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

let files = [];
if (glob.startsWith("cypress/e2e/")) {
  files = walk("cypress/e2e", []).filter(f => /\.cy\.(js|jsx|ts|tsx)$/.test(f));
} else {
  files = walk(".", []).filter(f => /\.cy\.(js|jsx|ts|tsx)$/.test(f) && !f.includes("node_modules"));
}

files.sort();
const selected = files.filter((_, i) => (i % shardTotal) === shardIndex);
process.stdout.write(selected.join(","));
