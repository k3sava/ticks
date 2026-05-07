#!/usr/bin/env node
// fix_chain_inversions.mjs — drop parent edges where parent.yearN > child.yearN.
// These are logical errors: a tick can't be unlocked by something that came
// after it. Audit found 131 such edges across the corpus.
//
// Behavior:
//   1. For each (child, parent) pair where parent is dated AFTER child:
//      - Remove parent from unlockedBy[child]
//      - Remove child from unlocks[parent]
//   2. Drop empty arrays from both maps.
//   3. Write data.json back, pretty-printed.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DATA_PATH = join(ROOT, "data.json");
const data = JSON.parse(await readFile(DATA_PATH, "utf8"));
const TICKS = data.ticks;
const UNLOCKS = data.unlocks || {};
const UNLOCKED_BY = data.unlockedBy || {};
const BY_ID = Object.fromEntries(TICKS.map((t) => [t.id, t]));

const removed = [];
let edgesDropped = 0;

for (const childId of Object.keys(UNLOCKED_BY)) {
  const child = BY_ID[childId];
  if (!child || child.yearN == null) continue;
  const parents = UNLOCKED_BY[childId];
  const kept = [];
  for (const parentId of parents) {
    const parent = BY_ID[parentId];
    if (!parent) continue; // dangling; drop
    if (parent.yearN != null && parent.yearN > child.yearN) {
      // inversion — drop the edge from both directions
      removed.push({ child: childId, childYear: child.year, parent: parentId, parentYear: parent.year });
      edgesDropped++;
      // Remove child from unlocks[parent]
      if (Array.isArray(UNLOCKS[parentId])) {
        UNLOCKS[parentId] = UNLOCKS[parentId].filter((id) => id !== childId);
        if (UNLOCKS[parentId].length === 0) delete UNLOCKS[parentId];
      }
      continue;
    }
    kept.push(parentId);
  }
  if (kept.length === 0) delete UNLOCKED_BY[childId];
  else UNLOCKED_BY[childId] = kept;
}

data.unlocks = UNLOCKS;
data.unlockedBy = UNLOCKED_BY;

// Bump the generated timestamp so consumers see a fresh build.
data.generated = new Date().toISOString();

await writeFile(DATA_PATH, JSON.stringify(data));
await writeFile(
  join(ROOT, "AUDIT-CHAIN-FIX.md"),
  `# Chain inversion fix

Generated ${new Date().toISOString().slice(0, 10)} from \`fix_chain_inversions.mjs\`.

## What was removed

Edges where the parent was dated AFTER the child. A tick cannot be unlocked by something that came later. ${edgesDropped} such edges removed.

## Removed edges

${removed.map((r) => `- \`${r.child}\` (${r.childYear}) ← \`${r.parent}\` (${r.parentYear})`).join("\n")}
`,
);

console.log(`fix-chain-inversions: removed ${edgesDropped} edges`);
