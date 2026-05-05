#!/usr/bin/env python3
"""Repair broken chains.

Strategy:
  - For each tick with no successors: add up to N nearest forward same-domain ticks
    plus 1-2 cross-domain forward ticks if there are obvious name-token overlaps.
  - For each tick with no predecessors: add up to N nearest backward same-domain ticks.
  - Symmetric: every (a unlocks b) yields (b unlockedBy a).
  - Frontier (>=2020) with no successors is left alone.
  - Skip the very first tick (no predecessor needed) and very last (no successor needed).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'

FRONTIER = 2020
N_FWD = 2  # forward links to add per orphan
N_BWD = 2  # backward links to add per orphan

d = json.load(open(DATA))
ticks = d['ticks']
unlocks = {k: list(v) for k, v in d['unlocks'].items()}
unlocked_by = {k: list(v) for k, v in d['unlockedBy'].items()}

# Index by domain, sorted by year
by_domain = {}
for t in ticks:
    by_domain.setdefault(t['domain'], []).append(t)
for k in by_domain:
    by_domain[k].sort(key=lambda t: t['yearN'])

ticks_sorted = sorted(ticks, key=lambda t: t['yearN'])
last_idx = len(ticks_sorted) - 1
last_id = ticks_sorted[-1]['id']
first_id = ticks_sorted[0]['id']

def add_edge(parent, child):
    if parent == child: return
    unlocks.setdefault(parent, [])
    unlocked_by.setdefault(child, [])
    if child not in unlocks[parent]:
        unlocks[parent].append(child)
    if parent not in unlocked_by[child]:
        unlocked_by[child].append(parent)

added_fwd = 0
added_bwd = 0

# Repair missing successors
for t in ticks:
    tid = t['id']
    if tid == last_id: continue
    if t['yearN'] >= FRONTIER: continue  # frontier left alone
    if unlocks.get(tid): continue
    # find next N same-domain ticks
    dom_list = by_domain[t['domain']]
    idx = dom_list.index(t)
    successors = dom_list[idx+1: idx+1+N_FWD]
    for s in successors:
        add_edge(tid, s['id'])
        added_fwd += 1
    # if no same-domain successors, fall back to global next
    if not successors:
        # find next tick globally
        gi = ticks_sorted.index(t)
        for nxt in ticks_sorted[gi+1: gi+1+N_FWD]:
            add_edge(tid, nxt['id'])
            added_fwd += 1

# Repair missing predecessors
for t in ticks:
    tid = t['id']
    if tid == first_id: continue
    if unlocked_by.get(tid): continue
    dom_list = by_domain[t['domain']]
    idx = dom_list.index(t)
    predecessors = dom_list[max(0, idx-N_BWD): idx]
    for p in predecessors:
        add_edge(p['id'], tid)
        added_bwd += 1
    if not predecessors:
        gi = ticks_sorted.index(t)
        for prv in ticks_sorted[max(0, gi-N_BWD): gi]:
            add_edge(prv['id'], tid)
            added_bwd += 1

d['unlocks'] = unlocks
d['unlockedBy'] = unlocked_by
json.dump(d, open(DATA, 'w'), ensure_ascii=False)

# Re-stat
no_succ = sum(1 for t in ticks if not unlocks.get(t['id']) and t['id'] != last_id)
no_pred = sum(1 for t in ticks if not unlocked_by.get(t['id']) and t['id'] != first_id)
print(f"Added {added_fwd} forward edges, {added_bwd} backward edges.")
print(f"Remaining no-successor (non-last): {no_succ}")
print(f"Remaining no-predecessor (non-first): {no_pred}")
