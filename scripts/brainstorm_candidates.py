#!/usr/bin/env python3
"""For each (domain, era) cell, ask-flash for candidate ticks not yet in corpus.
Output: .audit-cache/candidates/{domain}.json — list of {name, year, brief}."""
import json, subprocess, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
OUT = ROOT/'.audit-cache'/'candidates'
OUT.mkdir(parents=True, exist_ok=True)
ASK_FLASH = Path.home()/'bin'/'ask-flash'

DOMAIN_PROMPTS = {
    'agriculture': "agriculture, food production, farming systems, animal husbandry, crops, food preservation, food technology, agribusiness",
    'art': "visual art, music, dance, theater, film, architecture (when artistic), literature, design movements",
    'biology': "biology, ecology, genetics, microbiology, anatomy, evolution, taxonomy, life sciences",
    'computing': "computing, software, algorithms, networks, AI/ML, data, security, programming languages",
    'economics': "economics, finance, trade, markets, monetary policy, banking, business models, taxation",
    'language': "language, writing systems, scripts, linguistics, translation, dictionaries, communication tech",
    'law': "law, legal systems, codes, courts, rights, treaties, regulation, legal philosophy",
    'medicine': "medicine, surgery, public health, drugs, diagnostics, hospitals, medical practice",
    'mind': "psychology, cognitive science, neuroscience, philosophy of mind, mental health, learning",
    'philosophy': "philosophy, metaphysics, epistemology, ethics, political philosophy, philosophy of science",
    'physics': "physics, chemistry, astronomy, materials, mechanics, thermodynamics, electromagnetism, quantum, relativity",
    'religion': "religion, theology, religious movements, sects, scripture, spiritual practice, religious institutions",
    'society': "society, civilization, demographics, urbanization, gender, race, family, education, media",
    'war': "warfare, military technology, strategy, doctrine, organization, weaponry, intelligence, treaties",
}

ZONES = [
    ('cognitive-leap', '70,000 BC – 10,000 BC', 'pre-agricultural Homo sapiens emergence'),
    ('settled-world', '10,000 BC – 3,000 BC', 'Neolithic revolution, settlement, early tech'),
    ('first-civilizations', '3,000 BC – 800 BC', 'Bronze Age, first writing, cities'),
    ('axial-age', '800 BC – 200 BC', 'Greek philosophy, Confucius, Buddha, prophets'),
    ('classical-empires', '200 BC – 475 AD', 'Roman/Han/Maurya empires, classical antiquity'),
    ('post-classical', '475 AD – 1450 AD', 'Medieval, Islamic Golden Age, Song China'),
    ('early-modern', '1450 AD – 1750 AD', 'Renaissance, Reformation, Scientific Revolution'),
    ('industrial', '1750 AD – 1880 AD', 'Industrial Revolution, steam, mechanization'),
    ('electric-age', '1880 AD – 1945 AD', 'Electrification, modernism, world wars'),
    ('space-digital', '1945 AD – 1990 AD', 'Cold War, space, semiconductors, Internet origins'),
    ('network-age', '1990 AD – 2010 AD', 'Web, mobile, globalization'),
    ('ai-era', '2010 AD – 2025 AD', 'Deep learning, transformers, LLMs'),
]

def existing_in_domain(d, dom):
    out = []
    for t in d['ticks']:
        if t['domain']==dom:
            out.append(f"  - {t['year']}: {t['name']}")
    return out

def call_flash(prompt, temp=0.4, tokens=3000):
    r = subprocess.run(
        [str(ASK_FLASH), '--quiet', '--temperature', str(temp), '--max-tokens', str(tokens), prompt],
        capture_output=True, text=True, timeout=180
    )
    return r.stdout

PROMPT = """Brainstorm important events, discoveries, inventions, or movements in {domain_topic} that meet ALL of these criteria:

1. Must have dissolved a meaningful constraint — before it, X was impossible or radically harder; after it, a flood of new things became possible.
2. Must occur in the era: {era_name} ({era_range}). Era flavor: {era_flavor}.
3. Must have a Wikipedia article in English (or be widely documented).
4. Must NOT already be in this list (these are already known):

{existing}

Output 25 candidates as a JSON array — no prose, no markdown fence — with this schema per item:
{{"name":"Short evocative tick name (≤8 words, no parenthetical attribution)","year":"YEAR_AS_STRING (e.g. '1769 AD' or '350 BC')","yearN":SIGNED_INT_YEAR,"wiki_search":"best Wikipedia article title to look up","constraint_dissolved":"one-line description of what was impossible before"}}

Be specific (a precise event, not a vague trend). Be diverse (different sub-areas of the domain). Be honest about year (use canonical academic dating).
"""

