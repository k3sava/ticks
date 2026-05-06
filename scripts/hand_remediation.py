#!/usr/bin/env python3
"""Apply hand-mapped Wikipedia article URLs for ticks where multi-pass verify
flagged claim mismatch. Set the wiki link as primary source and re-fetch."""
import json, urllib.request, urllib.parse, ssl, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CACHE = ROOT/'.audit-cache'/'sources'
VERDICTS = ROOT/'.audit-cache'/'verdicts'/'all.json'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent':'ticks-audit/1.0 (https://github.com/k3sava/ticks)','Accept-Language':'en'}

# Hand-mapped tick_id -> Wikipedia article slug
MAP = {
    'heparin-anticoagulant': 'Heparin',
    'rem-sleep-discovery': 'Rapid_eye_movement_sleep',
    'first-heart-transplant-barnard': 'Christiaan_Barnard',
    'laparoscopic-surgery': 'Laparoscopy',
    'dna-discovered-miescher': 'Friedrich_Miescher',
    'george-miller-working-memory-limits-7-2': 'The_Magical_Number_Seven,_Plus_or_Minus_Two',
    'punk-rock-diy-cultural-production': 'Punk_rock',
    'semmelweis-handwashing-in-obstetrics': 'Ignaz_Semmelweis',
    'liver-transplant-starzl-organ-replacement': 'Thomas_Starzl',
    'laparoscopic-cholecystectomy-becomes-standard': 'Cholecystectomy',
    'arpa-first-email-tomlinson-and-symbol': 'Ray_Tomlinson',
    'newtons-apple-gravity-as-universal': 'Newton%27s_apple',
    'battle-of-quebec-amphibious-operational-art': 'Battle_of_the_Plains_of_Abraham',
    'metagenomics-microbiome-discovery': 'Metagenomics',
    'rna-world-hypothesis-supported': 'RNA_world',
    'three-field-system-widespread-adoption': 'Three-field_system',
    'guano-trade-first-chemical-fertilizer': 'Guano',
    'spontaneous-generation-disproven-redi': 'Francesco_Redi',
    'antipsychotic-drugs-chlorpromazine': 'Chlorpromazine',
    'alphaproof-ai-solves-imo-problems': 'AlphaProof',
}

def wiki_extract(slug):
    api = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles={slug}"
    try:
        req = urllib.request.Request(api, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            data = json.loads(r.read().decode('utf-8','replace'))
        for pid, p in data.get('query',{}).get('pages',{}).items():
            if pid == '-1': return None
            return p.get('extract','')
    except Exception as e:
        print(f"    error: {e}")
        return None
    return None

def main():
    d = json.load(open(DATA))
    by_id = {t['id']: t for t in d['ticks']}
    verdicts = json.loads(VERDICTS.read_text())

    fixed = 0
    failed = []
    for tid, slug in MAP.items():
        if tid not in by_id:
            print(f"  missing tick: {tid}"); continue
        t = by_id[tid]
        time.sleep(0.6)
        text = wiki_extract(slug)
        if not text or len(text) < 200:
            failed.append((tid, slug)); continue
        url = f"https://en.wikipedia.org/wiki/{slug}"
        # Move/insert as primary
        existing = [l for l in t.get('links', []) if l['url'] != url]
        t['links'] = [{'label': f'Wikipedia: {slug.replace("_"," ")}', 'url': url}] + existing
        # Update cached source
        payload = f"# {t['name']}\nyear: {t['year']}\nyearN: {t['yearN']}\nid: {t['id']}\nsource_url: {url}\nsource_kind: hand-remediated\n\n{text[:6000]}\n"
        (CACHE/(t['id']+'.txt')).write_text(payload, encoding='utf-8')
        # Drop old verdict so verify will re-judge
        if tid in verdicts:
            del verdicts[tid]
        fixed += 1
        print(f"  ✓ {tid} → {slug}")

    json.dump(d, open(DATA, 'w'), ensure_ascii=False)
    Path(VERDICTS).write_text(json.dumps(verdicts, ensure_ascii=False))
    print(f"\nRemediated {fixed} ticks. Failed: {len(failed)}")
    for tid, slug in failed:
        print(f"  - {tid} (slug: {slug})")

if __name__ == '__main__':
    main()
