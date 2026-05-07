#!/usr/bin/env python3
"""
Fixes that no human curator would have shipped:
  1. 12 deep-prehistory ticks (older than -70,000) defaulted to ai-era — give them their own zone.
  2. 90 ugly long-form BC year strings without thousands separators (e.g., "120000 BC" → "120,000 BC").
  3. CE/BCE/century-style year strings normalized to the site's AD/BC house style.
  4. Embarrassing AI-era near-duplicates (GPT-3 listed three times in adjacent rows, AlphaFold 2 listed seven times, etc.) — keep the canonical entry, fold edges into it, drop the rest.

Run from repo root: python3 scripts/fix_ui_errors.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data.json"


# ─── Deep prehistory zone ────────────────────────────────────────────────────
DEEP_PREHISTORY = {
    "id": "deep-prehistory",
    "name": "Deep Prehistory",
    "from": -3_000_000,
    "to": -70_001,
}


# ─── Duplicate clusters (canonical id → ids to merge into it) ────────────────
DUP_CLUSTERS = {
    "gpt-3-175b-parameters": [
        "gpt-3-text-generation",
        "gpt-3-demonstrates-few-shot-learning",
    ],
    "alphafold-2-protein-structure-prediction": [
        "alphafold-protein-structure-revolution",
        "alphafold-2-protein-structure-solved",
        "alphafold-2-casp14",
        "alphafold-solves-protein-folding",
        "alphafold2-wins-casp14",
        "deepmind-alphafold-solves-protein-folding",
        "alphafold-2-predicts-protein-structures-with-high-accuracy",
        "alphafold-2-achieves-near-experimental-protein-structure-accuracy",
    ],
    "chatgpt-rlhf-alignment": [
        "chatgpt-launched",
    ],
    "gpt-4-multimodality-frontier-model-capabilities": [
        "gpt-4-multimodal-frontier-models",
    ],
    "reasoning-models-o1-o3-chain-of-thought-at-inference": [
        "o1-test-time-compute-and-chain-of-thought-reasoning",
    ],
    "stable-diffusion-open-sourced-generative-ai-democratized": [
        "stable-diffusion-open-release",
    ],
    "instructgpt-rlhf-makes-ai-followable": [
        "instructgpt-with-rlhf",
        "rlhf-widely-adopted-for-alignment",
    ],
    "llama-open-source-frontier-models": [
        "llama-open-source-model-released",
    ],
    "ai-regulation-begins-eu-ai-act-eo-14110": [
        "executive-order-14110-mandates-ai-safety-and-testing",
        "bletchley-declaration",
    ],
    "midjourney-v4-text-to-image-goes-mainstream": [
        "dall-e-midjourney-ai-image-generation",
    ],
}


# ─── Year-string normalization ───────────────────────────────────────────────
def normalize_year(year_str: str, year_n) -> str:
    """Make year strings curator-grade. Preserves BC/AD; collapses BCE→BC, CE→AD."""
    s = year_str.strip()

    # BCE → BC, CE → AD (one house style; BC/AD wins because the bulk of the corpus uses it)
    s = re.sub(r"\bBCE\b", "BC", s)
    s = re.sub(r"\bCE\b", "AD", s)

    # Long BC numbers without thousands separator: "120000 BC" → "120,000 BC"
    m = re.fullmatch(r"(\d{5,})\s*BC", s)
    if m:
        s = f"{int(m.group(1)):,} BC"

    # Long AD numbers (rare, but defensive): "10000 AD" → "10,000 AD"
    m = re.fullmatch(r"(\d{5,})\s*AD", s)
    if m:
        s = f"{int(m.group(1)):,} AD"

    return s


def main():
    data = json.loads(DATA.read_text())

    # ── 1. zones ────────────────────────────────────────────────────────────
    zones = data["zones"]
    if not any(z["id"] == DEEP_PREHISTORY["id"] for z in zones):
        zones.insert(0, DEEP_PREHISTORY)
        print(f"+ added zone: {DEEP_PREHISTORY['name']}")

    # ── 2. reassign mistaged deep-prehistory ticks ──────────────────────────
    def zone_for(year_n):
        for z in zones:
            if z["from"] <= year_n <= z["to"]:
                return z["id"]
        return None

    reassigned = 0
    for t in data["ticks"]:
        if t.get("yearN") is None:
            continue
        correct = zone_for(t["yearN"])
        if correct and t["zone"] != correct:
            t["zone"] = correct
            reassigned += 1
    print(f"+ reassigned {reassigned} ticks to correct zones")

    # ── 3. year string formatting ───────────────────────────────────────────
    formatted = 0
    for t in data["ticks"]:
        new = normalize_year(t["year"], t.get("yearN"))
        if new != t["year"]:
            t["year"] = new
            formatted += 1
    print(f"+ reformatted {formatted} year strings")

    # ── 4. dedup AI-era clusters ────────────────────────────────────────────
    by_id = {t["id"]: t for t in data["ticks"]}
    redirects = {}  # dropped_id → canonical_id
    dropped = set()
    for canonical, dups in DUP_CLUSTERS.items():
        if canonical not in by_id:
            print(f"  ! canonical missing, skipping cluster: {canonical}")
            continue
        for dup in dups:
            if dup in by_id and dup != canonical:
                redirects[dup] = canonical
                dropped.add(dup)
    # remove from ticks
    data["ticks"] = [t for t in data["ticks"] if t["id"] not in dropped]
    print(f"+ removed {len(dropped)} duplicate ticks")

    # ── 5. heal chain edges ─────────────────────────────────────────────────
    def remap_id(i):
        return redirects.get(i, i)

    def remap_list(ids):
        seen = set()
        out = []
        for i in ids:
            r = remap_id(i)
            if r in dropped:
                continue
            if r in seen:
                continue
            seen.add(r)
            out.append(r)
        return out

    new_unlocks = {}
    for src, ids in data["unlocks"].items():
        src2 = remap_id(src)
        if src2 in dropped:
            continue
        merged = new_unlocks.setdefault(src2, [])
        for child in remap_list(ids):
            if child != src2 and child not in merged:
                merged.append(child)
    data["unlocks"] = new_unlocks

    new_unlocked_by = {}
    for tgt, ids in data["unlockedBy"].items():
        tgt2 = remap_id(tgt)
        if tgt2 in dropped:
            continue
        merged = new_unlocked_by.setdefault(tgt2, [])
        for parent in remap_list(ids):
            if parent != tgt2 and parent not in merged:
                merged.append(parent)
    data["unlockedBy"] = new_unlocked_by

    # ── 6. write ────────────────────────────────────────────────────────────
    DATA.write_text(json.dumps(data, ensure_ascii=False))  # match repo's single-line house style
    print(f"\nfinal: {len(data['ticks'])} ticks, {len(data['zones'])} zones")


if __name__ == "__main__":
    main()