def gen_for_cell(d, dom, zone_id, era_name, era_range, era_flavor):
    existing = []
    for t in d['ticks']:
        if t['domain']==dom and t['zone']==zone_id:
            existing.append(f"  - {t['year']}: {t['name']}")
    if len(existing) > 25:
        existing = existing[:25] + [f"  ... and {len(existing)-25} more"]
    prompt = PROMPT.format(
        domain_topic=DOMAIN_PROMPTS[dom],
        era_name=era_name, era_range=era_range, era_flavor=era_flavor,
        existing="\n".join(existing) if existing else "  (none yet — propose foundational events)"
    )
    out = call_flash(prompt, temp=0.5, tokens=3500)
    # parse JSON array
    s = out.find('[')
    if s < 0: return []
    depth = 0
    for i in range(s, len(out)):
        if out[i] == '[': depth += 1
        elif out[i] == ']':
            depth -= 1
            if depth == 0:
                blob = out[s:i+1]
                try: return json.loads(blob)
                except:
                    blob2 = re.sub(r',\s*([\]}])', r'\1', blob)
                    try: return json.loads(blob2)
                    except: return []
    return []

def main():
    import sys
    d = json.load(open(DATA))
    only_dom = sys.argv[1] if len(sys.argv) > 1 else None
    doms = [only_dom] if only_dom else list(DOMAIN_PROMPTS.keys())
    cells = []
    for dom in doms:
        for zone_id, era_range, era_flavor in ZONES:
            era_name = next(z['name'] for z in d['zones'] if z['id']==zone_id)
            cells.append((dom, zone_id, era_name, era_range, era_flavor))

    # Pre-load existing per-domain candidate files for resumability
    saved = {}  # dom -> set of cell ids already done
    for dom in doms:
        f = OUT/f'{dom}.json'
        if f.exists():
            try:
                cur = json.loads(f.read_text())
                saved[dom] = cur if isinstance(cur, list) else []
            except: saved[dom] = []
        else:
            saved[dom] = []

    # Track which cells already have results (by counting candidates that have year matching era)
    def cell_done(dom, zone_id):
        zone = next(z for z in d['zones'] if z['id']==zone_id)
        cnt = sum(1 for c in saved[dom] if isinstance(c,dict) and zone['from'] <= c.get('yearN',0) <= zone['to'])
        return cnt >= 8  # consider done if we have enough

    todo = [c for c in cells if not cell_done(c[0], c[1])]
    print(f"Brainstorming {len(todo)} (domain × era) cells (skipping {len(cells)-len(todo)} already populated)...")
    t0 = time.time()
    completed = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(gen_for_cell, d, *args): args for args in todo}
        for f in as_completed(futs):
            args = futs[f]
            dom, zone_id = args[0], args[1]
            try:
                results = f.result()
            except Exception as e:
                print(f"  err {dom}/{zone_id}: {e}"); results = []
            saved[dom].extend(results)
            completed += 1
            print(f"  [{completed}/{len(todo)}] {dom}/{zone_id}: +{len(results)} ({time.time()-t0:.0f}s)", flush=True)
            # Persist incrementally
            seen = set(); unique = []
            for it in saved[dom]:
                if not isinstance(it, dict): continue
                n = it.get('name','').strip()
                if not n or n.lower() in seen: continue
                seen.add(n.lower())
                unique.append(it)
            saved[dom] = unique
            (OUT/f'{dom}.json').write_text(json.dumps(unique, ensure_ascii=False, indent=2))

    total = sum(len(saved[dom]) for dom in doms)
    print(f"\nTotal candidates generated: {total}")
    for dom in doms:
        print(f"  {dom}: {len(saved[dom])} candidates")

if __name__ == '__main__':
    main()
