#!/usr/bin/env python3
"""Fix fabricated Wikipedia URLs in the corpus.

Heuristic 1: URLs with '___' (triple underscore) had a descriptor appended
during ingest. Take the part before '___'.

Heuristic 2: URLs without '___' but with verbose, non-canonical slugs
(full-sentence titles) need hand-mapping.
"""
import json, re, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'

# Hand-map for non-'___' fabricated slugs
HAND_MAP = {
    "Strategic_bombing_doctrine_validated_and_questioned": "Strategic_bombing",
    "Moon_landing_as_shared_global_television_event": "Moon_landing",
    "Novel_as_dominant_literary_form_Richardson_Fielding": "Novel",
    "Russian_Revolution_first_communist_state": "Russian_Revolution",
    "Soviet_Union_dissolution_end_of_communism": "Dissolution_of_the_Soviet_Union",
    "Roman_census_population_management": "Roman_census",
    "Synthetic_organic_chemistry_total_synthesis": "Total_synthesis",
    "ARPANET_first_message___internet_origin": "ARPANET",
    "Memex_concept_Bush___hypertext_origin": "Memex",
}

def fix_url(url):
    if 'wikipedia.org/wiki/' not in url:
        return url, False
    base, slug = url.split('/wiki/', 1)
    # strip fragment/query
    frag = ''
    if '#' in slug:
        slug, frag = slug.split('#', 1); frag = '#'+frag
    qs = ''
    if '?' in slug:
        slug, qs = slug.split('?', 1); qs = '?'+qs

    new_slug = None
    if slug in HAND_MAP:
        new_slug = HAND_MAP[slug]
    elif '___' in slug:
        new_slug = slug.split('___')[0]

    if new_slug is None:
        return url, False
    return f"{base}/wiki/{new_slug}{qs}{frag}", True

def main():
    d = json.load(open(DATA))
    fixed = 0
    examples = []
    for t in d['ticks']:
        for l in t.get('links', []):
            old = l['url']
            new, ch = fix_url(old)
            if ch:
                l['url'] = new
                fixed += 1
                if len(examples) < 10:
                    examples.append((t['id'], old, new))
    json.dump(d, open(DATA, 'w'), ensure_ascii=False)
    print(f"Fixed {fixed} Wikipedia URLs.")
    for tid, o, n in examples:
        print(f"  {tid}\n    OLD: {o}\n    NEW: {n}")

if __name__ == '__main__':
    main()
