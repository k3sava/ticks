#!/usr/bin/env python3
"""
Audit the chain for redundant transitive edges. If A → B and B → C are
both asserted, A → C is implied; an explicit A → C edge is noise unless
the corpus wants to mark it as a *direct* causal link bypassing B.

This script produces a report (no writes) so a human can decide which
redundant edges to prune. Run from repo root.

Output: AUDIT-TRANSITIVITY.md with one section per redundant triangle,
sorted by how much pruning would compress the graph.
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data.json"
OUT = ROOT / "AUDIT-TRANSITIVITY.md"


def main():
    d = json.loads(SRC.read_text())
    unlocks = d["unlocks"]
    by_id = {t["id"]: t for t in d["ticks"]}

    # Build a forward edge set
    edges = set()
    for src, kids in unlocks.items():
        for k in kids:
            if k != src:
                edges.add((src, k))

    # For each edge A→C, see if there is a B with A→B and B→C.
    redundant = defaultdict(list)
    for a, c in edges:
        for b in unlocks.get(a, []):
            if b == a or b == c:
                continue
            if (b, c) in edges:
                redundant[(a, c)].append(b)

    if not redundant:
        OUT.write_text("# Transitivity audit\n\nNo redundant transitive edges found.\n")
        print("clean")
        return

    # Rank by number of bypass paths (more = more redundant)
    ranked = sorted(redundant.items(), key=lambda kv: -len(kv[1]))

    lines = ["# Transitivity audit",
             "",
             f"Found {len(ranked)} redundant edges (A → C where at least one A → B → C path exists).",
             "",
             "An explicit A → C edge can stay if it represents a direct causal link that "
             "bypasses the intermediate B. Otherwise it is noise; prune it.",
             ""]
    for (a, c), bs in ranked[:200]:  # cap report at 200
        ta = by_id.get(a)
        tc = by_id.get(c)
        if not ta or not tc:
            continue
        lines.append(f"## {ta['name']} → {tc['name']}")
        lines.append(f"- A: `{a}` ({ta['year']})")
        lines.append(f"- C: `{c}` ({tc['year']})")
        lines.append(f"- bypass paths via:")
        for b in bs[:5]:
            tb = by_id.get(b)
            if tb:
                lines.append(f"    - `{b}` ({tb['year']}) — {tb['name']}")
        lines.append("")

    OUT.write_text("\n".join(lines))
    print(f"wrote {OUT.name}: {len(ranked)} redundant edges")


if __name__ == "__main__":
    main()
