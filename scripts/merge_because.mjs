#!/usr/bin/env node
// merge_because.mjs — merge a {tickId: becauseText} JSON file into data.json,
// adding/replacing the `because` field on each matching tick. The because
// field carries explicit "this came from X because Y" reasoning that ties
// the tick's existence to its specific parents.
//
// Usage: node scripts/merge_because.mjs <because-json-path>

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: node scripts/merge_because.mjs <because-json-path>");
  process.exit(1);
}

const data = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));
const because = JSON.parse(await readFile(inputPath, "utf8"));

let added = 0, replaced = 0, missing = 0;
const knownIds = new Set(data.ticks.map((t) => t.id));
for (const id of Object.keys(because)) {
  if (!knownIds.has(id)) {
    console.warn(`  ! unknown tick id: ${id}`);
    missing++;
    continue;
  }
}

for (const t of data.ticks) {
  if (because[t.id] != null) {
    if (t.because) replaced++;
    else added++;
    t.because = because[t.id].trim();
  }
}

data.generated = new Date().toISOString();
await writeFile(join(ROOT, "data.json"), JSON.stringify(data));
console.log(`merge-because: added ${added}, replaced ${replaced}, missing ${missing}`);
