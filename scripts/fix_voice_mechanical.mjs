#!/usr/bin/env node
// fix_voice_mechanical.mjs — kill the most repetitive AI tics in `because`
// text via targeted regex replacement. NOT a full rewrite — this clears the
// floor so hand-rewrites can focus on entries that need real prose work.
//
// Specifically: "had just demonstrated/shown/established/proven" → drop
// "had just". This is the dominant tic (118 entries) and the rewrite is
// safe because the simple-past form is already the natural reading.
//
// Usage: node scripts/fix_voice_mechanical.mjs [--dry]

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DRY = process.argv.includes("--dry");
const DATA = JSON.parse(await readFile(join(ROOT, "data.json"), "utf8"));

// Tic → replacement rules. Order matters; earlier rules run first.
const RULES = [
  // "had just demonstrated/shown/established/proven that" → simple past
  { from: /\bhad just (demonstrated|shown|established|proved|proven|published|invented|unlocked|discovered) (that )?\b/g,
    to: (m, verb, that) => {
      const verbMap = { demonstrated: "demonstrated", shown: "showed", established: "established",
                        proved: "proved", proven: "proved", published: "published",
                        invented: "invented", unlocked: "unlocked", discovered: "discovered" };
      return verbMap[verb] + " " + (that || "");
    } },
  // "had given X a Y framework" → "gave X a Y framework"
  { from: /\bhad given\b/g, to: "gave" },

  // "X and Y bracket the moment when" → "Together, X and Y mark when"
  { from: /\bbracket the moment when\b/g, to: "mark when" },

  // "ushered in" / "ushered" — kill list. Replace with "started" / "began".
  { from: /\bushered in\b/g, to: "started" },
  { from: /\bushered\b/g, to: "started" },

  // "paved the way for" — replace with "made room for"
  { from: /\bpaved the way for\b/g, to: "made room for" },
  { from: /\bpaved the way to\b/g, to: "made room for" },

  // "set the stage for" — replace with "set up"
  { from: /\bset the stage for\b/g, to: "set up" },

  // "redefined" — kill list. Better replacements depend on object: "redefined
  // X" → "rewrote X" works for ideas/laws/concepts, but "remade" is more
  // physical. Default to "rewrote" since most contexts in this corpus refer
  // to ideas being redefined.
  { from: /\bredefined\b/g, to: "rewrote" },
  { from: /\bredefines\b/g, to: "rewrites" },
  { from: /\bredefining\b/g, to: "rewriting" },

  // "gave the world its first X" → "produced the first X"
  { from: /\bgave the world (its|a) first\b/g, to: "produced the first" },

  // "seeded the X tradition" → "started the X tradition"
  { from: /\bseeded the\b/g, to: "started the" },

  // "for the next millennium" → strip
  { from: /,?\s*for the next millennium/g, to: "" },
  { from: /,?\s*for the (next )?millenni(um|a)/g, to: "" },

  // "for the next two thousand years" / "for the next 1000 years" → strip
  { from: /,?\s*for the next (two thousand|three thousand|five hundred|four hundred|several hundred|\d{2,5}) years?/gi, to: "" },

  // "shaped X for the next Y" → "shaped X"
  { from: /\bshaped (\w+) for the next [^,.;]+/g, to: "shaped $1" },

  // "leverage" → "use"
  { from: /\bleverage(d|s)?\b/g, to: (m, suffix) => "use" + (suffix === "d" ? "d" : suffix === "s" ? "s" : "") },
  { from: /\bleveraging\b/g, to: "using" },

  // "transform" / "transformed" / "transformation" — kill list
  // "transformed X" → "remade X" (closer to active operator voice)
  { from: /\btransformed\b/g, to: "remade" },
  { from: /\btransforming\b/g, to: "remaking" },
  { from: /\btransforms\b/g, to: "remakes" },
  // Common phrasing: "continuous transformation" → "continuous change" reads
  // better than "continuous shift". Apply targeted replacements before the
  // generic noun fallback.
  { from: /\bcontinuous transformation\b/g, to: "continuous change" },
  { from: /\bsocial transformation\b/g, to: "social change" },
  { from: /\bdigital transformation\b/g, to: "digital shift" },
  { from: /\bcultural transformation\b/g, to: "cultural change" },
  { from: /\beconomic transformation\b/g, to: "economic upheaval" },
  // Fallback noun: "transformation" → "upheaval" (more concrete than "shift")
  { from: /\btransformation\b/g, to: "upheaval" },
  // "transform" verb without inflection
  { from: /\btransform (the|a|an|that|this) /g, to: "remake $1 " },

  // "reshaped" / "reshaping" / "reshape" / "reshapes" — kill list
  { from: /\breshaped\b/g, to: "reordered" },
  { from: /\breshaping\b/g, to: "reordering" },
  { from: /\breshape\b/g, to: "reorder" },
  { from: /\breshapes\b/g, to: "reorders" },

  // "unlocked X" → "made X possible" — kill list extension
  // Only target the verb usage in prose; pattern is "unlocked <noun-phrase>".
  // Prefer "made … possible" but where the object is a verb-noun, "enabled" works.
  // We use a conservative replacement that keeps the object phrase intact.
  { from: /\bunlocked\b/g, to: "enabled" },
  { from: /\bunlocks\b/g, to: "enables" },
  { from: /\bunlocking\b/g, to: "enabling" },

  // "set the stage" — already above but reinforce coverage
  { from: /\bset the stage\b/g, to: "set up" },
];

let totalChanges = 0;
let entriesChanged = 0;

for (const t of DATA.ticks) {
  if (!t.because) continue;
  const before = t.because;
  let after = before;
  for (const rule of RULES) {
    after = after.replace(rule.from, rule.to);
  }
  // Cleanup: collapse double spaces, fix punctuation that may have stranded
  after = after
    .replace(/  +/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/, ,/g, ",")
    .replace(/ ,/g, ",")
    .replace(/\.\s*\./g, ".")
    .trim();
  if (after !== before) {
    t.because = after;
    entriesChanged++;
    totalChanges++;
  }
}

console.log(`fix-voice-mechanical: ${entriesChanged} entries changed`);
if (DRY) {
  console.log("(dry run — no write)");
} else {
  await writeFile(join(ROOT, "data.json"), JSON.stringify(DATA, null, 2));
  console.log(`wrote data.json`);
}
