#!/usr/bin/env node
// audit_reasoning.mjs — surface chain-quality + reasoning-quality issues so
// editorial knows where the corpus is weakest.
//
// What "weak" means here:
//  - chain integrity: parent timestamps inconsistent with child, orphans
//    that should have ancestors given their domain/era, suspicious circles
//  - reasoning quality: detail too short to carry "this led to that"
//    reasoning, missing causal language, no source links, generic gloss
//
// Output: AUDIT-REASONING.md grouped by issue class, ordered by tick weight
// (centrality in the unlocks graph). Top 50 of each class shown by default.

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DATA = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));
const TICKS = DATA.ticks;
const UNLOCKS = DATA.unlocks || {};
const UNLOCKED_BY = DATA.unlockedBy || {};
const BY_ID = Object.fromEntries(TICKS.map((t) => [t.id, t]));

// ── weight: how many downstream nodes a tick eventually touches (BFS depth-3) ─
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
const sortByWeight = (a, b) => (W[b.id] || 0) - (W[a.id] || 0);

// ── checks ─────────────────────────────────────────────────────────────────
const CAUSAL_WORDS = [
  "led to", "leads to", "made possible", "enabled", "enables", "because",
  "so that", "cascades", "cascade", "downstream", "unlocked", "unlocks",
  "made it possible", "without this", "from here", "after this",
];
const SHORT_THRESHOLD = 80; // chars
const LONG_THRESHOLD = 600;

const findings = {
  noDetail: [],
  shortDetail: [],
  noCausalLanguage: [],
  noLinks: [],
  parentAfterChild: [],
  orphanTopWeight: [],
  selfLoop: [],
  domainMissing: [],
};

for (const t of TICKS) {
  // detail checks
  const d = (t.detail || "").trim();
  if (!d) findings.noDetail.push(t);
  else if (d.length < SHORT_THRESHOLD) findings.shortDetail.push(t);
  else if (!CAUSAL_WORDS.some((w) => d.toLowerCase().includes(w))) {
    findings.noCausalLanguage.push(t);
  }
  // link check
  if (!t.links || !t.links.length) findings.noLinks.push(t);
  // domain check
  if (!t.domain) findings.domainMissing.push(t);
  // chain checks
  const parents = UNLOCKED_BY[t.id] || [];
  for (const pid of parents) {
    if (pid === t.id) findings.selfLoop.push(t);
    const p = BY_ID[pid];
    if (p && t.yearN != null && p.yearN != null && p.yearN > t.yearN) {
      findings.parentAfterChild.push({ child: t, parent: p });
    }
  }
  // orphan: no parents AND no children, but high weight bucket would imply oddity
  const children = UNLOCKS[t.id] || [];
  if (parents.length === 0 && children.length === 0 && (W[t.id] || 0) === 0) {
    findings.orphanTopWeight.push(t);
  }
}

// Sort each list by weight (most-load-bearing issues first)
for (const k of Object.keys(findings)) {
  if (Array.isArray(findings[k]) && findings[k][0]?.id !== undefined) {
    findings[k].sort(sortByWeight);
  } else if (k === "parentAfterChild") {
    findings[k].sort((a, b) => (W[b.child.id] || 0) - (W[a.child.id] || 0));
  }
}

// ── render report ──────────────────────────────────────────────────────────
const TOP = 50;
const fmt = (t) => `- \`${t.id}\` · **${t.year}** · ${t.name} (${t.domain}, weight ${W[t.id] || 0})`;

const md = `# Reasoning + chain audit

Generated ${new Date().toISOString().slice(0, 10)} from \`data.json\`. Findings are sorted by tick weight (downstream reach in the unlocks graph) so the most-load-bearing issues come first. Top ${TOP} of each class shown.

## Summary

- ${TICKS.length.toLocaleString()} ticks total
- Missing \`detail\`: ${findings.noDetail.length}
- Short \`detail\` (< ${SHORT_THRESHOLD} chars): ${findings.shortDetail.length}
- No causal language in detail: ${findings.noCausalLanguage.length}
- No source links: ${findings.noLinks.length}
- Missing domain: ${findings.domainMissing.length}
- Parent dated AFTER child (chain inconsistency): ${findings.parentAfterChild.length}
- Self-referential unlocks: ${findings.selfLoop.length}
- Isolated (no parents, no children): ${findings.orphanTopWeight.length}

## What "no causal language" flags

Detail text without any of: ${CAUSAL_WORDS.map((w) => '\`' + w + '\`').join(", ")}.
A tick can still be well-written without these words, but the absence is a signal worth reviewing — the user wants explicit "this led to that" reasoning per tick.

## Parent dated after child (highest priority — these break the chain logic)

${findings.parentAfterChild.slice(0, TOP).map(({ child, parent }) =>
  `- \`${child.id}\` (${child.year}) lists \`${parent.id}\` (${parent.year}) as a parent — parent is more recent than child.`
).join("\n") || "_None._"}

## Missing detail (highest weight first)

${findings.noDetail.slice(0, TOP).map(fmt).join("\n") || "_None._"}

## Short detail (< ${SHORT_THRESHOLD} chars)

${findings.shortDetail.slice(0, TOP).map(fmt).join("\n") || "_None._"}

## No causal language in detail

${findings.noCausalLanguage.slice(0, TOP).map(fmt).join("\n") || "_None._"}

## No source links

${findings.noLinks.slice(0, TOP).map(fmt).join("\n") || "_None._"}

## Self-loops in chain

${findings.selfLoop.slice(0, TOP).map(fmt).join("\n") || "_None._"}

## Isolated ticks (no parents, no children)

These exist in the corpus but contribute no chain. Either add edges, or accept them as terminal observations.

${findings.orphanTopWeight.slice(0, TOP).map(fmt).join("\n") || "_None._"}
`;

await writeFile(join(ROOT, "AUDIT-REASONING.md"), md);
console.log(`audit-reasoning: wrote AUDIT-REASONING.md`);
console.log(`  ${TICKS.length} ticks · noDetail ${findings.noDetail.length} · short ${findings.shortDetail.length} · no-causal ${findings.noCausalLanguage.length} · no-links ${findings.noLinks.length} · parent-after-child ${findings.parentAfterChild.length} · self-loops ${findings.selfLoop.length} · isolated ${findings.orphanTopWeight.length}`);
