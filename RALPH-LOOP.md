# Ticks — the Ralph Loop

*An execution discipline. Every iteration ships. Every iteration is graded by four lenses before it counts as done.*

---

## Goalpost

> An interactive learning experience of history where any entry point cascades into the next. Twice as good as **Wikipedia** (depth), **Substack** (voice), **LinkedIn** (signal density), **Medium** (typography), and **Podcasts** (intimacy) — combined. Machine-readable for AEO/GEO. Human-readable like an editorial masterpiece. Operator-attributed, anti-fabricated, plain-English, mobile-first.

Decoded as ship criteria:

| Comparator | What "twice as good" means here |
|---|---|
| **Wikipedia (depth)** | Every claim sourced; every tick links to the chain that produced it; readers leave knowing not just *what* but *what had to be true first*. |
| **Substack (voice)** | One author voice, recognizable across 2,648 entries. No corporate hedge. Plain, declarative, occasionally funny. |
| **LinkedIn (signal density)** | Zero filler. One screen = one idea. The eyebrow, the year, the constraint, the cascade. Nothing else. |
| **Medium (typography)** | Newsreader at the right size, the right line-height, the right measure. Italics earn their place. The page reads like print. |
| **Podcasts (intimacy)** | Second-person, conversational, "before this, *we couldn't*." The reader is in the room. |
| **AEO/GEO** | `llms.txt`, JSON-LD `Dataset` + `WebSite`, dynamic `<title>`/`<meta description>` per route, canonical URLs, machine-readable corpus at `/data.json`. |
| **Anti-fabricated** | Every tick has 2–3 source links, audit log committed (`AUDIT-*.md`), known anachronisms documented, no invented operators or quotes. |
| **Mobile-first** | Touch targets ≥44px, swipe parity, year never clips, copy reflows, no horizontal scroll, share works native-first. |

If a change does not move at least one of these comparators, it does not ship in this loop.

---

## Lenses (the four-judge panel)

Every iteration ends with the same four-question audit. A "no" on any lens means the iteration is **not done** — back into the loop, no excuses.

### 1. Ogilvy — *"Tell the truth, but make the truth fascinating."*
- Does the headline make a promise the body keeps?
- Could a reader explain what they just learned in one sentence?
- Is there a single weasel word, throat-clear, or marketing tic? (Strike it.)
- Does the eyebrow, headline, and first sentence work *without* the rest of the page?

### 2. Feynman — *"If you can't explain it simply, you don't understand it."*
- Read every label aloud. Would a curious 14-year-old follow?
- Replace every Latinate word with its Anglo-Saxon cousin where possible.
- Is the constraint phrased in plain English? ("communication limited to immediate reality" — yes. "pre-symbolic information transfer paradigms" — no.)
- Could you draw the page on a napkin? If not, it's too busy.

### 3. DaVinci — *"Simplicity is the ultimate sophistication."*
- For each element on screen, ask: what does removing it cost? If the answer is "nothing," remove it.
- Does the page have *one* thing it wants you to do? (Walk. Hunt. Browse.)
- Is the geometry honest? (Headline weight matches headline importance; whitespace is composed, not leftover.)
- Italic, bold, color — used like rare spices, not seasoning blends.

### 4. Jobs — *"Design is how it works."*
- Tap, swipe, keyboard, share — all four work without you reading docs?
- Does every interactive element have a focus ring, a hover state, and a touch target ≥44px?
- Does the share link, when pasted into iMessage / X / Slack, render with the right title and description?
- Does it feel inevitable? (i.e., would you be surprised if it worked any other way?)

A change is shippable only when **all four lenses say yes**.

---

## The outer loop (phases)

Each phase is a 1–2 week chunk. Phases ship independently. Order matters: don't optimize voice before fixing the year-cropping bug.

