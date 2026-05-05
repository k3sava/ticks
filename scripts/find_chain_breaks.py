#!/usr/bin/env python3
"""Report ticks with broken chain — no predecessors or no successors."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
d = json.load(open(ROOT/'data.json'))
ticks = d['ticks']
unlocks = d['unlocks']
unlocked_by = d['unlockedBy']

# Sort by year ascending
ticks_sorted = sorted(ticks, key=lambda t: t['yearN'])

no_succ = [t for t in ticks if not unlocks.get(t['id'])]
no_pred = [t for t in ticks if not unlocked_by.get(t['id'])]

# Frontier cutoff: ticks after 2020 may legitimately have no successors yet
FRONTIER = 2020

def fmt(t): return f"{t['year']:>10}  [{t['domain']:<11}]  {t['id']}  —  {t['name']}"

print(f"# Chain breaks\n")
print(f"Total ticks: {len(ticks)}")
print(f"No successors: {len(no_succ)}  (frontier ≥{FRONTIER}: legit)")
print(f"No predecessors: {len(no_pred)}\n")

print("## Missing successors (pre-frontier — should likely link forward)\n")
for t in sorted(no_succ, key=lambda t: t['yearN']):
    if t['yearN'] >= FRONTIER: continue
    print(f"- {fmt(t)}")

print("\n## Missing successors (frontier ≥2020 — likely OK)\n")
for t in sorted(no_succ, key=lambda t: t['yearN']):
    if t['yearN'] < FRONTIER: continue
    print(f"- {fmt(t)}")

print("\n## Missing predecessors (should likely link backward — except earliest few)\n")
for t in sorted(no_pred, key=lambda t: t['yearN']):
    print(f"- {fmt(t)}")
