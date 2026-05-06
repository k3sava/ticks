#!/usr/bin/env python3
"""For each brainstormed candidate, validate against Wikipedia.

Uses Wikipedia API batch (50 titles per call) — drastically reduces request
count and avoids rate-limit (429).

Output: .audit-cache/validated/{domain}.json with wiki url + extract.
"""
import json, urllib.request, urllib.parse, ssl, re, time
from pathlib import Path
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CANDIDATES = ROOT/'.audit-cache'/'candidates'
VALIDATED = ROOT/'.audit-cache'/'validated'
VALIDATED.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
HEADERS = {'User-Agent':'ticks-corpus-audit/1.0 (https://github.com/k3sava/ticks; kesava@iamkesava.com)'}

# polite delay between batch calls (each batch is 50 titles)
BATCH_SLEEP = 0.5

def slugify(s):
    s = s.lower()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[-\s]+', '-', s)
    return s.strip('-')

# ----- Wikipedia batch fetch -----

def wiki_extract_one(title):
    """Single-title fetch (exlimit=1 is the API default for anon)."""
    if not title: return None, None
    api = ("https://en.wikipedia.org/w/api.php?"
           "action=query&format=json&prop=extracts&explaintext=1&redirects=1&"
           f"titles={urllib.parse.quote(title.replace(' ','_'))}")
    for attempt in range(3):
        try:
            req = urllib.request.Request(api, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                data = json.loads(r.read().decode('utf-8','replace'))
            for pid, p in data.get('query',{}).get('pages',{}).items():
                if pid == '-1': return None, None
                return p.get('title', title), p.get('extract','')
            return None, None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (attempt + 1)
                time.sleep(wait); continue
            return None, None
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None, None

def wiki_search(q):
    api = f"https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search={urllib.parse.quote(q)}"
    for attempt in range(2):
        try:
            req = urllib.request.Request(api, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
                data = json.loads(r.read().decode('utf-8','replace'))
            if isinstance(data, list) and len(data) >= 2 and data[1]:
                return data[1][0]
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(3); continue
        except Exception: return None
    return None

# ----- Dedup -----

_STOP_TOKS = {
    'first','early','late','modern','ancient','great','new','old','high','low',
    'discovery','invention','beginning','beginnings','origin','origins','rise',
    'theory','principle','idea','concept','system','method','technique',
    'and','the','for','with','from','into','during','before','after','between',
    'human','people','social','political','cultural','economic','natural',
    'history','age','era','period','time','years','century',
    'introduction','invented','discovered','founded','established','formalized','formalised',
}

_TOK_INDEX = None
_TOK_BY_SLUG = {}

def _build_token_index(existing_set):
    global _TOK_INDEX, _TOK_BY_SLUG
    _TOK_INDEX = {}
    _TOK_BY_SLUG = {}
    for s in existing_set:
        toks = set(s.split('-'))
        toks = {t for t in toks if len(t) > 3 and t not in _STOP_TOKS}
        _TOK_BY_SLUG[s] = toks
        for t in toks:
            _TOK_INDEX.setdefault(t, set()).add(s)

def too_similar(name, existing_set):
    n = slugify(name)
    if n in existing_set: return True
    nt = set(n.split('-'))
    nt = {t for t in nt if len(t) > 3 and t not in _STOP_TOKS}
    if not nt: return False
    global _TOK_INDEX
    if _TOK_INDEX is None or len(_TOK_BY_SLUG) != len(existing_set):
        _build_token_index(existing_set)
    candidates = {}
    for t in nt:
        for s in _TOK_INDEX.get(t, ()):
            candidates[s] = candidates.get(s, 0) + 1
    for e, shared in candidates.items():
        et = _TOK_BY_SLUG[e]
        if not et: continue
        common = nt & et
        overlap = len(common) / max(len(nt), len(et))
        if overlap >= 0.85 and shared >= 3: return True
        if shared >= 2 and SequenceMatcher(None, n, e).ratio() > 0.88:
            return True
    return False

# ----- Main -----

def main():
    d = json.load(open(DATA))
    base_snap = frozenset(
        {t['id'] for t in d['ticks']} | {slugify(t['name']) for t in d['ticks']}
    )
    cand_files = sorted(CANDIDATES.glob('*.json'))
    print(f"Validating across {len(cand_files)} domain files (existing slugs: {len(base_snap)})...")

    total_cand = 0; total_valid = 0; total_dup = 0; total_nowiki = 0; total_era = 0
    for f in cand_files:
        dom = f.stem
        candidates = json.loads(f.read_text())
        total_cand += len(candidates)
        # Pre-filter: era + dedup
        keep = []
        for it in candidates:
            name = (it.get('name') or '').strip()
            yn = it.get('yearN')
            try: yn = int(yn) if yn is not None else None
            except: yn = None
            if not name or yn is None or yn < -70000 or yn > 2026:
                total_era += 1; continue
            if too_similar(name, base_snap):
                total_dup += 1; continue
            it['_yearN'] = yn
            keep.append(it)

        # Sequential fetch with parallel workers (4 — safe under wiki rate limit)
        from concurrent.futures import ThreadPoolExecutor, as_completed
        valid_for_dom = []
        new_slugs = set()
        rate_lock = [0.0]
        import threading
        rate_mu = threading.Lock()
        def fetch_with_rate(it):
            title_hint = (it.get('wiki_search') or it.get('name') or '').strip()
            with rate_mu:
                # Min 0.25s between calls per worker (4 workers → ~16 req/s effective)
                wait = max(0.0, rate_lock[0] - time.time())
                if wait > 0: time.sleep(wait)
                rate_lock[0] = time.time() + 0.25
            resolved, text = wiki_extract_one(title_hint)
            if not text or len(text) < 400:
                # opensearch fallback
                found = wiki_search(it['name'])
                if found:
                    with rate_mu:
                        wait = max(0.0, rate_lock[0] - time.time())
                        if wait > 0: time.sleep(wait)
                        rate_lock[0] = time.time() + 0.25
                    resolved, text = wiki_extract_one(found)
            return (it, resolved, text)

        with ThreadPoolExecutor(max_workers=4) as ex:
            for it, resolved, text in ex.map(fetch_with_rate, keep):
                if not text or len(text) < 400:
                    total_nowiki += 1; continue
                sl = slugify(it['name'])
                if sl in new_slugs: total_dup += 1; continue
                new_slugs.add(sl)
                valid_for_dom.append({
                    'name': it['name'],
                    'year': it.get('year'),
                    'yearN': it.get('_yearN'),
                    'wiki_title': resolved,
                    'wiki_url': f"https://en.wikipedia.org/wiki/{urllib.parse.quote((resolved or '').replace(' ','_'))}",
                    'wiki_extract': (text or '')[:5000],
                    'constraint_dissolved': it.get('constraint_dissolved',''),
                })

        (VALIDATED/f'{dom}.json').write_text(json.dumps(valid_for_dom, ensure_ascii=False, indent=2))
        total_valid += len(valid_for_dom)
        print(f"  {dom}: {len(valid_for_dom)}/{len(candidates)} validated", flush=True)

    print(f"\nValidated {total_valid}/{total_cand} candidates "
          f"(dup: {total_dup}, no-wiki: {total_nowiki}, out-of-era: {total_era})")

if __name__ == '__main__':
    main()
