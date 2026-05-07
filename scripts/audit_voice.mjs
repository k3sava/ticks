#!/usr/bin/env node
// audit_voice.mjs — flags AI tics in `because` and `detail` fields.
//
// The user's complaint after the 1400-entry pass was that the prose
// settled into recognizable templates. This script lists every entry
// that triggers one or more tics, sorted by tic count desc + weight.
// Output: AUDIT-VOICE.md.

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DATA = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));
const TICKS = DATA.ticks;
const UNLOCKS = DATA.unlocks || {};
const BY_ID = Object.fromEntries(TICKS.map((t) => [t.id, t]));

function weight(id, depth = 3) {
  const seen = new Set([id]);
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const n of frontier) {
      for (const child of UNLOCKS[n] || []) {
        if (!seen.has(child)) { seen.add(child); next.push(child); }
      }
    }
    frontier = next;
  }
  return seen.size - 1;
}
const W = Object.fromEntries(TICKS.map((t) => [t.id, weight(t.id)]));

// AI-tic patterns. Each one has an id, a regex, and a short label.
// Order matters for reporting only.
const TICS = [
  { id: "bracket-moment", re: /\bbracket(?:s|ed)? the moment\b/i, label: "X and Y bracket the moment when" },
  { id: "bracket-verb", re: /\b\w+\s+and\s+\w+\s+bracket\b/i, label: "(noun) and (noun) bracket" },
  { id: "had-just", re: /\bhad just (demonstrated|shown|proven|established|discovered|published|invented|unlocked)\b/i, label: "had just (demonstrated/shown/proven)" },
  { id: "gave-the-world", re: /\bgave the world (its|a) first\b/i, label: "gave the world (its/a) first" },
  { id: "seeded-tradition", re: /\bseeded the\b.*\b(tradition|lineage|practice)\b/i, label: "seeded the … tradition" },
  { id: "for-next-n-years", re: /\bfor the next (\d{2,5}|two thousand|three thousand|five hundred|millennium|millennia|century)\b/i, label: "for the next N years" },
  { id: "for-next-millennium", re: /\bfor the (next )?millenni(um|a)\b/i, label: "for the next millennium" },
  { id: "shaped-x-for", re: /\bshaped \w+ for the next\b/i, label: "shaped X for the next" },
  { id: "ushered", re: /\bushered (in)?\b/i, label: "ushered (in)" },
  { id: "paved-the-way", re: /\bpaved the way\b/i, label: "paved the way" },
  { id: "set-the-stage", re: /\bset the stage\b/i, label: "set the stage" },
  { id: "reshaped", re: /\breshape(d|s)?\b/i, label: "reshape(d)" },
  { id: "redefined", re: /\bredefin(ed|es)\b/i, label: "redefined" },
  { id: "transform", re: /\btransform(ed|s|ing|ation)\b/i, label: "transform" },
  { id: "leverage", re: /\bleverag(e|ed|es|ing)\b/i, label: "leverage" },
  { id: "unlock-as-verb", re: /\bunlock(ed|s|ing)\b/i, label: "unlock (as verb in prose)" },
  { id: "list-of-three-clause", re: /, [a-z]+, and [a-z]+\.\s*$/m, label: "three-clause sentence ending and X." },
  { id: "lists-of-three-abstract", re: /\b(creativity|innovation|inspiration|insight|wisdom|truth|beauty),\s+(creativity|innovation|inspiration|insight|wisdom|truth|beauty),\s+and\b/i, label: "list of three abstract terms" },
];

function scanText(text) {
  if (!text) return [];
  const hits = [];
  for (const tic of TICS) {
    if (tic.re.test(text)) hits.push(tic.id);
  }
  return hits;
}

const findings = [];
let totalChecked = 0;
let totalWithBecause = 0;

for (const t of TICKS) {
  const because = (t.because || "").trim();
  if (!because) continue;
  totalWithBecause++;
  totalChecked++;
  const hits = scanText(because);
  if (hits.length === 0) continue;
  findings.push({ tick: t, hits, w: W[t.id] || 0, where: "because" });
}

// Sort: hits desc, then weight desc
findings.sort((a, b) => b.hits.length - a.hits.length || b.w - a.w);

// Tally tics
const ticTally = {};
for (const f of findings) {
  for (const h of f.hits) ticTally[h] = (ticTally[h] || 0) + 1;
}
const ticTallySorted = Object.entries(ticTally).sort((a, b) => b[1] - a[1]);

// Render report
const fmt = (f) =>
  `- \`${f.tick.id}\` · **${f.tick.year}** · ${f.tick.name} _(weight ${f.w}, ${f.hits.length} tic${f.hits.length === 1 ? "" : "s"}: ${f.hits.join(", ")})_\n  > ${f.tick.because.slice(0, 240).replace(/\n/g, " ")}${f.tick.because.length > 240 ? "…" : ""}`;

const TOP = 200;
const md = `# Voice audit · because-text

Generated ${new Date().toISOString().slice(0, 10)} from \`data.json\`. Flags entries containing recognizable AI-tic templates. Sorted by hit count desc, then by tick weight desc (highest-load-bearing first).

## Summary

- ${TICKS.length.toLocaleString()} ticks total
- ${totalWithBecause.toLocaleString()} carry a \`because\`
- ${findings.length.toLocaleString()} flagged by at least one tic (${(findings.length / totalWithBecause * 100).toFixed(1)}% of because-carriers)

## Tic frequency

${ticTallySorted.map(([id, n]) => {
  const tic = TICS.find(t => t.id === id);
  return `- \`${id}\` (${n}): ${tic.label}`;
}).join("\n")}

## Top ${TOP} flagged entries (by hits desc, weight desc)

${findings.slice(0, TOP).map(fmt).join("\n")}
`;

await writeFile(join(ROOT, "AUDIT-VOICE.md"), md);
console.log(`audit-voice: ${findings.length} flagged of ${totalWithBecause} because-carriers (${(findings.length / totalWithBecause * 100).toFixed(1)}%)`);
console.log(`  top tic: ${ticTallySorted[0]?.[0]} (${ticTallySorted[0]?.[1]} entries)`);
console.log(`  wrote AUDIT-VOICE.md (top ${TOP})`);
