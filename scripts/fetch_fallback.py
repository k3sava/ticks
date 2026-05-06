#!/usr/bin/env python3
"""For ticks missing a primary source cache, try the 2nd and 3rd cited links,
then fall back to a Wikipedia search by name."""
import json, urllib.request, urllib.parse, ssl, re, html, concurrent.futures, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CACHE = ROOT/'.audit-cache'/'sources'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent':'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15','Accept-Language':'en'}

def wiki_extract_by_title(title):
    api = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles={urllib.parse.quote(title)}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        for pid, p in data.get('query',{}).get('pages',{}).items():
            if pid == '-1': return None
            t = p.get('extract','')
            if t: return t
    except Exception:
        return None
    return None

def wiki_search(q):
    api = f"https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search={urllib.parse.quote(q)}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        if isinstance(data, list) and len(data) >= 2 and data[1]:
            return data[1][0]  # title
    except Exception:
        return None
    return None

def html_text(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            ct = r.headers.get('Content-Type','')
            if 'pdf' in ct.lower(): return None
            raw = r.read(200_000)
        text = raw.decode('utf-8','replace')
        text = re.sub(r'<script[^>]*>.*?</script>',' ',text,flags=re.S|re.I)
        text = re.sub(r'<style[^>]*>.*?</style>',' ',text,flags=re.S|re.I)
        text = re.sub(r'<[^>]+>',' ',text)
        text = html.unescape(text)
        text = re.sub(r'\s+',' ',text).strip()
        return text[:6000] if len(text) > 200 else None
    except Exception:
        return None

def write_source(t, url, text, kind):
    payload = f"# {t['name']}\nyear: {t['year']}\nyearN: {t['yearN']}\nid: {t['id']}\nsource_url: {url}\nsource_kind: {kind}\n\n{text[:6000]}\n"
    (CACHE/(t['id']+'.txt')).write_text(payload, encoding='utf-8')

def fetch_for(t):
    cache = CACHE/(t['id']+'.txt')
    if cache.exists() and cache.stat().st_size > 300: return (t['id'],'cached')
    # try non-wiki links (skipping the first which already failed if cached doesn't exist) — actually just try all in order
    for l in t.get('links', []):
        u = l['url']
        if 'wikipedia.org/wiki/' in u:
            slug = u.split('/wiki/')[-1].split('#')[0].split('?')[0]
            text = wiki_extract_by_title(slug)
            if text:
                write_source(t, u, text, 'wiki-direct'); return (t['id'],'wiki-direct')
        else:
            text = html_text(u)
            if text:
                write_source(t, u, text, 'html-fallback'); return (t['id'],'html-fallback')
    # last resort: wiki search by name
    title = wiki_search(t['name'])
    if title:
        text = wiki_extract_by_title(title)
        if text:
            url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ','_'))}"
            write_source(t, url, text, 'wiki-search')
            return (t['id'], f'wiki-search:{title}')
    return (t['id'], 'fail')

def main():
    d = json.load(open(DATA))
    missing = [t for t in d['ticks'] if not (CACHE/(t['id']+'.txt')).exists() or (CACHE/(t['id']+'.txt')).stat().st_size <= 300]
    print(f"Fallback fetch for {len(missing)} ticks")
    t0 = time.time()
    stats = {'cached':0,'wiki-direct':0,'html-fallback':0,'fail':0}
    wiki_search_hits = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        for tid, status in ex.map(fetch_for, missing):
            for k in stats:
                if status.startswith(k): stats[k]+=1; break
            else:
                if status.startswith('wiki-search'):
                    wiki_search_hits.append((tid, status))
                    stats['wiki-direct'] += 1
    print(f"Done in {time.time()-t0:.0f}s. Stats: {stats}")
    if wiki_search_hits:
        print(f"Used wiki-search fallback for {len(wiki_search_hits)} ticks (verify quality):")
        for tid, status in wiki_search_hits[:30]:
            print(f"  {tid} → {status}")

if __name__ == '__main__':
    main()
