#!/usr/bin/env python3
"""For each tick where both verification passes flagged claim_verdict=WRONG,
the cited primary source is bogus. Find a Wikipedia article by tick name,
add it as a link if not present, and re-fetch its content as new source.
"""
import json, urllib.request, urllib.parse, ssl, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CACHE = ROOT/'.audit-cache'/'sources'
VERDICTS = ROOT/'.audit-cache'/'verdicts'/'all.json'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent':'ticks-audit/1.0 (https://github.com/k3sava/ticks; kesava@iamkesava.com) Python/3.9','Accept-Language':'en'}
import time as _time

def wiki_search(q):
    api = f"https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=3&search={urllib.parse.quote(q)}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return list(zip(data[1], data[3]))  # [(title, url), ...]
    except Exception:
        return []
    return []

def wiki_extract(slug):
    api = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles={urllib.parse.quote(slug)}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        for pid, p in data.get('query',{}).get('pages',{}).items():
            if pid == '-1': return None
            return p.get('extract','')
    except Exception:
        return None
    return None

def main():
    d = json.load(open(DATA))
    by_id = {t['id']: t for t in d['ticks']}
    if not VERDICTS.exists():
        print("No verdicts yet."); return
    verdicts = json.loads(VERDICTS.read_text())

    bad_claim = []
    for tid, vs in verdicts.items():
        A = vs.get('A', {})
        B = vs.get('B', {})
        if A.get('claim_verdict')=='WRONG' and B.get('claim_verdict')=='WRONG':
            bad_claim.append(tid)

    print(f"Ticks with both passes claiming source-mismatch: {len(bad_claim)}")
    fixed = 0
    no_match = []
    for tid in bad_claim:
        t = by_id.get(tid)
        if not t: continue
        _time.sleep(0.5)  # rate-limit polite
        # Use tick name; strip parenthetical disambiguator
        q = re.sub(r'\s*[—/(].*', '', t['name']).strip()
        results = wiki_search(q)
        if not results:
            _time.sleep(0.5)
            results = wiki_search(t['name'])
        if not results:
            no_match.append(tid); continue
        title, wiki_url = results[0]
        text = wiki_extract(title.replace(' ','_'))
        if not text or len(text) < 200:
            no_match.append(tid); continue
        # Replace primary link or insert at front
        existing_urls = {l['url'] for l in t.get('links', [])}
        if wiki_url not in existing_urls:
            t['links'] = [{'label': f'Wikipedia: {title}', 'url': wiki_url}] + t.get('links', [])
        else:
            # move to front
            t['links'] = [l for l in t['links'] if l['url']==wiki_url] + [l for l in t['links'] if l['url']!=wiki_url]
        # Update cached source
        payload = f"# {t['name']}\nyear: {t['year']}\nyearN: {t['yearN']}\nid: {t['id']}\nsource_url: {wiki_url}\nsource_kind: wiki-remediated\n\n{text[:6000]}\n"
        (CACHE/(t['id']+'.txt')).write_text(payload, encoding='utf-8')
        fixed += 1
        print(f"  ✓ {tid} → {title}")

    json.dump(d, open(DATA, 'w'), ensure_ascii=False)
    print(f"\nRemediated {fixed} ticks. {len(no_match)} had no Wikipedia match:")
    for tid in no_match:
        print(f"  - {tid}")

if __name__ == '__main__':
    main()