### Phase 0 — Floor (DONE in this iteration)
*Things no human curator would have shipped.*
- ✅ Deep-prehistory zone added; 12 mistaged ticks reassigned (2M-year-old hand-axes no longer "AI Era").
- ✅ 100 long BC year strings now have thousands separators ("120,000 BC", not "120000 BC").
- ✅ 17 embarrassing AI-era duplicates folded into canonicals (GPT-3 was listed 3×, AlphaFold 2 was listed 7×).
- ✅ Italic Newsreader headline year no longer clips at the top across home / walk / hunt / browse / dialog.
- ✅ `llms.txt`, `robots.txt`, `sitemap.xml`, JSON-LD (`WebSite` + `Dataset`), canonical URL, dynamic per-route `<title>` + `<meta>`.
- ✅ Native-share + copy-link with toast on every walk view.
- ✅ Stale "1,061 / 12 eras" copy now reads from `TICKS.length` and `ZONES.length`.

**Lens audit at end of Phase 0:**
- Ogilvy: headlines and footers no longer lie about the count. ✓
- Feynman: years now read as a human writes them. ✓
- DaVinci: removed 17 tiles that were noise. ✓
- Jobs: share works on iOS / Android / desktop fallback. ✓

### Phase 1 — Voice
*Make the corpus sound like one author wrote it.*
- Pass every `constraint` through a one-author voice filter. Target: 60–90 chars, lowercase, declarative, no jargon, no period at end.
- Pass every `detail` through a 1–3 sentence Feynman re-write. Cut hedge words. Cut "interestingly," "notably," "essentially."
- Standardize era-prefix style in `name`: "Gutenberg's printing press" not "the printing press of Gutenberg".
- Run a "voice diff" by sampling 50 random ticks, reading aloud, and tagging which feel off. Iterate until <3/50 feel off.

### Phase 2 — Cascade
*Make the chain feel like a chain, not a tag system.*
- Audit `unlocks` / `unlockedBy` for transitivity errors (A → B → C where A → C is also asserted but redundantly).
- Visualize the median chain length per domain. If a tick has zero parents and zero children, it is a museum piece — annotate it as such or chain it.
- On the walk view, render a **breadcrumb of 3 ancestors** above the current tick at low opacity. Reader knows where they are.
- On hunt, replace the "required ↓" arrow with the actual constraint dissolved between steps. The chain teaches.

### Phase 3 — Density (LinkedIn lens)
*One screen, one idea, but rich.*
- Walk view: redesign the right rail so "everything that flowed →" shows the *immediate* downstream (depth 1) plus a count for depth 2. Reader sees branching factor.
- Map view: add a marginalia line at the bottom showing the current selected era's defining constraint. ("First civilizations — what was true before this: no surplus to record.")
- Browse view: add an era-collapse toggle so power users can scan 13 era headers and dive in. Currently every era is open.

### Phase 4 — Typography (Medium lens)
*Make the page read like print.*
- Test Newsreader optical sizing across `12`, `18`, `48`, `120`. The current `clamp(3rem,12vw,9rem)` is good; verify on tall narrow phones (iPhone 13 mini, 375×812) and wide displays (3440px).
- Add small-caps for era labels (e.g., `font-feature-settings:"smcp"`).
- Add proper hanging quotes and en/em-dash discipline in `detail` strings. Pass every detail through a typographic linter.
- Drop-cap on the about page lede; on home eyebrow keep clean.

### Phase 5 — Intimacy (Podcast lens)
*Second person, conversational, present tense for the moment-of-tick.*
- Rewrite walk-stage `walk-before` to default to second person where the data allows: "before this, **you couldn't** address an audience without being in earshot of them."
- Add a one-sentence "what this feels like in retrospect" quip on a subset of foundational ticks. Editorial restraint: maybe 100 of 2,648.
- On home, the hero `home-thesis h1` should rotate among 3–4 hand-curated openings, picked at load. Same voice, different doors.

### Phase 6 — AEO / GEO
*Be the source models cite.*
- Per-tick canonical permalinks already work via hash routing; consider adding a `?tick={id}` fallback for crawlers that don't execute JS, redirecting client-side.
- Add a per-tick `<noscript>`-rendered HTML fallback (server-side prerender) with the year, name, constraint, detail, and source links. ChatGPT Atlas / Perplexity browse this.
- Publish a `INDEX.json` summary at `/index.json` (top 200 most-connected ticks + counts), separate from the full `data.json` corpus.
- File a `Dataset` schema entry on Google Dataset Search. Add a citation block to the about page.

