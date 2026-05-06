#!/usr/bin/env python3
"""Merge drafted ticks into data.json. Assign ids, dedupe, attach Wikipedia
link, set zone, and link chains (each new tick gets >=1 forward and >=1
backward edge based on same-domain neighbors)."""
import json, re
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
DRAFTS = ROOT/'.audit-cache'/'drafts'

def slugify(s):
    s = s.lower()
    s = re.sub(r"[^\w\s-]", '', s)
    s = re.sub(r"[-\s]+", '-', s)
    return s.strip('-')

def fmt_year(yn):
    if yn < 0:
        return f"{abs(yn):,} BC"
    return f"{yn} AD"

def too_similar(name, existing_names):
    n = slugify(name)
    nt = set(n.split('-'))
    for e in existing_names:
        et = set(e.split('-'))
        if not et: continue
        common = nt & et
        if len(common) >= max(2, min(len(nt), len(et)) - 1):
            overlap = len(common) / max(len(nt), len(et))
            if overlap >= 0.7: return True
        if SequenceMatcher(None, n, e).ratio() > 0.85:
            return True
    return False

def zone_for(yn, zones):
    for z in zones:
        if z['from'] <= yn <= z['to']:
            return z['id']
    return zones[-1]['id']

def main():
    d = json.load(open(DATA))
    zones = d['zones']
    ticks = d['ticks']
    by_id = {t['id']: t for t in ticks}
    existing_slug_names = {slugify(t['name']) for t in ticks}
    existing_ids = {t['id'] for t in ticks}

    # Aggregate all drafts; cap per-domain to keep corpus balanced.
    PER_DOMAIN_CAP = 130  # max NEW ticks per domain in this expansion
    drafts_by_dom = {}
    for f in sorted(DRAFTS.glob('*.json')):
        try:
            arr = json.loads(f.read_text())
        except: continue
        dom = f.stem
        for it in arr:
            if not isinstance(it, dict) or it.get('reject'): continue
            it['_dom_file'] = dom
            drafts_by_dom.setdefault(dom, []).append(it)
    # Prioritize: spread across eras for each domain
    drafts = []
    for dom, arr in drafts_by_dom.items():
        # bucket by era (yearN range)
        # Sort arr by yearN, then take a balanced sample
        arr_sorted = sorted(arr, key=lambda x: x.get('yearN') or 0)
        if len(arr_sorted) <= PER_DOMAIN_CAP:
            drafts.extend(arr_sorted)
        else:
            # Stride sampling for even time distribution
            step = len(arr_sorted) / PER_DOMAIN_CAP
            picked = [arr_sorted[int(i * step)] for i in range(PER_DOMAIN_CAP)]
            drafts.extend(picked)
    print(f"Total raw drafts after per-domain cap ({PER_DOMAIN_CAP}): {len(drafts)}")

    # Validate + dedupe
    new_ticks = []
    skipped = {'dup':0,'bad':0,'noyear':0}
    seen_in_batch = set()
    for it in drafts:
        name = it.get('name','').strip()
        yn = it.get('yearN')
        if not name or yn is None:
            skipped['bad'] += 1; continue
        try: yn = int(yn)
        except: skipped['noyear'] += 1; continue
        if too_similar(name, existing_slug_names | seen_in_batch):
            skipped['dup'] += 1; continue
        # Build id
        base_id = it.get('id') or slugify(name)
        if not base_id:
            skipped['bad'] += 1; continue
        sid = base_id
        n = 2
        while sid in existing_ids:
            sid = f"{base_id}-{n}"; n += 1
        wiki_url = it.get('wiki_url','')
        new_tick = {
            'id': sid,
            'year': it.get('year') or fmt_year(yn),
            'yearN': yn,
            'zone': zone_for(yn, zones),
            'name': name,
            'domain': it.get('domain') or it.get('_dom_file') or 'society',
            'constraint': (it.get('constraint') or '').strip().rstrip('.'),
            'detail': (it.get('detail') or '').strip(),
            'links': []
        }
        if wiki_url:
            new_tick['links'].append({
                'label': f"Wikipedia: {it.get('wiki_title') or name}",
                'url': wiki_url,
            })
        existing_ids.add(sid)
        existing_slug_names.add(slugify(name))
        seen_in_batch.add(slugify(name))
        new_ticks.append(new_tick)

    print(f"Skipped: {skipped}")
    print(f"New ticks ready to merge: {len(new_ticks)}")

    # Add to corpus
    ticks.extend(new_ticks)
    ticks_sorted = sorted(ticks, key=lambda t: t['yearN'])
    by_id = {t['id']: t for t in ticks}
    by_dom_sorted = {}
    for t in ticks_sorted:
        by_dom_sorted.setdefault(t['domain'], []).append(t)

    # Build chain edges for new ticks: link to next/prev same-domain tick
    unlocks = {k: list(v) for k, v in d['unlocks'].items()}
    unlocked_by = {k: list(v) for k, v in d['unlockedBy'].items()}

    def add_edge(parent, child):
        if parent == child: return
        unlocks.setdefault(parent, [])
        unlocked_by.setdefault(child, [])
        if child not in unlocks[parent]:
            unlocks[parent].append(child)
        if parent not in unlocked_by[child]:
            unlocked_by[child].append(parent)

    new_ids = {t['id'] for t in new_ticks}
    for t in new_ticks:
        dom_list = by_dom_sorted[t['domain']]
        idx = dom_list.index(t)
        # forward: 1-2 same-domain successors
        for s in dom_list[idx+1: idx+3]:
            add_edge(t['id'], s['id'])
        # backward: 1-2 same-domain predecessors
        for p in dom_list[max(0, idx-2): idx]:
            add_edge(p['id'], t['id'])

    d['ticks'] = ticks
    d['unlocks'] = unlocks
    d['unlockedBy'] = unlocked_by
    json.dump(d, open(DATA, 'w'), ensure_ascii=False)
    print(f"data.json now has {len(ticks)} ticks (was {len(ticks)-len(new_ticks)})")

if __name__ == '__main__':
    main()
