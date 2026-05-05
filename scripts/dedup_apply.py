#!/usr/bin/env python3
"""Apply dedup decisions: delete redundant tick, redirect chain references to canonical."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT/'data.json'

# (delete_id, keep_id, note)
# Pairs where one entry is a clear duplicate of another (same event).
# Distinct-but-close pairs (special vs general relativity, Python vs C,
# Braille invented vs standardized, LLaMA vs LLaMA 3.1, WWW proposal vs
# protocols, PCR invention vs widespread, precision-guided early vs era)
# are intentionally NOT merged.
MERGES = [
    ("cell-theory-schleiden-and-schwann",
     "schleiden-schwann-cell-theory",
     "same event; 1839 framing kept"),
    ("nuclear-fission-hahn-meitner",
     "nuclear-fission-hahn-and-strassmann-meitner",
     "fission published Jan 1939; 1939 entry is correct"),
    ("green-revolution-borlaug-begins-wheat-breeding",
     "green-revolution-begins-borlaug-wheat",
     "Borlaug joined Mexico program 1944"),
    ("kidney-dialysis-machine-kolff",
     "kidney-dialysis-machine-kolff-artificial-organ",
     "same event; richer framing kept"),
    ("napster-p2p-file-sharing",
     "napster-peer-to-peer-file-sharing",
     "duplicate (same 1999)"),
    ("alexandrian-library-knowledge-aggregation",
     "library-of-alexandria-knowledge-aggregation",
     "same institution; founded ~283 BC"),
    ("cattle-domestication-aurochs-to-bos-taurus",
     "cattle-domestication-aurochs",
     "same event; ~8500 BC range, 7500 BC entry closer"),
    ("von-neumann-architecture",
     "von-neumann-architecture-stored-program-computing",
     "same 1945 event; richer framing kept"),
    ("transistor-bell-labs",
     "transistor-bell-labs-shockley-bardeen-brattain",
     "invented Dec 1947, announced 1948; richer framing kept"),
    ("drone-warfare-remote-combat",
     "drone-warfare-remotely-piloted-combat",
     "duplicate (same 2001)"),
    ("justinians-code-corpus-juris-civilis",
     "justinians-corpus-juris-civilis-roman-law-codified",
     "same code; first-issue 529 entry kept"),
    ("champollion-rosetta-stone-decoded",
     "champollion-deciphers-hieroglyphics-rosetta-stone",
     "same 1822 event"),
    ("unicode-global-character-encoding",
     "unicode-standard-universal-character-encoding",
     "same 1991 event"),
]

def main():
    d = json.load(open(DATA))
    ticks = d['ticks']
    unlocks = d['unlocks']
    unlocked_by = d['unlockedBy']

    redirect = {}
    for delete_id, keep_id, _ in MERGES:
        redirect[delete_id] = keep_id

    by_id = {t['id']: t for t in ticks}
    deleted = []
    for delete_id, keep_id, note in MERGES:
        if delete_id not in by_id:
            print(f"  skip (not present): {delete_id}")
            continue
        if keep_id not in by_id:
            print(f"  ERROR keep_id missing: {keep_id}"); continue
        deleted.append(delete_id)

    # Filter ticks
    new_ticks = [t for t in ticks if t['id'] not in deleted]

    def fix_list(lst):
        seen = set()
        out = []
        for x in lst:
            x2 = redirect.get(x, x)
            if x2 in seen: continue
            if x2 not in {t['id'] for t in new_ticks}: continue
            seen.add(x2)
            out.append(x2)
        return out

    valid_ids = {t['id'] for t in new_ticks}

    new_unlocks = {}
    for k, v in unlocks.items():
        k2 = redirect.get(k, k)
        if k2 not in valid_ids: continue
        merged = fix_list(v + new_unlocks.get(k2, []))
        # Don't link a tick to itself
        merged = [x for x in merged if x != k2]
        new_unlocks[k2] = merged

    new_unlocked_by = {}
    for k, v in unlocked_by.items():
        k2 = redirect.get(k, k)
        if k2 not in valid_ids: continue
        merged = fix_list(v + new_unlocked_by.get(k2, []))
        merged = [x for x in merged if x != k2]
        new_unlocked_by[k2] = merged

    d['ticks'] = new_ticks
    d['unlocks'] = new_unlocks
    d['unlockedBy'] = new_unlocked_by

    json.dump(d, open(DATA, 'w'), ensure_ascii=False)

    print(f"\nDeleted {len(deleted)} ticks. Remaining: {len(new_ticks)}.")
    print("Edges merged. Self-links removed.")

if __name__ == '__main__':
    main()
