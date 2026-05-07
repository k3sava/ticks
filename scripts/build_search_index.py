#!/usr/bin/env python3
"""
Build /search-index.json. A small, fast, machine-friendly subset of the
corpus that AI agents and a future client-side search can ingest cheaply.

Per tick: id, name, year, yearN, zone, domain, constraint,
parents (count), children (count), url. Dropped: detail, links.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data.json"
DST = ROOT / "search-index.json"

BASE = "https://k3sava.github.io/ticks/#/walk/"


def main():
    d = json.loads(SRC.read_text())
    unlocks = d.get("unlocks", {})
    unlocked_by = d.get("unlockedBy", {})

    items = []
    for t in d["ticks"]:
        items.append({
            "id": t["id"],
            "name": t["name"],
            "year": t["year"],
            "yearN": t.get("yearN"),
            "zone": t["zone"],
            "domain": t["domain"],
            "constraint": t["constraint"],
            "parents": len(unlocked_by.get(t["id"], [])),
            "children": len(unlocks.get(t["id"], [])),
            "url": BASE + t["id"],
        })

    out = {
        "name": "Ticks search index",
        "description": "A curated corpus of constraint-dissolving moments. One row per tick.",
        "homepage": "https://k3sava.github.io/ticks/",
        "license": "https://opensource.org/licenses/MIT",
        "version": d.get("generated", 1),
        "count": len(items),
        "items": items,
    }
    DST.write_text(json.dumps(out, ensure_ascii=False))
    print(f"+ wrote {DST.name}: {len(items)} items")


if __name__ == "__main__":
    main()
