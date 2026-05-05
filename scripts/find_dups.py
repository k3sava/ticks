#!/usr/bin/env python3
"""Find near-duplicate ticks across the corpus.

Heuristics:
  - normalized name overlap (token Jaccard >= 0.6)
  - same domain + close years (|delta| <= 100 yrs OR same year)
  - id substring overlap
"""
import json, re, sys
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data = json.load(open(ROOT/'data.json'))
ticks = data['ticks']

STOP = {'the','of','and','a','an','first','begins','to','from','for','in','as','at','on','by','via','with','—','-','/','(',')'}

def norm_tokens(s):
    s = s.lower()
    s = re.sub(r"[^\w\s]"," ",s)
    return {w for w in s.split() if w and w not in STOP and len(w)>2}

def jaccard(a,b):
    if not a or not b: return 0
    return len(a&b)/len(a|b)

# Build features
feats = []
for t in ticks:
    feats.append({
        'id': t['id'],
        'name': t['name'],
        'year': t['year'],
        'yearN': t['yearN'],
        'domain': t['domain'],
        'tokens': norm_tokens(t['name']),
        'id_tokens': norm_tokens(t['id'].replace('-',' ')),
    })

pairs = []
for a,b in combinations(feats,2):
    name_j = jaccard(a['tokens'], b['tokens'])
    id_j = jaccard(a['id_tokens'], b['id_tokens'])
    yr_close = abs(a['yearN']-b['yearN']) <= 100
    same_domain = a['domain']==b['domain']
    score = max(name_j, id_j)
    if score >= 0.6 and same_domain:
        pairs.append((score, yr_close, a, b))
    elif name_j >= 0.5 and id_j >= 0.5 and same_domain and yr_close:
        pairs.append((max(name_j,id_j), yr_close, a, b))

pairs.sort(key=lambda x:(-x[0], -int(x[1])))
print(f"# Duplicate candidates ({len(pairs)} pairs)\n")
for score, yr_close, a, b in pairs:
    flag = "🔴" if yr_close else "🟡"
    print(f"{flag} score={score:.2f} domain={a['domain']}")
    print(f"   {a['year']:>10}  {a['id']}  —  {a['name']}")
    print(f"   {b['year']:>10}  {b['id']}  —  {b['name']}")
    print()
