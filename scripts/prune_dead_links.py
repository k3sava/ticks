#!/usr/bin/env python3
"""Remove dead links from ticks if tick still has >= 2 working links remaining.
Read AUDIT-DEADLINKS.md for the bad-URL list."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
AUDIT = ROOT/'AUDIT-DEADLINKS.md'

# parse dead URLs from the audit file
dead = set()
current_tick = None
for line in open(AUDIT):
    if line.startswith('## '):
        current_tick = line[3:].strip()
    elif line.startswith('- `'):
        # `- `404` — [label](url)`
        m = re.match(r"- `(-?\d+)` — \[.*\]\((.+)\)", line)
        if m:
            code, url = m.groups()
            # treat 404 and -1 as definitively dead; skip 202/3xx (those work)
            if code in ('404', '-1', '410', '500', '502', '503'):
                dead.add(url)

print(f"Dead URLs flagged: {len(dead)}")

d = json.load(open(DATA))
removed_total = 0
ticks_left_thin = []
for t in d['ticks']:
    orig = t.get('links', [])
    kept = [l for l in orig if l['url'] not in dead]
    removed = len(orig) - len(kept)
    if removed == 0: continue
    if len(kept) < 2:
        ticks_left_thin.append((t['id'], len(kept), [l['url'] for l in orig if l['url'] in dead]))
        # Keep dead links in place rather than reduce below 2 — better to leave a dead link than no source
        continue
    t['links'] = kept
    removed_total += removed

json.dump(d, open(DATA, 'w'), ensure_ascii=False)
print(f"Removed {removed_total} dead links from ticks that retained >=2 sources.")
print(f"Ticks where dropping would leave <2 links (left as-is, need source replacement): {len(ticks_left_thin)}")
for tid, n, urls in ticks_left_thin[:20]:
    print(f"  {tid} (would have {n}): {urls[0]}")
