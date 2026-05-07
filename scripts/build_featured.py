#!/usr/bin/env python3
"""
Build /featured.json: the top 200 most-connected ticks.

Connectedness = parents + children. Ties broken by yearN ascending so older
ticks win when influence ties. This is the file an AI agent or a curious
visitor should load first if they want a curated tour, not a corpus dump.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data.json"
DST = ROOT / "featured.json"

BASE = "https://k3sava.github.io/ticks/#/walk/"


CANONICAL_HEROES = {
    # foundational, regardless of parent/child count.
    "recursive-language", "collective-fiction", "wheat-domestication",
    "sumerian-writing-first-literature", "gutenbergs-printing-press",
    "printing-press", "transistor-bell-labs-shockley-bardeen-brattain",
    "transistor-invention", "penicillin-fleming", "vaccination-jenner",
    "dna-double-helix-watson-crick-franklin",
    "crispr-discovery-doudna-charpentier", "general-relativity-einstein",
    "athenian-democracy", "magna-carta-rule-of-law-over-divine-right",
    "pacioli-double-entry-bookkeeping", "chatgpt-rlhf-alignment",
    "steam-engine-watts-rotary-motion", "the-pill-oral-contraceptive",
    "iphone-touchscreen-computing", "haber-bosch-nitrogen-fixation",
    "public-key-cryptography-diffie-hellman",
    "mosaic-browser-internet-as-publishing-medium",
}


def main():
    d = json.loads(SRC.read_text())
    unlocks = d.get("unlocks", {})
    unlocked_by = d.get("unlockedBy", {})

    by_id = {t["id"]: t for t in d["ticks"]}

    scored = []
    for t in d["ticks"]:
        c = len(unlocks.get(t["id"], []))
        p = len(unlocked_by.get(t["id"], []))
        # Children weight 2x so foundational ticks (high downstream) win
        # over way-stations (high upstream).
        score = c * 2 + p
        scored.append((score, c, p, t))

    scored.sort(key=lambda r: (-r[0], -r[1], r[3].get("yearN") or 0))

    # Ensure every canonical hero we can find is in the result, even if its
    # connectedness score doesn't make the top 200 on its own.
    chosen_ids = set()
    top = []
    for s, c, p, t in scored:
        if len(top) >= 200:
            break
        chosen_ids.add(t["id"])
        top.append((s, c, p, t))

    for hero in CANONICAL_HEROES:
        if hero in by_id and hero not in chosen_ids:
            t = by_id[hero]
            c = len(unlocks.get(hero, []))
            p = len(unlocked_by.get(hero, []))
            # Replace the lowest-scoring non-hero in the top set.
            for i in range(len(top) - 1, -1, -1):
                if top[i][3]["id"] not in CANONICAL_HEROES:
                    top[i] = (c * 2 + p, c, p, t)
                    chosen_ids.add(hero)
                    break

    top.sort(key=lambda r: (-r[0], -r[1], r[3].get("yearN") or 0))

    items = []
    for total, c, p, t in top:
        items.append({
            "id": t["id"],
            "name": t["name"],
            "year": t["year"],
            "yearN": t.get("yearN"),
            "zone": t["zone"],
            "domain": t["domain"],
            "constraint": t["constraint"],
            "parents": p,
            "children": c,
            "connectedness": total,
            "url": BASE + t["id"],
        })

    out = {
        "name": "Ticks · featured 200",
        "description": "The 200 most-connected moments. Each one stitches together more of the chain than any single thread suggests.",
        "homepage": "https://k3sava.github.io/ticks/",
        "license": "https://opensource.org/licenses/MIT",
        "ranking": "parents + children desc, then children desc, then yearN asc",
        "count": len(items),
        "items": items,
    }
    DST.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"+ wrote {DST.name}: {len(items)} items")


if __name__ == "__main__":
    main()
