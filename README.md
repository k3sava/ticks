# ticks

2,648 moments in human history when a constraint dissolved and everything downstream became possible. Each tick names the constraint, dates the dissolution, attributes the source, and links to the cascade of things it made possible.

Live at **[ticks.iamkesava.com](https://ticks.iamkesava.com)**.

## What it is

A chain, not a list. Every entry has parents (what had to dissolve first) and children (what became possible afterward). The thesis: history is a graph of breakpoints. Walking the edges teaches more than memorizing the nodes.

- 14 domains (computing, biology, society, mind, physics, language, law, philosophy, religion, art, medicine, economics, war, agriculture)
- 13 era buckets (Deep Prehistory, Cognitive Leap, Settled World, First Civilizations, Axial Age, Classical Empires, Post-Classical, Early Modern, Industrial Age, Electric Age, Space and Digital, Network Age, AI Era)
- 7 views — list, grid, timeline, force, spiral, chain, map

## Schema

Each tick carries `id`, `name`, `year` and `yearN` (signed integer), `zone`, `domain`, `constraint`, `detail`, `links`, plus `unlocks` and `unlockedBy` chain edges (in `data.json`).

## Sources

Every tick has 2 to 3 source links. Audited against Wikipedia and primary sources. Ongoing audits documented in `AUDIT-CHAIN.md`, `AUDIT-CLAIMS.md`, `AUDIT-DEADLINKS.md`, `AUDIT-DUPS.md`, `ANACHRONISMS.md`. Corrections welcome via [GitHub issues](https://github.com/k3sava/ticks/issues).

## Stack

- Vanilla HTML, CSS, JS (no framework, no build tooling for the runtime)
- Python pipeline for ingestion, expansion, dedup, link checking, OG generation
- GitHub Pages via GitHub Actions

## Local dev

```
python3 -m http.server 8000
# open http://localhost:8000/
```

The build scripts under `scripts/` run the corpus pipeline. See `scripts/run_expansion_pipeline.sh` for the full chain.

## License

MIT. Source corpus and code are open. Cite freely with attribution.

## Credits

Authored and curated by [Kesava](https://iamkesava.com). Sister sites: [apps.iamkesava.com](https://apps.iamkesava.com), [tools.iamkesava.com](https://tools.iamkesava.com), [toys.iamkesava.com](https://toys.iamkesava.com), [codex.iamkesava.com](https://codex.iamkesava.com).
