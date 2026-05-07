# ticks

A chain of 2,648 moments in human history when a constraint dissolved. Before each moment, we couldn't. After it, things downstream became possible. Each tick names the constraint, dates the dissolution, attributes two or three sources, and links to the cascade of things that followed.

Live at **[ticks.iamkesava.com](https://ticks.iamkesava.com)**.

## What it is

A chain, not a list. Every entry has parents (what had to dissolve first) and children (what became possible afterward). The thesis: history is a graph of breakpoints. Walking the edges teaches more than memorizing the nodes. The full argument lives in [why.md](why.md).

- 14 domains: computing, biology, society, mind, physics, language, law, philosophy, religion, art, medicine, economics, war, agriculture
- 13 era buckets: Deep Prehistory, Cognitive Leap, Settled World, First Civilizations, Axial Age, Classical Empires, Post-Classical, Early Modern, Industrial Age, Electric Age, Space and Digital, Network Age, AI Era

## Five views

The site has five ways in. Each one starts with a verb.

- **walk**: read one tick at a time, year-loud. Left and right arrow keys traverse chronologically. Up jumps to ancestry.
- **map**: see all 2,648 plotted on a log-time canvas, swim-laned by domain. The acceleration becomes a thing you feel.
- **hunt**: pick something modern. Walk backward through every constraint that had to dissolve to make it possible.
- **browse**: the full list, grouped by era, with search.
- **play**: a 60-second auto-tour. Seven curated reels: acceleration, mind, body, tools, civilization, worlds, conflict.

## What a chain looks like

A small piece of the corpus, walked forward from one node:

```
recursive language (70,000 BC)              [language, mind]
        |
        +-- shamanism (30,000 BC)            [religion]
        |
        +-- cave painting (40,000 BC)        [art]
        |
        +-- sumerian writing (3,200 BC)      [language]
                |
                +-- cuneiform (3,400 BC)
                +-- phonetic script (1,500 BC)
                +-- greek alphabet (800 BC)
                        |
                        +-- printing press (1455 AD)
                                |
                                +-- newspaper, scientific journal,
                                    protestant reformation,
                                    public domain literacy, ...
```

Every edge is one tick saying "I needed that one to happen first." The chain is meant to be quibbled with. Suggest an edit on any tick page; the link is on the bottom of the walk view.

## Schema

Each tick carries:

- `id`: stable slug (used in `#/walk/{id}` URLs and citations)
- `name`: short title
- `year`: display string ("1905 AD", "32,000 BC", "1.5 million years ago")
- `yearN`: signed integer year (negative is BC)
- `zone`: one of 13 era buckets
- `domain`: one of 14 domains
- `constraint`: what was true before the tick, in plain English
- `detail`: 1 to 3 sentence editorial gloss
- `because` (~41% of ticks): hand-written causal text naming the parent ticks
- `links`: 2 to 3 source URLs
- `unlocks`, `unlockedBy`: chain edges (top-level keys in `data.json`)

## Data files

- `data.json`: full corpus (2,648 ticks, 13 zones, 14 domains, edge graph). About 3 MB.
- `search-index.json`: flat searchable subset (id, name, year, zone, domain, constraint, parent count, child count).
- `featured.json`: top 200 most-connected ticks. A curated tour, not a corpus dump.
- `llms.txt`: schema, modes, citation format, in plain English.
- `.well-known/agent-permissions.json`: use rights for AI agents.
- `.well-known/api-catalog`: RFC 9727 linkset.
- `.well-known/agent-skills/index.json`: Agent Skills Discovery v0.2 index.

## Sources

Every tick has 2 to 3 source links. Audited against Wikipedia and primary sources. Ongoing audits documented in `AUDIT-CHAIN.md`, `AUDIT-CLAIMS.md`, `AUDIT-DEADLINKS.md`, `AUDIT-DUPS.md`, `ANACHRONISMS.md`. Corrections welcome via [GitHub issues](https://github.com/k3sava/ticks/issues).

## Stack

- Vanilla HTML, CSS, JS. No framework, no build tooling for the runtime.
- Python pipeline for ingestion, expansion, dedup, link checking, OG image generation.
- GitHub Pages via GitHub Actions.

## Local dev

```
python3 -m http.server 8000
# open http://localhost:8000/
```

Build scripts under `scripts/` run the corpus pipeline. See `scripts/run_expansion_pipeline.sh` for the full chain.

## How to cite

A tick:

> Mandiga, Kesava. "Ticks · Recursive language (70,000 BC)." https://ticks.iamkesava.com/#/walk/recursive-language.

The whole corpus:

> Mandiga, Kesava. "Ticks · 2,648 moments." https://ticks.iamkesava.com/. MIT licensed. Retrieved {YYYY-MM-DD}.

When quoting a tick, prefer the tick's own source links over the editorial paraphrase. The corpus is meant to send readers somewhere, not to substitute for primary sources.

## License

MIT. Source corpus and code are open. Quote freely with attribution.

## Credits

Authored and curated by [Kesava](https://iamkesava.com). Drafted with language-model assistance and audited against Wikipedia and primary sources.

Sister sites: [apps.iamkesava.com](https://apps.iamkesava.com), [tools.iamkesava.com](https://tools.iamkesava.com), [toys.iamkesava.com](https://toys.iamkesava.com), [codex.iamkesava.com](https://codex.iamkesava.com).
