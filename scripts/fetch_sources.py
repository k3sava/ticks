#!/usr/bin/env python3
"""For each tick, fetch the primary cited source and save plain text.

Preferences:
  1. The first Wikipedia link if any (Wikipedia API plain-extract).
  2. Otherwise the first link, raw HTML stripped to text.

Output: .audit-cache/sources/{tick_id}.txt
"""
import json, urllib.request, urllib.parse, urllib.error, ssl, re, html, concurrent.futures, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CACHE = ROOT/'.audit-cache'/'sources'
CACHE.mkdir(parents=True, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15',
    'Accept-Language': 'en-US,en;q=0.9',
}

def wiki_extract(url):
    # https://en.wikipedia.org/wiki/Slug -> API plain-text
    if 'wikipedia.org/wiki/' not in url: return None
    slug = url.split('/wiki/', 1)[1].split('#')[0].split('?')[0]
    api = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles={slug}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8', 'replace'))
        pages = data.get('query', {}).get('pages', {})
        for pid, p in pages.items():
            if pid == '-1': return None
            return p.get('extract', '')
    except Exception:
        return None
    return None

def html_text(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            ct = r.headers.get('Content-Type','')
            if 'pdf' in ct.lower(): return f"[PDF source — full text not extracted: {url}]"
            raw = r.read(200_000)
        text = raw.decode('utf-8', 'replace')
        # crude strip: kill scripts/styles
        text = re.sub(r'<script[^>]*>.*?</script>', ' ', text, flags=re.S|re.I)
        text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.S|re.I)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:6000]
    except Exception as e:
        return None

def pick_url(t):
    # first Wikipedia link else first link
    wiki = next((l['url'] for l in t.get('links',[]) if 'wikipedia.org/wiki/' in l['url']), None)
    if wiki: return wiki, 'wiki'
    if t.get('links'):
        return t['links'][0]['url'], 'html'
    return None, None

def fetch_one(t):
    out = CACHE/(t['id']+'.txt')
    if out.exists() and out.stat().st_size > 200:
        return (t['id'], 'cached')
    url, kind = pick_url(t)
    if url is None: return (t['id'], 'no-url')
    text = wiki_extract(url) if kind == 'wiki' else None
    if not text:
        text = html_text(url)
    if not text:
        return (t['id'], 'fail')
    payload = f"# {t['name']}\nyear: {t['year']}\nyearN: {t['yearN']}\nid: {t['id']}\nsource_url: {url}\n\n{text[:6000]}\n"
    out.write_text(payload, encoding='utf-8')
    return (t['id'], f'{kind}:{len(text)}')

def main():
    d = json.load(open(DATA))
    items = d['ticks']
    print(f"Fetching primary source for {len(items)} ticks → {CACHE}")
    t0 = time.time()
    done = fail = cached = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        for tid, status in ex.map(fetch_one, items):
            done += 1
            if status == 'cached': cached += 1
            if status in ('fail','no-url'): fail += 1
            if done % 100 == 0:
                print(f"  {done}/{len(items)} ({time.time()-t0:.0f}s) cached={cached} fail={fail}")
    print(f"done. ok={done-fail} fail={fail} cached={cached} elapsed={time.time()-t0:.0f}s")

if __name__ == '__main__':
    main()
