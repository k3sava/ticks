#!/usr/bin/env python3
"""Multi-pass claim verification via DeepSeek V4 Flash (ask-flash).

Two independent passes per batch with different framings; only verdicts that
agree across both passes are trusted. Disagreements are logged for human/Claude
review. Year corrections are auto-applied only when:
  - both passes return WRONG_YEAR
  - both pass suggested years agree within ±10 years
  - existing year is off by >50 years
"""
import json, subprocess, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'
CACHE = ROOT/'.audit-cache'/'sources'
VERDICTS = ROOT/'.audit-cache'/'verdicts'
VERDICTS.mkdir(parents=True, exist_ok=True)
ASK_FLASH = Path.home()/'bin'/'ask-flash'

BATCH_SIZE = 5
WORKERS = 6  # parallel ask-flash calls

PROMPT_A = """You are auditing a database of historical "ticks" — moments when a constraint dissolved.

For each tick below (delimited by ===TICK===), judge against its source text:
- year_verdict: "CORRECT" if source confirms the year within tolerance (±10% for pre-1500, ±15 yrs post-1500); "WRONG" only if source clearly indicates a different year outside tolerance; "UNCERTAIN" if source silent or ambiguous.
- year_suggestion: only if year_verdict=WRONG, the year the source supports (use negative for BC, e.g., -3500). Else null.
- claim_verdict: "CORRECT" if the source describes this event/entity; "WRONG" if source is about a different event; "UNCERTAIN" if too vague.
- evidence: ≤25 word quote from source supporting your verdict.

Output ONLY a valid JSON array. No prose. No markdown fences. Schema per tick:
{"id":"...","year_verdict":"CORRECT|WRONG|UNCERTAIN","year_suggestion":null,"claim_verdict":"CORRECT|WRONG|UNCERTAIN","evidence":"..."}
"""

PROMPT_B = """Audit each historical "tick" against its source. Be strict.

For each tick:
1. Does the source text mention this event/person/invention? If not, claim_verdict=WRONG. If yes, claim_verdict=CORRECT. If genuinely ambiguous, UNCERTAIN.
2. Does the source give a date for the event? Compare with tolerance: ±10% of |year| for events before 1500 (so 10,000 BC ±1000 is fine), or ±15 yrs for events after 1500. If within tolerance, CORRECT. If clearly outside, WRONG and provide source's year as year_suggestion (negative=BC). If no clear date, UNCERTAIN.
3. evidence = direct ≤25 word quote.

Output ONLY a JSON array of objects: {"id","year_verdict","year_suggestion","claim_verdict","evidence"}
"""

def call_flash(prompt, batch_text, temperature=0.0):
    proc = subprocess.run(
        [str(ASK_FLASH), '--quiet', '--temperature', str(temperature),
         '--max-tokens', '2000', prompt],
        input=batch_text, capture_output=True, text=True, timeout=120
    )
    return proc.stdout

def parse_json_array(text):
    # Find first [ ... ] block
    s = text.find('[')
    if s < 0: return []
    # naive depth match
    depth = 0
    for i in range(s, len(text)):
        c = text[i]
        if c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                blob = text[s:i+1]
                try:
                    return json.loads(blob)
                except Exception:
                    # try to fix common issues
                    blob2 = re.sub(r',\s*([\]}])', r'\1', blob)
                    try: return json.loads(blob2)
                    except: return []
    return []

def build_batch_text(batch):
    chunks = []
    for tid, src in batch:
        chunks.append(f"===TICK===\n{src}\n===END===")
    return "\n\n".join(chunks)

def process_batch(batch_idx, batch):
    """batch: list of (tick_id, source_text). Returns (idx, results_dict)."""
    batch_text = build_batch_text(batch)
    out = {tid: {} for tid, _ in batch}
    for label, prompt, temp in [('A', PROMPT_A, 0.0), ('B', PROMPT_B, 0.2)]:
        try:
            response = call_flash(prompt, batch_text, temp)
            results = parse_json_array(response)
            for r in results:
                tid = r.get('id','')
                if tid in out:
                    out[tid][label] = r
        except subprocess.TimeoutExpired:
            pass
        except Exception as e:
            print(f"  batch {batch_idx} pass {label}: error {e}")
    return batch_idx, out

def main():
    import sys
    force = '--force' in sys.argv
    d = json.load(open(DATA))
    by_id = {t['id']: t for t in d['ticks']}

    # Load existing verdicts (resumable)
    existing = {}
    if (VERDICTS/'all.json').exists():
        try: existing = json.loads((VERDICTS/'all.json').read_text())
        except: existing = {}

    # Build list of (tick_id, source_text) where source exists and not yet verdicted
    items = []
    for t in d['ticks']:
        sf = CACHE/(t['id']+'.txt')
        if sf.exists() and sf.stat().st_size > 300:
            if not force and t['id'] in existing and 'A' in existing[t['id']] and 'B' in existing[t['id']]:
                continue
            items.append((t['id'], sf.read_text(encoding='utf-8', errors='replace')))
    print(f"Verifying {len(items)} ticks (existing verdicts: {len(existing)})...")

    # Batch
    batches = [items[i:i+BATCH_SIZE] for i in range(0, len(items), BATCH_SIZE)]
    print(f"{len(batches)} batches × 2 passes")

    all_verdicts = dict(existing)
    t0 = time.time()
    completed = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(process_batch, i, b): i for i, b in enumerate(batches)}
        for fut in as_completed(futs):
            try:
                idx, results = fut.result()
                all_verdicts.update(results)
            except Exception as e:
                print(f"  batch error: {e}")
            completed += 1
            if completed % 20 == 0 or completed == len(batches):
                print(f"  {completed}/{len(batches)} batches ({time.time()-t0:.0f}s)")
            # Persist incrementally
            (VERDICTS/'all.json').write_text(json.dumps(all_verdicts, ensure_ascii=False))

    print(f"Done. Got verdicts for {len(all_verdicts)} ticks.")

if __name__ == '__main__':
    main()
