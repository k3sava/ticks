#!/usr/bin/env python3
"""For each brainstormed candidate, validate against Wikipedia.

Steps per candidate:
  1. Try wiki_search → get top-1 article title
  2. Fetch wiki extract → text
  3. Drop if no extract or text too short
  4. Drop if name too similar to an existing tick (Levenshtein-ish)
  5. Save validated candidates with wiki url + extract → .audit-cache/validated/{domain}.json
"""
import json, urllib.request, urllib.parse, ssl, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CANDIDATES = ROOT/'.audit-cache'/'candidates'
VALIDATED = ROOT/'.audit-cache'/'validated'
VALIDATED.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
HEADERS = {'User-Agent':'ticks-audit/1.0 (https://github.com/k3sava/ticks)'}

def wiki_extract_by_title(title):
    api = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles={urllib.parse.quote(title.replace(' ','_'))}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        for pid, p in data.get('query',{}).get('pages',{}).items():
            if pid == '-1': return None, None
            return p.get('title', title), p.get('extract','')
    except Exception:
        return None, None
    return None, None

def wiki_search(q):
    api = f"https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=3&search={urllib.parse.quote(q)}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return data[1][0]
    except Exception:
        return None
    return None

def slugify(s):
    s = s.lower()
    s = re.sub(r'[^\w\s-]','', s)
    s = re.sub(r'[-\s]+','-', s)
    return s.strip('-')

def too_similar(name, existing_set):
    n = slugify(name)
    if n in existing_set: return True
    nt = set(n.split('-'))
    if not nt: return True
    for e in existing_set:
        et = set(e.split('-'))
        if not et: continue
        # core token overlap
        common = nt & et
        if len(common) >= max(2, min(len(nt), len(et)) - 1):
            # If 80%+ tokens overlap, consider duplicate
            overlap = len(common) / max(len(nt), len(et))
            if overlap >= 0.7: return True
        # Sequence ratio
        if SequenceMatcher(None, n, e).ratio() > 0.85:
            return True
    return False

def validate_one(item, existing_slugs):
    name = item.get('name','').strip()
    if not name: return None
    yn = item.get('yearN')
    try: yn = int(yn) if yn is not None else None
    except: yn = None
    if yn is None or yn < -70000 or yn > 2026:
        return {'__skip':'out-of-era','name':name,'yearN':yn}
    if too_similar(name, existing_slugs):
        return {'__skip':'duplicate','name':name}
    # search wiki
    title_hint = item.get('wiki_search') or name
    article_title, text = wiki_extract_by_title(title_hint)
    if not text or len(text) < 400:
        # try opensearch fallback
        found = wiki_search(name)
        if found:
            article_title, text = wiki_extract_by_title(found)
    if not text or len(text) < 400:
        return {'__skip':'no-wiki','name':name}
    return {
        'name': name,
        'year': item.get('year'),
        'yearN': item.get('yearN'),
        'wiki_title': article_title,
        'wiki_url': f"https://en.wikipedia.org/wiki/{urllib.parse.quote((article_title or '').replace(' ','_'))}",
        'wiki_extract': text[:5000],
        'constraint_dissolved': item.get('constraint_dissolved',''),
    }

def main():
    d = json.load(open(DATA))
    existing_slugs = {t['id'] for t in d['ticks']}
    existing_slugs |= {slugify(t['name']) for t in d['ticks']}

    cand_files = sorted(CANDIDATES.glob('*.json'))
    print(f"Validating across {len(cand_files)} domain files...")
    total_cand = 0; total_valid = 0; total_dup = 0; total_nowiki = 0; total_era = 0
    for f in cand_files:
        dom = f.stem
        candidates = json.loads(f.read_text())
        total_cand += len(candidates)
        valid_for_dom = []
        # Snapshot existing slugs once per domain (immutable during parallel validation)
        snap = frozenset(existing_slugs)
        new_slugs = set()
        results = []
        with ThreadPoolExecutor(max_workers=6) as ex:
            for result in ex.map(lambda x: validate_one(x, snap), candidates):
                if result is None: continue
                if '__skip' in result:
                    if result['__skip']=='duplicate': total_dup += 1
                    elif result['__skip']=='no-wiki': total_nowiki += 1
                    elif result['__skip']=='out-of-era': total_era += 1
                    continue
                results.append(result)
        # Sequentially dedupe within results (catches near-dups within batch)
        for r in results:
            sl = slugify(r['name'])
            if sl in new_slugs: total_dup += 1; continue
            if too_similar(r['name'], snap | new_slugs):
                total_dup += 1; continue
            new_slugs.add(sl)
            valid_for_dom.append(r)
        existing_slugs |= new_slugs
        (VALIDATED/f'{dom}.json').write_text(json.dumps(valid_for_dom, ensure_ascii=False, indent=2))
        total_valid += len(valid_for_dom)
        print(f"  {dom}: {len(valid_for_dom)}/{len(candidates)} validated", flush=True)

    print(f"\nValidated {total_valid}/{total_cand} candidates "
          f"(dup: {total_dup}, no-wiki: {total_nowiki}, out-of-era: {total_era})")

if __name__ == '__main__':
    main()
