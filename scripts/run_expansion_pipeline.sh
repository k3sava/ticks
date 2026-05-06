#!/usr/bin/env bash
# Run the full expansion pipeline: validate → draft → integrate → repair → rezone.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1. VALIDATE candidates against Wikipedia ==="
python3 -u scripts/validate_candidates.py

echo ""
echo "=== 2. GENERATE full tick payloads via Flash ==="
python3 -u scripts/generate_ticks.py

echo ""
echo "=== 3. INTEGRATE drafts into data.json ==="
python3 -u scripts/integrate_drafts.py

echo ""
echo "=== 4. REPAIR chain (orphans get same-domain neighbors) ==="
python3 -u scripts/repair_chain.py

echo ""
echo "=== 5. RE-ZONE all ticks based on yearN ==="
python3 -u - <<'PY'
import json
d = json.load(open('data.json'))
zones = d['zones']
def zone_for(y):
    for z in zones:
        if z['from'] <= y <= z['to']: return z['id']
    return zones[-1]['id']
n = 0
for t in d['ticks']:
    correct = zone_for(t['yearN'])
    if t.get('zone') != correct:
        t['zone'] = correct; n += 1
json.dump(d, open('data.json','w'), ensure_ascii=False)
print(f"Re-zoned {n} ticks")
print(f"Total ticks now: {len(d['ticks'])}")
PY
echo ""
echo "=== DONE ==="
