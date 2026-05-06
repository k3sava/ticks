#!/usr/bin/env python3
"""HEAD-check all non-Wikipedia source URLs.

Outputs:
  - AUDIT-DEADLINKS.md: list of URLs returning non-200/3xx, grouped by tick.
"""
import json, urllib.request, urllib.error, ssl, concurrent.futures, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
OUT = ROOT/'AUDIT-DEADLINKS.md'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

d = json.load(open(DATA))
items = []  # (tick_id, label, url)
for t in d['ticks']:
    for l in t.get('links', []):
        u = l.get('url', '')
        if 'wikipedia.org/wiki/' in u: continue
        items.append((t['id'], l.get('label',''), u))
print(f"Non-wiki links to check: {len(items)}")

def check(item):
    tid, label, u = item
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15', 'Accept': '*/*'}
    # Try HEAD first; many servers reject HEAD so fall back to GET range
    for method in ('HEAD', 'GET'):
        try:
            req = urllib.request.Request(u, method=method, headers={**headers, 'Range': 'bytes=0-1024'} if method=='GET' else headers)
            with urllib.request.urlopen(req, timeout=8, context=ctx) as resp:
                return (resp.status, tid, label, u)
        except urllib.error.HTTPError as e:
            if e.code in (405, 501) and method == 'HEAD':
                continue  # try GET
            return (e.code, tid, label, u)
        except Exception:
            if method == 'HEAD':
                continue
            return (-1, tid, label, u)
    return (-1, tid, label, u)

bad = []
done = 0
total = len(items)
t0 = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as ex:
    futs = {ex.submit(check, x): x for x in items}
    for f in concurrent.futures.as_completed(futs):
        try:
            code, tid, label, u = f.result()
        except Exception:
            continue
        done += 1
        if code not in (200, 301, 302, 303, 307, 308, 403, 405, 999, 429):
            bad.append((code, tid, label, u))
        if done % 250 == 0:
            print(f"  {done}/{total} ({time.time()-t0:.0f}s) — {len(bad)} bad so far")

print(f"Done {done}/{total} in {time.time()-t0:.0f}s. Bad: {len(bad)}")

# Group by tick
by_tick = {}
for c, tid, label, u in bad:
    by_tick.setdefault(tid, []).append((c, label, u))

with open(OUT, 'w') as f:
    f.write(f"# Dead non-Wikipedia source links\n\n")
    f.write(f"Checked {total} unique non-wiki source URLs. {len(bad)} returned errors (404/-1/etc).\n")
    f.write(f"Treating 200/3xx/403/405/429/999 as OK (HEAD blocked, rate-limited, or anti-bot).\n\n")
    for tid in sorted(by_tick):
        f.write(f"## {tid}\n\n")
        for c, label, u in by_tick[tid]:
            f.write(f"- `{c}` — [{label}]({u})\n")
        f.write("\n")

print(f"Wrote {OUT}")
