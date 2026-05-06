#!/usr/bin/env python3
"""For each validated candidate, ask flash to draft a full tick payload using
the Wikipedia extract as ground truth. Output: .audit-cache/drafts/{domain}.json
"""
import json, subprocess, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
VALIDATED = ROOT/'.audit-cache'/'validated'
DRAFTS = ROOT/'.audit-cache'/'drafts'
DRAFTS.mkdir(parents=True, exist_ok=True)
ASK_FLASH = Path.home()/'bin'/'ask-flash'

PROMPT = """You are drafting a "tick" for a database of constraint-dissolving moments in history.

A tick captures the moment a constraint dissolved — before it, X was impossible; after it, a flood of new things became possible.

Below is a candidate: a name, a year, the constraint dissolved (rough draft), and a Wikipedia extract that you should treat as ground truth.

Your job: produce the final structured tick. Use ONLY facts present in the Wikipedia extract. If the extract contradicts the proposed year, use the year the extract supports. If the extract is too thin to write a confident tick, return {"reject": "reason"}.

Output ONLY a JSON object:
{
  "id": "kebab-case-slug-derived-from-name",
  "year": "1769 AD" or "350 BC" formatted exactly,
  "yearN": -350 (signed integer; negative for BC),
  "name": "Polished tick name (≤9 words). No 'first' if redundant; lead with the entity.",
  "domain": "{domain}",
  "constraint": "lowercase one-line description of what was impossible/limited before. Plain English.",
  "detail": "2-4 sentences. The first sentence states what happened. The second states what it dissolved or unlocked. Optional third gives a vivid concrete consequence. No throat-clearing. No 'this was a turning point' filler.",
  "wiki_url": "{wiki_url}"
}

Tick:
NAME: {name}
PROPOSED YEAR: {year}
CONSTRAINT (rough): {constraint_dissolved}
WIKI TITLE: {wiki_title}

WIKIPEDIA EXTRACT:
{wiki_extract}
"""

def call_flash(prompt, temp=0.2, tokens=900):
    r = subprocess.run(
        [str(ASK_FLASH), '--quiet', '--temperature', str(temp), '--max-tokens', str(tokens), prompt],
        capture_output=True, text=True, timeout=120
    )
    return r.stdout

def parse_json_object(text):
    s = text.find('{')
    if s < 0: return None
    depth = 0
    for i in range(s, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                blob = text[s:i+1]
                try: return json.loads(blob)
                except:
                    blob2 = re.sub(r',\s*([}\]])', r'\1', blob)
                    try: return json.loads(blob2)
                    except: return None
    return None

def draft_one(item, dom):
    prompt = PROMPT.format(
        domain=dom,
        name=item['name'], year=item['year'],
        wiki_url=item['wiki_url'],
        wiki_title=item.get('wiki_title',''),
        constraint_dissolved=item.get('constraint_dissolved',''),
        wiki_extract=item['wiki_extract'][:4000],
    )
    out = call_flash(prompt)
    obj = parse_json_object(out)
    return obj

def main():
    files = sorted(VALIDATED.glob('*.json'))
    print(f"Drafting ticks across {len(files)} domain files...")
    total_done = 0; total_rej = 0
    for f in files:
        dom = f.stem
        validated = json.loads(f.read_text())
        # resumable
        out_path = DRAFTS/f'{dom}.json'
        prior = []
        if out_path.exists():
            try: prior = json.loads(out_path.read_text())
            except: prior = []
        prior_names = {p.get('name') for p in prior if isinstance(p, dict) and not p.get('reject')}
        todo = [v for v in validated if v.get('name') not in prior_names]
        if not todo:
            print(f"  {dom}: all {len(validated)} already drafted (skip)")
            continue
        results = list(prior)
        t0 = time.time()
        with ThreadPoolExecutor(max_workers=4) as ex:
            futs = {ex.submit(draft_one, item, dom): item for item in todo}
            done = 0
            for fut in as_completed(futs):
                item = futs[fut]
                try:
                    obj = fut.result()
                except Exception as e:
                    obj = None
                if not obj or obj.get('reject'):
                    results.append({'reject': obj.get('reject','no-output') if obj else 'flash-fail', 'name': item['name']})
                    total_rej += 1
                else:
                    obj['_source_name'] = item['name']
                    results.append(obj)
                    total_done += 1
                done += 1
                if done % 20 == 0:
                    print(f"    {dom}: {done}/{len(todo)} ({time.time()-t0:.0f}s)", flush=True)
                # incrementally save
                out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"  {dom}: drafted {len(results)} (rejected so far: {total_rej})", flush=True)
    print(f"\nTotal drafted: {total_done} (rejected: {total_rej})")

if __name__ == '__main__':
    main()
