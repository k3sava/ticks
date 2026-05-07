# Why a corpus of breakpoints

History is usually told as a list. Dates, names, places. Battles in one column, treaties in another, inventions in a third. We learn it that way because lists are easy to print and easy to memorize. The format is older than the substance.

But history isn't a list. It's a chain.

Most things that happened, happened because something else dissolved first. Recursive language had to come before written script. Written script had to come before large states. Large states had to come before global trade. Global trade had to come before the joint-stock company. The joint-stock company had to come before the modern corporation. The modern corporation had to come before the kind of capital concentration that funded the lab where the transistor was made. The transistor had to come before the computer. The computer had to come before the network. The network had to come before this page.

Read that out loud. There are eight breakpoints in it. Each one is a moment when a constraint that had held for a long time stopped holding. After it, things that had been impossible became inevitable.

Ticks is a corpus of those moments. 2,648 of them, across 14 domains and 13 eras. Each entry names the constraint, dates the dissolution, points to two or three sources, and links to the cascade of things it made possible. About 41% carry a hand-written `because` field that names the parent ticks and walks through the mechanism.

That last part is the work. Anyone can write a list of inventions. The chain is harder. The chain says: this happened because that happened. Recursive language gave us symbolic thought. Symbolic thought gave us religion, which kept large groups of strangers cooperating long enough to invent agriculture, which produced surplus, which produced specialization, which produced writing, which produced the bureaucracies that ran the first cities. Six dominoes. Sixty thousand years.

You can quibble with any one edge in that chain. That's the point. The chain is meant to be quibbled with. It's a structured argument, not a textbook. When you find an edge that should be cut, or a tick that should be inserted, the corpus has a `suggest an edit` link on every page.

## Why now

A few reasons converge.

First, history is suddenly machine-readable. For most of the twentieth century, it took a graduate student a week to assemble what an AI agent now reads in three seconds. The bottleneck on synthesis used to be reading. The bottleneck now is the corpus. If a model has access to dates and names but not to the chain that connects them, it generates plausible adjacencies that aren't real. Structured chain-of-influence corpora, where the parent edges and child edges are typed, attributed, and dated, let a model reason about cause without hallucinating it.

Second, the open web's authority layer is collapsing into citation. Wikipedia is the substrate, but Wikipedia is also famously a list. It tells you what happened. It doesn't tell you what had to dissolve first. There's room for a layer that does. Ticks tries to be that layer. It's small enough to fit in an LLM context window. It's open enough to be ingested without permission. It's specific enough that the citations point somewhere.

Third, the cost of curation has dropped. A lone operator with a language model can now produce in six months what a research team used to take six years to assemble. The trade-off is honest: every tick is one person's reading, drafted with model assistance, audited against primary sources, and labeled with the audits that have been done so far (`AUDIT-CHAIN.md`, `AUDIT-CLAIMS.md`, `AUDIT-DEADLINKS.md`). It's not a peer-reviewed reference. It's an editorial sketch with the seams showing. That's the only kind of thing one person could ship.

## The thesis in one sentence

The chain is the value, not the list.

If you remember any single tick from this corpus, the corpus has done its job poorly. If you remember the shape of a chain, the way recursive language sits upstream of money, the way the joint-stock company sits upstream of the smartphone in your pocket, the corpus has done its job. Ticks aren't the destination. They're the steps you take to get to a destination you couldn't have reached otherwise.

## What's open

All of it. The corpus is MIT licensed. The 2,648 entries are in `data.json`, the search index is in `search-index.json`, the top 200 most-connected ticks are in `featured.json`, the schema is in `llms.txt`, the agent permissions and skills are under `.well-known/`. The site itself is a single-page app served from GitHub Pages. The source corpus and code are at https://github.com/k3sava/ticks.

If you build something with this corpus, please cite it back. Not for the credit. For the next reader, who'll want to walk a chain you found and see where it leads.

## A small example

Pick a thing in the room around you. A coffee cup, a phone, a pair of glasses, a zipper. Walk back through the constraints that had to dissolve before that thing could exist. The cup needs ceramics, the phone needs the transistor, the glasses need lens-grinding, the zipper needs precision metallurgy. Each of those needs something else. Trace the chain back far enough and every modern object lands in the same place: a small group of humans, sometime around 70,000 years ago, who started talking about things that weren't in the room.

That moment is in the corpus. So are 2,647 others.

Kesava
