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


def main():
    d = json.loads(SRC.read_text())
    unlocks = d.get("unlocks", {})
    unlocked_by = d.get("unlockedBy", {})

    scored = []
    for t in d["ticks"]:
        c = len(unlocks.get(t["id"], []))
        p = len(unlocked_by.get(t["id"], []))
        scored.append((c + p, c, p, t))

    scored.sort(key=lambda r: (-r[0], -r[1], r[3].get("yearN") or 0))
    top = scored[:200]

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