### Phase 7 — Sharing as a feature, not a button
*Every link you paste should sell.*
- Generate per-tick OG images: 1200×630, year-loud (matches the walk-stage), constraint as subtitle, domain ribbon. Static PNG per tick at build time.
- Add per-tick `<meta>` hydration so a paste into iMessage / Slack / X resolves to a beautiful card without JS.
- Build a `/random` endpoint (hash route + fallback) so people can paste a "surprise me" link.

### Phase 8 — Mobile-first audit
*The phone is the canvas.*
- Test on iPhone SE (375×667), iPhone 13 mini (375×812), Pixel 7 (412×915), iPad mini (768×1024).
- Walk swipe must beat any horizontal scroll; pinch-zoom on map must beat any wheel-zoom; touch targets ≥44px universal.
- Reduce-motion respected end-to-end (already partly done).

### Phase 9 — Acceleration finale
*Ship the thing that makes people send it to a friend.*
- A finale view: a 60-second auto-play of the whole corpus, log-time, year-loud, with 5 marked "the world inverted" beats. Press space to pause. Press shift to slow. This is the share-bait.

---

## The inner loop (a single ralph cycle)

Run this every time you sit down with the repo.

```
1. Pick one item from the current Phase backlog.
2. Define the one-line ship criterion before writing code.
   "When this is done, a reader can ___ that they couldn't before."
3. Write or edit the smallest change that satisfies the criterion.
4. Local check:
     a. open index.html in a browser
     b. resize from 320px → 1920px
     c. tab through every interactive element
     d. share the current URL into iMessage; check the preview
5. Lens audit (the four-judge panel above). Any "no" → back to step 3.
6. Commit with the format:
     <surface>: <what changed> — <why it's better in one phrase>
   examples:
     ui: italic year no longer clips — Newsreader ascenders breathe
     data: 17 ai-era dups folded — corpus stops repeating itself
     aeo: dynamic per-route <title> — links show the right tab name
7. Push. Watch GitHub Pages deploy. Open the live URL. Repeat the local check.
8. If the change touched data: run scripts/find_dups.py and scripts/find_chain_breaks.py before pushing. Fix or commit knowingly.
9. Note the next item in the backlog. Stop.
```

Two rules of the inner loop:
- **One change per commit.** If you find another bug while fixing this one, write it down and finish what you started.
- **Never skip the lens audit.** The lenses are the loop; without them this is just a todo list.

---

## Backlog (always reflects what's next, never what's done)

Maintained as `## Up next` in this file. When an item ships, move it under the matching Phase as a check-marked bullet and commit.

### Up next (Phase 1 ramp)

- [ ] Voice pass: top 200 most-linked ticks. Target: declarative, ≤90 chars, second-person where natural.
- [ ] Replace the home-hero subtitle's `home-sub-2` line with one of three rotating, hand-tuned openers.
- [ ] On walk view, replace the static "before this, X." with the actual *constraint* in a serif italic that flows into the next line.
- [ ] Add a "source confidence" pill (primary / secondary / wikipedia-only) using the same color treatment as `dom`. Reader sees provenance at a glance.
- [ ] Audit every tick whose `name` starts with "the " — drop the "the".
- [ ] Re-read the about page out loud. Cut 30%.

### Parking lot (good but not now)

- [ ] Per-tick OG images (Phase 7).
- [ ] Acceleration finale (Phase 9).
- [ ] Dataset Search submission (Phase 6).
- [ ] An RSS feed of "tick of the day" pulled deterministically by date hash (a low-cost intimacy win).

---

## Definition of "shipped"

A change is shipped when:
1. It is on the `main` branch deployed via GitHub Pages.
2. It survives the four-lens audit on the live URL (not localhost).
3. The commit message would make a stranger curious to click.
4. The next item on this backlog is updated.

Anything else is in-flight.
