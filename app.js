/* ========== state ========== */
const app = document.getElementById('app');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let DATA = null;
let TICKS = [];
let UNLOCKS = {};
let UNLOCKED_BY = {};
let ZONES = [];
let DOMAINS = {};
let TICK_BY_ID = {};
let TICKS_SORTED = []; // by yearN asc

const fmtYear = (s) => String(s); // already formatted in source
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// 163 of 2,648 constraints start with "Before, …" or similar — when we prefix
// "before this, " in the renderer we'd produce "before this, before, …".
// Strip the redundant lead so the page never reads doubled.
const REDUNDANT_LEAD = /^\s*(before(\s+this)?[,:]?\s+|prior(\s+to(\s+this)?)?[,:]?\s+|previously[,:]?\s+|until(\s+this)?[,:]?\s+|earlier[,:]?\s+)/i;
function cleanConstraint(s){
  return String(s ?? '').replace(REDUNDANT_LEAD, '').replace(/\.$/, '').trim();
}

function domStyle(domain){
  return `--dc:${DOMAINS[domain] || '#888'}`;
}

/* Ambient field — sets --dc on the root so the body backdrop (the slow drift
   gradient under everything) tints with the active tick's domain color. The
   panels still get their own per-element --dc for their bloom; this lights
   the *room*, not the panel. */
function setAmbient(domain){
  const c = DOMAINS[domain];
  if (c) document.documentElement.style.setProperty('--dc', c);
  else document.documentElement.style.removeProperty('--dc');
}

/* Cursor halo — tracks the pointer once, RAF-throttled. The body::before
   radial in style.css picks up --cx and --cy and renders a warm halo that
   the glass refracts. Touch users get a centered halo (no chase). */
(function initCursorHalo(){
  if (matchMedia('(pointer:coarse)').matches) return;
  let tx = 0.5, ty = 0.5, rafId = 0;
  const onMove = (e) => {
    tx = e.clientX / window.innerWidth;
    ty = e.clientY / window.innerHeight;
    if (!rafId) rafId = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--cx', tx.toFixed(3));
      document.documentElement.style.setProperty('--cy', ty.toFixed(3));
      rafId = 0;
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
})();

/* ========== oblivion primitives (helpers) ==========
   Inline-SVG strings for the five primitives. Returned as HTML so
   they can be interpolated into innerHTML templates. Pointer-events
   are disabled in CSS; primitives never block clicks. */
function obRingsHtml({ size = 100, spin = 'cw' } = {}){
  const cls = `ob-rings ob-rings--spin-${spin}`;
  // Three nested circles at 1.4× / 2.1× / 3.2× of `size` (radius scale).
  // SVG is centered on (0,0) via CSS; circles use vector-effect non-scaling.
  const r1 = (size * 1.4) / 2, r2 = (size * 2.1) / 2, r3 = (size * 3.2) / 2;
  return `<span class='${cls}' aria-hidden='true'><svg viewBox='-${r3} -${r3} ${r3*2} ${r3*2}' xmlns='http://www.w3.org/2000/svg'>
    <circle class='ob-r1' r='${r1.toFixed(0)}'></circle>
    <circle class='ob-r2' r='${r2.toFixed(0)}'></circle>
    <circle class='ob-r3' r='${r3.toFixed(0)}'></circle>
  </svg></span>`;
}
function obBracketsHtml(){
  return `<span class='ob-brackets' aria-hidden='true'><span></span><span></span><span></span><span></span></span>`;
}
function obScanTickHtml(){
  return `<span class='ob-scan-tick' aria-hidden='true'></span>`;
}
function obTetraHtml(){
  // Hairline tetrahedron outline — 2D projection of a regular tetra:
  // outer triangle (apex top) + inner edges to a hidden back vertex
  // rendered behind the apex, giving the classic 4-vertex look.
  return `<span class='ob-tetra' aria-hidden='true'><svg viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'>
    <path d='M6 1 L11 10 L1 10 Z'/>
    <path d='M6 1 L6 8 M1 10 L6 8 M11 10 L6 8'/>
  </svg></span>`;
}

/* ========== motion primitives ==========
   - Route scan: top→bottom 1px sweep on every render() call.
   - Hover ring pulse: a single shared SVG overlay paints a ring on
     mouseenter for any [data-hover-pulse] element.
   - Focus bracket: tracks a single fixed bracket overlay around the
     currently hovered/focused [data-track-focus] element.
   - Walk slide: wrapper around renderWalk that animates the previous
     stage off and the new one in.
   All gated by `prefers-reduced-motion`. */
function fireRouteScan(){
  if (reduced) return;
  const el = document.getElementById('routeScan');
  if (!el) return;
  // Restart animation by toggling class.
  el.classList.remove('run');
  // Force reflow so the animation actually replays.
  void el.offsetWidth;
  el.classList.add('run');
}

(function initHoverRingPulse(){
  if (reduced) return;
  const overlay = document.getElementById('ringOverlay');
  if (!overlay) return;
  // Lazily resize the SVG viewBox to viewport.
  const sync = () => {
    overlay.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    overlay.style.width = window.innerWidth + 'px';
    overlay.style.height = window.innerHeight + 'px';
  };
  sync();
  window.addEventListener('resize', sync, { passive: true });

  // Delegate mouseenter via mouseover — single listener, low overhead.
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-hover-pulse], .walk-flow-card, .walk-trail-step, .hunt-step, .hunt-suggest-grid button, .home-show-flow .row, .browse-row, .map-domains button, .browse-zone-head');
    if (!target) return;
    // Don't pulse if mouse moved within the same target (mouseover bubbles).
    if (target === overlay._lastTarget) return;
    overlay._lastTarget = target;
    setTimeout(() => { if (overlay._lastTarget === target) overlay._lastTarget = null; }, 260);

    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Ring radius starts at the half-bounding-diagonal of the element.
    const radius = Math.max(r.width, r.height) / 2;

    // Re-use the same circle node — minimal DOM thrash.
    let circ = overlay._circle;
    if (!circ){
      circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      overlay.appendChild(circ);
      overlay._circle = circ;
    }
    circ.setAttribute('cx', cx.toFixed(1));
    circ.setAttribute('cy', cy.toFixed(1));
    circ.setAttribute('r', radius.toFixed(1));
    // Pull --dc from the target's computed style so the ring color matches
    // the element's domain tint.
    const dc = getComputedStyle(target).getPropertyValue('--dc') || getComputedStyle(target).getPropertyValue('--accent') || '#FFB37A';
    circ.setAttribute('stroke', dc.trim());
    circ.setAttribute('transform', `translate(${cx}, ${cy}) translate(${-cx}, ${-cy})`);
    circ.style.transformOrigin = `${cx}px ${cy}px`;
    circ.classList.remove('run');
    void circ.getBoundingClientRect();
    circ.classList.add('run');
  }, { passive: true });
})();

(function initFocusBracketTracker(){
  if (reduced) return;
  const fb = document.getElementById('focusBracket');
  if (!fb) return;
  let raf = 0;
  const place = (target) => {
    if (!target){
      fb.classList.remove('show');
      return;
    }
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { fb.classList.remove('show'); return; }
    fb.style.left = r.left + 'px';
    fb.style.top = r.top + 'px';
    fb.style.width = r.width + 'px';
    fb.style.height = r.height + 'px';
    fb.classList.add('show');
  };
  const queueFor = (el) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => place(el));
  };
  // Track focus + hover for any element marked [data-track-focus].
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-track-focus]');
    if (el) queueFor(el);
  }, { passive: true });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-track-focus]');
    if (el) queueFor(el);
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    if (!e.target.closest('[data-track-focus]')) return;
    // Hide on leave unless another track-focus element is being entered.
    const next = e.relatedTarget?.closest?.('[data-track-focus]');
    if (!next) queueFor(null);
  }, { passive: true });
  document.addEventListener('focusout', (e) => {
    if (!e.target.closest('[data-track-focus]')) return;
    const next = e.relatedTarget?.closest?.('[data-track-focus]');
    if (!next) queueFor(null);
  }, { passive: true });
  window.addEventListener('resize', () => queueFor(null), { passive: true });
  window.addEventListener('scroll', () => queueFor(null), { passive: true });
})();

/* ========== loading ========== */
function showBoot(){
  // Skeleton placeholder rendered while data.json (~3MB) streams in. Delayed
  // visually by 350ms via CSS so a fast load never flashes the loader.
  app.innerHTML = `
    <div class='boot-load' aria-busy='true' aria-live='polite'>
      <div class='boot-mark' aria-hidden='true'></div>
      <div class='boot-text'>2,648 moments are loading…</div>
      <div class='boot-hint'>about 3 MB · once</div>
    </div>
  `;
}
async function loadData(){
  showBoot();
  const r = await fetch('data.json');
  if (!r.ok) throw new Error(`data.json: ${r.status} ${r.statusText}`);
  DATA = await r.json();
  TICKS = DATA.ticks;
  UNLOCKS = DATA.unlocks;
  UNLOCKED_BY = DATA.unlockedBy;
  ZONES = DATA.zones;
  DOMAINS = DATA.domains;
  TICK_BY_ID = Object.fromEntries(TICKS.map(t => [t.id, t]));
  TICKS_SORTED = [...TICKS].sort((a,b) => (a.yearN||0)-(b.yearN||0));
  document.getElementById('ftrCount').textContent = `${TICKS.length.toLocaleString()} moments in history`;
}

/* ========== router ========== */
const routes = {
  '': home,
  '/': home,
  '/walk': () => walk(),
  '/walk/:id': (id) => walk(id),
  '/map': map,
  '/hunt': () => hunt(),
  '/hunt/:id': (id) => hunt(id),
  '/browse': browse,
  '/about': about,
  '/play': () => play(),
  '/play/:id': (reelId) => play(reelId),
};

function parseHash(){
  let h = location.hash.replace(/^#/, '');
  if (!h || h === '/') return ['', null];
  const parts = h.split('/').filter(Boolean);
  return ['/'+parts[0], parts[1] ? decodeURIComponent(parts[1]) : null];
}

// Track the previous route base so we can skip route-scan on intra-route
// navigation (walk → walk/:id) where the inner stage swap handles motion.
let _lastRouteBase = null;
function render(){
  const [base, arg] = parseHash();
  setActiveNav(base);
  // Stop any auto-play tour from a previous route.
  if (base !== '/play') stopPlay();
  const handler = routes[base + (arg ? '/:id' : '')] || routes[base] || home;
  app.className = '';
  if (base === '/walk') app.classList.add('full-bleed');
  else if (base === '/map') app.classList.add('wide');
  else if (base === '/play') app.classList.add('full-bleed');
  // Route-scan transition: fire only on actual route changes (not on
  // walk→walk/:id transitions, which are handled by the inner-stage slide).
  if (_lastRouteBase !== null && _lastRouteBase !== base){
    fireRouteScan();
  }
  _lastRouteBase = base;
  handler(arg);
  updateMeta(base, arg);
  injectArticleSchema(base, arg);
  window.scrollTo({top:0, behavior:'instant'});
  // Focus discipline: shift focus to <main> on every route change so screen
  // readers and keyboard users land in the new content, not on the same nav link.
  app.focus({preventScroll:true});
  closeMobileMenu();
  closeShareMenu();
}

/* Per-route document.title + meta description so previews and tab titles
   are accurate even on a hash-routed site. */
const SITE_TITLE = 'Ticks';
const SITE_TAGLINE = 'moments that unlocked everything next';
const HOME_OG = 'og.png';
let OG_AVAILABLE = new Set();
async function loadOgManifest(){
  try {
    const r = await fetch('og-manifest.json', { cache: 'force-cache' });
    if (r.ok){
      const j = await r.json();
      OG_AVAILABLE = new Set(j.ids || []);
    }
  } catch { /* network or 404; keep empty set, fall back to homepage og */ }
}
function setMeta(title, description, imgPath){
  document.title = title;
  const setAttr = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el && val != null) el.setAttribute(attr, val);
  };
  setAttr('meta[name="description"]', 'content', description);
  setAttr('meta[property="og:title"]', 'content', title);
  setAttr('meta[property="og:description"]', 'content', description);
  setAttr('meta[name="twitter:title"]', 'content', title);
  setAttr('meta[name="twitter:description"]', 'content', description);
  const url = location.origin + location.pathname + location.hash;
  setAttr('meta[property="og:url"]', 'content', url);
  setAttr('link[rel="canonical"]', 'href', url);
  // og:image — use per-tick where available, homepage everywhere else.
  const base = location.origin + location.pathname;
  const imgUrl = base + (imgPath || HOME_OG);
  setAttr('meta[property="og:image"]', 'content', imgUrl);
  setAttr('meta[name="twitter:image"]', 'content', imgUrl);
}
function updateMeta(base, arg){
  if (!TICKS.length) return;
  if ((base === '/walk' || base === '/hunt') && arg && TICK_BY_ID[arg]){
    const t = TICK_BY_ID[arg];
    const verb = base === '/walk' ? 'A tick' : 'How we got here';
    const img = OG_AVAILABLE.has(t.id) ? `og/${t.id}.png` : null;
    setMeta(
      `${t.name} (${t.year}) · ${SITE_TITLE}`,
      `${t.year}. ${t.name}. Before this, ${cleanConstraint(t.constraint).toLowerCase()}. ${verb} from ${SITE_TITLE}, ${SITE_TAGLINE}.`,
      img
    );
    return;
  }
  const titles = {
    '/walk':   ['Walk', 'One tick at a time. Year is loud. Click anything that flowed from it to keep walking.'],
    '/map':    ['Map', `All ${TICKS.length.toLocaleString()} ticks plotted across 13 eras. The acceleration becomes a thing you feel.`],
    '/hunt':   ['Hunt', 'Pick anything modern. Walk backward through every constraint that had to dissolve to make it possible.'],
    '/browse': ['Browse', `The full list of ${TICKS.length.toLocaleString()} ticks, grouped by era, with search.`],
    '/about':  ['About', `${SITE_TITLE} is a database of ${TICKS.length.toLocaleString()} moments when a constraint dissolved. A chain, not a list.`],
  };
  const [name, desc] = titles[base] || [null, null];
  if (name) setMeta(`${name} · ${SITE_TITLE}`, desc);
  else setMeta(`${SITE_TITLE} · ${SITE_TAGLINE}`,
    `${TICKS.length.toLocaleString()} moments in history when a constraint dissolved and everything downstream became possible. Walk the chain forward, or backward from a thing you already know.`);
}

function setActiveNav(base){
  const mode = base.replace('/','') || 'home';
  document.querySelectorAll('#nav a, #mobileMenu a').forEach(a => {
    a.classList.toggle('active', a.dataset.mode === mode || (mode==='home' && a.dataset.mode==='home'));
  });
}

window.addEventListener('hashchange', render);

/* ========== home ========== */
function home(){
  const hero = pickHero();
  setAmbient(hero.domain);
  const flow = (UNLOCKS[hero.id] || []).slice(0, 4).map(id => TICK_BY_ID[id]).filter(Boolean);
  const ancientTen = TICKS_SORTED.slice(0, 10);
  const recentSeventy = TICKS_SORTED.slice(-76);
  const ancientSpan = Math.abs(ancientTen[ancientTen.length-1].yearN - ancientTen[0].yearN);
  const recentSpan = recentSeventy[recentSeventy.length-1].yearN - recentSeventy[0].yearN;

  const opening = pickOpening();
  app.innerHTML = `
    <section class='home-hero'>
      <div class='home-thesis'>
        <div class='eyebrow'>${TICKS.length.toLocaleString()} moments that changed what comes next</div>
        <h1>${opening.h}</h1>
        <p class='home-sub'>${escapeHtml(opening.sub)}<span class='home-sub-2'>${escapeHtml(opening.sub2)}</span></p>
      </div>

      <div class='home-show'>
        <div class='home-show-tick'>
          <div class='dom' style='${domStyle(hero.domain)}'>${obTetraHtml()}${hero.domain}</div>
          <div class='yr'>${escapeHtml(hero.year)}</div>
          <div class='nm'>${escapeHtml(hero.name)}</div>
          <div class='be'>before this, ${escapeHtml(cleanConstraint(hero.constraint).toLowerCase())}.</div>
        </div>
        <div class='home-show-flow'>
          <div class='label'>everything that flowed →</div>
          ${flow.length ? flow.map(t => `
            <div class='row' onclick='location.hash="#/walk/${t.id}"' data-hover-pulse>
              <span>${escapeHtml(t.name)}</span>
              <span class='y'>${escapeHtml(t.year)}</span>
            </div>`).join('') : '<div style="color:var(--muted);font-style:italic">a single thread; click walk to follow</div>'}
        </div>
      </div>

      <div class='home-cta'>
        <div class='home-cta-buttons'>
          <a href='#/walk'>start walking →</a>
          <a class='secondary' href='#/map'>see all ${TICKS.length.toLocaleString()}</a>
          <a class='secondary' href='#/hunt'>walk backward</a>
          <a class='secondary' href='#/play'>play (60s)</a>
        </div>
        <div class='home-counter'>
          <span><strong>${ancientSpan.toLocaleString()}</strong> years for the first 10</span>
          <span><strong>${recentSpan}</strong> years for the most recent ${recentSeventy.length}</span>
        </div>
      </div>
    </section>
  `;
}

function pickHero(){
  // Prefer a foundational tick with rich downstream. Try canonical slugs first,
  // fall back to fuzzy match for slug drift.
  const candidates = ['recursive-language','collective-fiction','wheat-domestication','sumerian-writing-first-literature','gutenbergs-printing-press','transistor-bell-labs-shockley-bardeen-brattain','the-internet-tcp-ip'];
  for (const id of candidates){ const t = resolveId(id); if (t) return t; }
  // Fall back: tick with most unlocks
  let best = TICKS[0], bestN = 0;
  for (const t of TICKS){
    const n = (UNLOCKS[t.id] || []).length;
    if (n > bestN){ best = t; bestN = n; }
  }
  return best;
}

/* ========== editorial constants ========== */
// Five hand-written hero openings. Same voice, different doors.
// Picked deterministically by date so the homepage feels alive but a
// shared link on the same day shows the same opener.
// Hero is locked at a single entry per the user's instruction
// ("hero headline should be 'History, in ticks' - do not rephrase it").
const HERO_OPENINGS = [
  { h: "History, <em>in ticks</em>",
    sub: "A tick is the moment a constraint dissolved.",
    sub2: "Walk forward, or backward from a thing you already know." },
];
function pickOpening(){
  // Stable per-day so a shared morning link matches the noon link.
  const d = new Date();
  const key = d.getUTCFullYear() * 367 + (d.getUTCMonth() + 1) * 31 + d.getUTCDate();
  return HERO_OPENINGS[key % HERO_OPENINGS.length];
}

// Pull-quote seasoning: a hand-written one-liner that says what a tick
// feels like in retrospect. Italic, after the constraint, before the
// detail. Restraint: a few dozen of the foundational ticks, never a
// generated quip. Fallback: nothing renders if a tick has no note.
const EDITORIAL_NOTES = {
  'recursive-language':
    "the moment a sentence could be about a sentence. everything is downstream of that.",
  'collective-fiction':
    "money, gods, and nations are the same trick, run on different schedules.",
  'wheat-domestication':
    "we didn't tame wheat. wheat tamed us. it kept us standing in the same field.",
  'sumerian-writing-first-literature':
    "memory left the brain. the receipt outlived the merchant.",
  'printing-press-gutenberg':
    "a copy stopped being a luxury. an idea stopped needing a sponsor.",
  'gutenbergs-printing-press':
    "a copy stopped being a luxury. an idea stopped needing a sponsor.",
  'transistor':
    "thinking became something a slab of sand could do for a watt and a half.",
  'transistor-bell-labs-shockley-bardeen-brattain':
    "thinking became something a slab of sand could do for a watt and a half.",
  'the-internet-tcp-ip':
    "the network stopped caring what was on either end. that one decision is most of the next forty years.",
  'penicillin-fleming':
    "a contaminated petri dish. a medicine cabinet, on the other side of it.",
  'dna-double-helix-watson-crick-franklin':
    "biology stopped being a story and became an instruction set.",
  'general-relativity-einstein':
    "gravity stopped being a force and became geometry. space, time, and falling all became one shape.",
  'pacioli-double-entry-bookkeeping':
    "every transaction left a footprint. capitalism started counting on it.",
  'public-key-cryptography-diffie-hellman':
    "two strangers could agree on a secret without ever meeting. the internet learned to whisper.",
  'crispr-discovery-doudna-charpentier':
    "editing DNA stopped being surgery and became search-and-replace.",
  'chatgpt-rlhf-alignment':
    "the prompt became the program. the program became the conversation.",
  'athenian-democracy':
    "for a few decades, the answer to 'who decides?' stopped being 'whoever has the bigger sword.'",
  'magna-carta-rule-of-law-over-divine-right':
    "the king discovered there was something even he could not do. the rest is two centuries of footnotes.",
  'cave-painting-symbolic-art':
    "the first hard drive. forty thousand years later we're still looking at it.",
  'cuneiform-writing':
    "writing began as a spreadsheet. the poetry came later, on the same clay.",
  'epic-of-gilgamesh-first-narrative-literature':
    "the first time a story was bigger than the storyteller, because the storyteller could die and the story would not.",
  'greek-alphabet-with-vowels':
    "literacy stopped being a guild. anyone with the letters could decode anything.",
  'p-inis-sanskrit-grammar':
    "a grammar that recurses. chomsky walks in 2,400 years late and finds the room already set up.",
  'algebra-al-khwarizmi':
    "x became a thing you could write down. every equation since walks through this door.",
  'newtons-calculus-mathematics-of-change':
    "before this, change was a story. after this, change had a derivative.",
  'cell-theory-hooke-leeuwenhoek':
    "you couldn't be a unit of life until someone said the word. hooke said the word.",
  'linnaeus-binomial-nomenclature':
    "two latin words and a botanist in stockholm could talk to a botanist in brazil. taxonomy is a kind of internet.",
  'first-telephone-call-voice-transmission':
    "distance stopped silencing voices. the line carried the tone, not just the news.",
  'maxwells-equations-unified-electromagnetism':
    "light became a kind of thing, not just a kind of seeing. radio, radar, and the rest were already in the math.",
  'daltons-atomic-theory-atoms-as-real':
    "atoms moved from a philosopher's guess to a chemist's accounting. mass started balancing.",
  'galvani-bioelectricity':
    "the nerve was electric, not mechanical. the brain stopped being plumbing and became a circuit.",
  'set-theory-cantor':
    "infinity got categories. some infinities are bigger than others. nothing in mathematics is the same after.",
  'dna-sequencing-sanger-method':
    "biology became a string you could read. cost falls a million-fold and a generation later you can sequence it at home.",
  'crispr-cas9-as-genome-editing-tool-doudna-charpentier':
    "editing dna stopped being a stunt and became a method. the search-and-replace bar opened up to biology.",
  'dartmouth-workshop-ai-as-a-field':
    "they named the field over a summer. seventy years later, half the cited references trace back to the ten people in that room.",
  'xerox-parc-modern-computing-interface':
    "the entire interface you're using right now was prototyped in one building in 1973 by people who didn't get rich.",
  'world-wide-web-digital-art-and-net-art':
    "the page became a place. publishing collapsed from a building down to a tag.",
  'twitter-microblogging-and-public-real-time-discourse':
    "a 140-character constraint, accidentally a literary form. half the consequential public discourse of fifteen years happened here.",
  'youtube-video-democratized':
    "video stopped requiring a tower. anyone with a camera became a channel.",
  'price-mechanism-cantillons-essay':
    "no one is in charge of the price, and yet the price knows things no one knows. cantillon noticed first.",
  'arrow-debreu-model-general-equilibrium':
    "they proved the invisible hand exists, and in the same proof, listed every condition under which it doesn't.",
  'rawls-theory-of-justice':
    "what would you choose if you didn't know who you'd be? every political philosophy debate since starts here.",
  'nietzsche-death-of-god':
    "the diagnosis: nihilism. the prescription: rebuild values from scratch. we're still working on it.",
  'lockes-two-treatises-natural-rights':
    "consent of the governed. the american declaration is almost a paraphrase, by hand.",
  'paper-cai-lun-han-dynasty':
    "the substrate became cheap. a civilization's memory tripled in size, and then tripled again.",
  'shamanism-first-religious-specialists':
    "the first division of labor: someone whose job was to talk to what wasn't there.",
  'braille-system-standardized':
    "the page became a thing fingers could read. independent access to written knowledge for the first time.",
  'emancipation-proclamation':
    "a war about union became a war about freedom. the legal end of slavery in america started here.",
  'gravitational-waves-detected-ligo':
    "we stopped just looking at the universe. we started listening to it.",
  'quantum-mechanics-heisenberg-schr-dinger':
    "matter at the smallest scale stopped behaving like matter. all of modern technology runs on the math of this strangeness.",
  'difference-engine-babbage-concept':
    "the computer existed in someone's head a hundred years before it was buildable.",
  'turings-universal-machine':
    "before transistors existed, someone proved what they would eventually do.",
  'descartes-method-of-doubt':
    "the moment philosophy stopped being a contest of authorities and became a single person asking what they could be sure of.",
  'spontaneous-generation-disproven-redi':
    "the first time anyone bothered to put a screen over the meat. life turned out to need parents.",
  'unicode-standard-universal-character-encoding':
    "every script humans ever used, in one table. the first time computers could read everyone's writing.",
  'roman-citizenship-universal-civic-identity':
    "the idea that you could belong to a state because the state declared you do, not because you were born to it.",
  'petition-of-right-habeas-corpus-strengthened':
    "kings could no longer disappear people. produce the body, the law said.",
  'king-james-bible-english-language-theology':
    "shakespeare and the King James Bible were drafted in the same decade. modern English begins here.",
  'blitzkrieg-doctrine-poland-france':
    "the doctrine that took France in six weeks and lost the soviet union in three years. speed has limits.",
  'ico-boom-cryptocurrency-fundraising':
    "thirty billion dollars raised by white papers. mostly nothing came back.",
  'ptolemys-coordinate-system':
    "the world became locatable. every map for the next 1,800 years uses his grid.",
  'recombinant-dna-enables-genetically-modified-crops':
    "biology became a programming language. badly documented, occasionally lethal, but real.",
  'saussures-course-in-general-linguistics':
    "the founder of structural linguistics never wrote a book. his students assembled one from his lectures.",
  'alphafold-2-protein-structure-prediction':
    "fifty years of structural biology, mostly done in a weekend.",
  'vertical-farming-led-lit-indoor-agriculture':
    "lettuce growing in a warehouse under the lights of a star nursery.",
  'market-for-lemons-information-asymmetry-akerlof':
    "the paper that proved why used-car salesmen ruin everything, and won a Nobel.",
  'hollerith-tabulating-machine-us-census':
    "the 1890 US census processed in two years instead of ten. the company that made it became IBM.",
  'frederick-the-greats-oblique-order-tactical-geometry':
    "the geometry of war: hit one flank harder than your enemy can pivot.",
  'leakeys-olduvai-gorge-discoveries-human-origins-in-africa':
    "what a marriage's worth of patient digging found out — we were all African.",
  'musical-staff-notation-guido-darezzo':
    "a melody became something you could send by mail.",
  'gpt-3-175b-parameters':
    "the moment language models stopped being a toy. the bill arrived.",
  'mutation-via-x-rays-muller':
    "evolution turned out to be a thing you could speed up with a tube of fluorescent gas and a bad idea.",
  'peace-of-westphalia-sovereign-state-system':
    "the moment 'who decides who decides' got an answer that lasted three centuries.",
  'luthers-95-theses-reformation':
    "a list of complaints became a continent of wars and a different way of being christian.",
  'justinians-corpus-juris-civilis-roman-law-codified':
    "every western legal code is downstream of the books a Byzantine emperor commissioned to clean up Rome.",
  'oxford-english-dictionary-completed':
    "seventy years to write a dictionary. the longest book project still inside one publisher.",
  'rh-factor-discovery-landsteiner-wiener':
    "the discovery that explained why some healthy babies died and others didn't, half a century late.",
  'dot-com-bubble-and-crash-irrational-exuberance':
    "everything that mattered about the internet survived the crash. eyeballs as a metric did not.",
  'plessy-v-ferguson-separate-but-equal':
    "the supreme court spent 58 years explaining why segregation was lawful before quietly admitting it wasn't.",
  'wwi-chemical-weapons-chlorine-mustard-gas':
    "the moment human cleverness met the wind. neither side won an inch with it.",
};

// One sentence per era: what was true before it began. Curated, not
// generated. Each line reads like a marginalia ribbon under the map
// or a chapter title in browse.
const ERA_RULES = {
  'deep-prehistory':    "human intelligence had no record outside of bone, stone, and instinct.",
  'cognitive-leap':     "communication couldn't outrun what was in the room.",
  'settled-world':      "every calorie required a hunt or a forage.",
  'first-civilizations':"no surplus survived a season.",
  'axial-age':          "the gods were local. so was justice.",
  'classical-empires':  "law ended where the legion did.",
  'post-classical':     "the world fit on as much paper as a scribe could copy.",
  'early-modern':       "the printing press, joint stock, and ocean ship hadn't compounded yet.",
  'industrial':         "muscle and water still moved everything.",
  'electric-age':       "darkness and silence ended where the wire did.",
  'space-digital':      "computation was rare and bounded.",
  'network-age':        "publishing required a publisher.",
  'ai-era':             "thinking needed a thinker.",
};

/* ========== chain helpers ========== */
// Resolve a tick by id, falling back to a fuzzy slug match. Some editorial
// constants (hero candidates, editorial notes, hunt picks) were written before
// canonical slugs settled. This keeps the page from breaking when a slug drifts.
function resolveId(id){
  if (!id) return null;
  if (TICK_BY_ID[id]) return TICK_BY_ID[id];
  const stem = id.replace(/-+/g, '-');
  for (const t of TICKS){
    if (t.id === stem) return t;
    if (t.id.startsWith(stem + '-') || t.id.endsWith('-' + stem) || t.id.includes('-' + stem + '-')) return t;
  }
  return null;
}

// Pick up to N ancestors using the same scoring as hunt: foundational
// (high downstream count), illuminating (different domain), with a
// reasonable temporal gap (favor decades over millennia).
function pickAncestors(id, n){
  const out = [];
  const seen = new Set([id]);
  let cur = id;
  while (out.length < n){
    const t = TICK_BY_ID[cur];
    if (!t) break;
    const parents = (UNLOCKED_BY[cur] || [])
      .filter(p => !seen.has(p))
      .map(p => TICK_BY_ID[p]).filter(Boolean)
      .map(p => {
        const dt = (t.yearN ?? 0) - (p.yearN ?? 0);
        if (dt <= 0) return null;
        let score = 0;
        score += (UNLOCKS[p.id]?.length || 0) * 2;
        if (p.domain !== t.domain) score += 3;
        score += Math.min(Math.log10(Math.max(1, dt)), 4);
        return { p, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    if (!parents.length) break;
    const next = parents[0].p;
    out.unshift(next);                      // oldest first when read top-to-bottom
    seen.add(next.id);
    cur = next.id;
  }
  return out;
}
// How many additional ticks are reachable in two hops minus the depth-1 set.
function countDepth2(id){
  const d1 = new Set(UNLOCKS[id] || []);
  const d2 = new Set();
  for (const k of d1){
    for (const kk of (UNLOCKS[k] || [])){
      if (kk !== id && !d1.has(kk)) d2.add(kk);
    }
  }
  return d2.size;
}

/* ========== walk ========== */
let walkIdx = 0;
let _lastWalkIdx = -1;
function walk(id){
  if (id && TICK_BY_ID[id]) walkIdx = TICKS_SORTED.findIndex(t => t.id === id);
  if (walkIdx < 0) walkIdx = 0;
  renderWalk();
}

function renderWalk(){
  const t = TICKS_SORTED[walkIdx];
  if (!t){ app.innerHTML = '<p style="padding:48px">No tick.</p>'; return; }
  setAmbient(t.domain);
  const zone = ZONES.find(z => z.id === t.zone);
  const flow = (UNLOCKS[t.id] || []).map(id => TICK_BY_ID[id]).filter(Boolean);
  const ancestors = pickAncestors(t.id, 3);
  const flowDepth2 = countDepth2(t.id);

  app.innerHTML = `
    <section class='walk' style='${domStyle(t.domain)}'>
      <div class='walk-meta'>
        <span class='zone-name'>${escapeHtml(zone?.name || t.zone)}</span>
        <span class='pos'>${walkIdx+1} / ${TICKS_SORTED.length}</span>
        <div class='walk-progress' style='width:${((walkIdx+1)/TICKS_SORTED.length*100).toFixed(2)}%'></div>
      </div>
      <div class='walk-trail-area'>${ancestors.length ? `
      <nav class='walk-trail' aria-label='What had to dissolve before this'>
        ${ancestors.map(a => `
          <a class='walk-trail-step' href='#/walk/${a.id}' style='${domStyle(a.domain)}' data-hover-pulse>
            <span class='yr'>${escapeHtml(a.year)}</span>
            <span class='nm'>${escapeHtml(a.name)}</span>
          </a>`).join('<span class="walk-trail-link" aria-hidden="true"></span>')}
        <span class='walk-trail-link' aria-hidden="true"></span>
        <span class='walk-trail-here' aria-hidden="true"></span>
      </nav>` : `<span class='walk-trail-empty'>a starting tick · nothing recorded before</span>`}</div>
      <div class='walk-stage'>
        <div class='walk-hero'>
          <div class='dom walk-domain' style='${domStyle(t.domain)}'>${obTetraHtml()}${t.domain}</div>
          <div class='walk-year-host'>
            ${obRingsHtml({size: 80, spin: 'cw'})}
            <div class='walk-year'>${escapeHtml(t.year)}</div>
          </div>
          <div class='walk-name'>${escapeHtml(t.name)}</div>
        </div>
        <div class='walk-body'>
          <div class='walk-before'>
            <span class='label'>before this</span>
            ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.
          </div>
          ${t.because ? `<div class='walk-because' aria-label='What this came from'><span class='label'>this came from</span>${escapeHtml(t.because)}</div>` : ''}
          ${EDITORIAL_NOTES[t.id] ? `<aside class='walk-note' aria-label='Editorial note'>${escapeHtml(EDITORIAL_NOTES[t.id])}</aside>` : ''}
          ${t.detail ? `<div class='walk-detail'>${escapeHtml(t.detail)}</div>` : ''}
          ${t.links?.length ? `<div class='walk-links'>${t.links.map(l => `<a href='${escapeHtml(l.url)}' target='_blank' rel='noopener'>→ ${escapeHtml(l.label)}</a>`).join('')}</div>` : ''}
          <div class='walk-actions'>
            <button class='walk-action' data-act='share' aria-label='Share this tick'>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M11 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-6 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm6 4a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-1.5-9-3 2.4M9.5 13l-3-2.4"/></svg>
              share
            </button>
            <a class='walk-action' href='#/play/${reelForDomain(t.domain)}' aria-label='Play a 60-second reel of this thread'>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 2.5v11l10-5.5z" stroke-linejoin="round"/></svg>
              play this thread (60s)
            </a>
            <a class='walk-action' href='https://github.com/k3sava/ticks/issues/new?title=${encodeURIComponent('Edit: ' + t.name)}&body=${encodeURIComponent('Tick: ' + t.id + '\\n\\nWhat needs fixing:\\n\\nSource:')}' target='_blank' rel='noopener'>↗ suggest an edit</a>
          </div>
        </div>
      </div>

      <div class='walk-flow'>
        <div class='walk-flow-head'>${flow.length ? `everything that flowed from this (${flow.length}${flowDepth2 ? `, ${flowDepth2.toLocaleString()} more two steps out` : ''})` : 'no recorded downstream. a quiet tick.'}</div>
        ${flow.length ? `<div class='walk-flow-strip' role='list'>${flow.map(f => `
          <a class='walk-flow-card' role='listitem' href='#/walk/${f.id}' style='${domStyle(f.domain)}' data-hover-pulse data-track-focus>
            ${obBracketsHtml()}
            <span class='yr'>${escapeHtml(f.year)}</span>
            <span class='nm'>${escapeHtml(f.name)}</span>
          </a>`).join('')}</div>` : '<div class="walk-flow-empty">A frontier tick. What flows from this hasn\'t been written yet. Press → to keep walking.</div>'}
      </div>

      <div class='walk-controls'>
        <button id='wPrev' ${walkIdx===0?'disabled':''}>← previous</button>
        <div class='walk-keys'>
          <kbd>←</kbd><kbd>→</kbd><span style='margin-left:6px'>walk</span>
          <kbd style='margin-left:14px'>R</kbd><span>random</span>
          <kbd style='margin-left:14px'>↑</kbd><span>what unlocked this</span>
        </div>
        <button id='wNext' ${walkIdx===TICKS_SORTED.length-1?'disabled':''}>next →</button>
      </div>
    </section>
  `;
  document.getElementById('wPrev').onclick = () => walkStep(-1);
  document.getElementById('wNext').onclick = () => walkStep(+1);
  // Share button: opens the share menu anchored under the trigger.
  const shareBtn = app.querySelector('[data-act="share"]');
  if (shareBtn) shareBtn.onclick = (e) => { e.stopPropagation(); shareTick(t, shareBtn); };
  // Touch swipe (left/right) on the walk stage. Skips when the swipe begins
  // inside a horizontally-scrollable strip (the trail or the flow carousel)
  // so dragging cards sideways doesn't accidentally navigate to a sibling
  // tick.
  const stage = document.querySelector('.walk');
  if (stage){
    let sx = 0, sy = 0, swiping = false, intercept = false;
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
      // Don't navigate if the user grabbed an inner horizontal scroller.
      intercept = !!e.target.closest('.walk-flow-strip,.walk-trail');
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (!swiping) return;
      swiping = false;
      if (intercept) { intercept = false; return; }
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      // Horizontal swipe > 60px and clearly horizontal (not a scroll)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5){
        if (dx < 0) walkStep(+1);
        else        walkStep(-1);
      }
    }, { passive: true });
  }
  // Wheel converter on the flow strip: turn vertical mouse-wheel into
  // horizontal scroll so a non-trackpad user can pan through cards
  // without grabbing the scrollbar. Trackpad horizontal gestures already
  // work natively.
  const strip = document.querySelector('.walk-flow-strip');
  if (strip){
    strip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      strip.scrollLeft += e.deltaY;
    }, { passive: false });
  }
  // Toggle body overflow mask only when the column actually scrolls (cleaner
  // visuals on short-content ticks — no phantom fade at the bottom).
  const body = document.querySelector('.walk-body');
  if (body){
    const updateOverflow = () => {
      const overflowing = body.scrollHeight - body.clientHeight > 4;
      body.classList.toggle('is-overflowing', overflowing);
    };
    updateOverflow();
    requestAnimationFrame(updateOverflow);
    if (!window._walkBodyResize){
      window._walkBodyResize = true;
      window.addEventListener('resize', () => {
        const b = document.querySelector('.walk-body');
        if (b) b.classList.toggle('is-overflowing', b.scrollHeight - b.clientHeight > 4);
      });
    }
  }

  // Tick-to-tick slide animation.
  // If the stage was prepped with a direction, run an in-from animation;
  // otherwise this is a first paint and the existing .walk @keyframes does
  // its own fade-up. _lastWalkIdx is updated by walkStep before re-render.
  const stageEl = document.querySelector('.walk-stage');
  if (stageEl && _lastWalkIdx >= 0 && _lastWalkIdx !== walkIdx && !reduced){
    const dir = walkIdx > _lastWalkIdx ? 'in-from-right' : 'in-from-left';
    const walkRoot = document.querySelector('.walk');
    if (walkRoot) walkRoot.dataset.noAnim = '1';
    stageEl.dataset.walkAnim = dir;
    setTimeout(() => { stageEl.removeAttribute('data-walk-anim'); }, 320);
  }
  _lastWalkIdx = walkIdx;
}

/* Slide-aware step. Phase 1: animate the current stage off in the arrow's
   direction; phase 2: re-render at the new index, which animates the new
   stage in from the opposite side. Falls back to immediate render under
   prefers-reduced-motion. */
function walkStep(delta){
  const next = Math.max(0, Math.min(TICKS_SORTED.length - 1, walkIdx + delta));
  if (next === walkIdx) return;
  if (reduced){
    walkIdx = next;
    renderWalk();
    return;
  }
  const stage = document.querySelector('.walk-stage');
  if (!stage){
    walkIdx = next;
    renderWalk();
    return;
  }
  const outDir = delta > 0 ? 'out-left' : 'out-right';
  stage.dataset.walkAnim = outDir;
  setTimeout(() => {
    walkIdx = next;
    renderWalk();
  }, 220);
}

/* ========== hunt — walk backward through what unlocked X ========== */
function hunt(id){
  if (!id){
    renderHuntPicker();
    return;
  }
  const tick = TICK_BY_ID[id];
  if (!tick){ renderHuntPicker(); return; }
  setAmbient(tick.domain);
  const chain = buildAncestryChain(id, 12);
  app.innerHTML = `
    <section class='hunt'>
      <div class='hunt-head'>
        <h1>How did we get to <em>${escapeHtml(tick.name.toLowerCase())}</em>?</h1>
        <p>Walking backward through the constraints that had to dissolve first. Each step required the one above.</p>
      </div>
      ${chain.length > 1 ? `<div class='hunt-trace'>T-${chain.length} :: TRACE COMPLETE</div>` : ''}
      <div class='hunt-chain'>
        ${chain.length ? `<div class='hunt-rail' aria-hidden='true'></div>` : ''}
        ${chain.length === 0 ? '<div class="hunt-empty">No recorded ancestors. Pick another below.</div>' : chain.map((t, i) => {
          const next = chain[i+1];
          const bridge = next ? `before <em>${escapeHtml(next.name.toLowerCase())}</em>, ${escapeHtml(cleanConstraint(next.constraint).toLowerCase())}.` : '';
          const firstCls = i === 0 ? ' hunt-step--first' : '';
          return `
          <div class='hunt-step${firstCls}' style='${domStyle(t.domain)}' data-hover-pulse>
            ${i === 0 ? obBracketsHtml() : ''}
            <div class='hunt-step-yr'>${escapeHtml(t.year)}</div>
            <div class='hunt-step-body'>
              <div class='hunt-step-name' onclick='location.hash="#/walk/${t.id}"'>${escapeHtml(t.name)}</div>
              <div class='hunt-step-before'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</div>
              <div class='hunt-step-meta'><span class='dom' style='${domStyle(t.domain)}'>${obTetraHtml()}${t.domain}</span></div>
            </div>
          </div>
          ${next ? `<div class='hunt-arrow'><span class='hunt-arrow-rule'>${bridge}</span></div>` : ''}
        `;}).join('')}
      </div>
      <div class='hunt-suggest' style='margin-top:64px'>
        <div class='hunt-suggest-head'>try another</div>
        ${renderHuntSuggest()}
      </div>
    </section>
  `;
}

function buildAncestryChain(startId, maxDepth){
  const chain = [];
  const seen = new Set();
  let id = startId;
  while (id && !seen.has(id) && chain.length < maxDepth){
    const t = TICK_BY_ID[id];
    if (!t) break;
    chain.push(t);
    seen.add(id);
    const parents = (UNLOCKED_BY[id] || []).filter(p => !seen.has(p));
    if (!parents.length) break;
    // Score each candidate parent by: (a) earlier than current = better, (b) high downstream count, (c) different domain = more interesting
    const cur = t;
    const ranked = parents.map(p => TICK_BY_ID[p]).filter(Boolean).map(p => {
      let score = 0;
      // Must be earlier in time to be a real ancestor
      const dt = (cur.yearN ?? 0) - (p.yearN ?? 0);
      if (dt <= 0) return { p, score: -Infinity };
      // Prefer parents with many downstream effects (foundational)
      score += (UNLOCKS[p.id]?.length || 0) * 2;
      // Prefer parents from a different domain (illuminating cross-pollination)
      if (p.domain !== cur.domain) score += 3;
      // Prefer reasonable temporal gap (not 60k years, not 1 year)
      const dec = Math.log10(Math.max(1, dt));
      score += Math.min(dec, 4);
      return { p, score };
    }).filter(x => x.score > -Infinity).sort((a,b) => b.score - a.score);
    id = ranked[0]?.p?.id;
  }
  return chain;
}

function renderHuntPicker(){
  app.innerHTML = `
    <section class='hunt'>
      <div class='hunt-head'>
        <h1>How did we get here?</h1>
        <p>Pick something. We'll walk backward through every constraint that had to dissolve to make it possible.</p>
      </div>
      <div class='hunt-search'>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/></svg>
        <input id='huntQ' type='search' placeholder='search any tick. penicillin, the iPhone, jazz, democracy…' autocomplete='off' />
      </div>
      <div id='huntResults' style='margin-bottom:32px'></div>
      <div class='hunt-suggest'>
        <div class='hunt-suggest-head'>or try one of these</div>
        ${renderHuntSuggest()}
      </div>
    </section>
  `;
  const input = document.getElementById('huntQ');
  const results = document.getElementById('huntResults');
  input.focus();
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    if (!q){ results.innerHTML = ''; return; }
    const hits = TICKS.filter(t => t.name.toLowerCase().includes(q)).slice(0, 8);
    results.innerHTML = hits.length ? `<div class='hunt-suggest-grid'>${hits.map(t => `
      <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}' data-hover-pulse>
        <span class='nm'>${escapeHtml(t.name)}</span>
        <span class='yr'>${escapeHtml(t.year)} · ${t.domain}</span>
      </button>`).join('')}</div>` : '<div style="font-style:italic;color:var(--muted)">No matches. Try a fragment.</div>';
  };
}

function renderHuntSuggest(){
  const picks = [
    // tech / computing
    'iphone-touchscreen-computing',
    'mosaic-browser-internet-as-publishing-medium',
    'chatgpt-rlhf-alignment',
    'public-key-cryptography-diffie-hellman',
    'transistor-bell-labs-shockley-bardeen-brattain',
    // medicine / biology
    'penicillin-fleming',
    'vaccination-jenner',
    'dna-double-helix-watson-crick-franklin',
    'crispr-discovery-doudna-charpentier',
    'the-pill-oral-contraceptive',
    // physics / energy
    'steam-engine-watts-rotary-motion',
    'electric-light-edisons-grid-system',
    'general-relativity-einstein',
    // language / media
    'gutenbergs-printing-press',
    'the-jazz-singer-sound-film',
    'radio-broadcasting-of-music',
    // society / law
    'athenian-democracy',
    'magna-carta-rule-of-law-over-divine-right',
    'universal-declaration-of-human-rights',
    'declaration-of-the-rights-of-man',
    // economics
    'pacioli-double-entry-bookkeeping',
    'dutch-east-india-company-first-joint-stock-co',
    'amsterdam-stock-exchange',
    // religion / philosophy
    'christianity-universal-salvation-message',
    'buddhas-parinirvana-institutionalized-buddhism',
    // war / agriculture / art
    'gunpowder-weaponized-china-then-west',
    'haber-bosch-nitrogen-fixation',
    'brunelleschis-florence-urban-planning-as-art',
    'cave-painting-symbolic-art',
    'impressionism-painting-en-plein-air',
  ];
  const items = picks.map(id => TICK_BY_ID[id]).filter(Boolean);
  if (!items.length){
    // fallback: ticks with most ancestors (deepest chains)
    const ranked = TICKS.map(t => ({ t, depth: (UNLOCKED_BY[t.id] || []).length })).sort((a,b) => b.depth - a.depth).slice(0, 12);
    return `<div class='hunt-suggest-grid'>${ranked.map(({t}) => `
      <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}' data-hover-pulse>
        <span class='nm'>${escapeHtml(t.name)}</span>
        <span class='yr'>${escapeHtml(t.year)} · ${t.domain}</span>
      </button>`).join('')}</div>`;
  }
  return `<div class='hunt-suggest-grid'>${items.map(t => `
    <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}' data-hover-pulse>
      <span class='nm'>${escapeHtml(t.name)}</span>
      <span class='yr'>${escapeHtml(t.year)} · ${t.domain}</span>
    </button>`).join('')}</div>`;
}

/* ========== map — log-time canvas with swim lanes ========== */
const MAP_STATE = { domain: 'all' };
function map(){
  const domains = Object.keys(DOMAINS);
  app.innerHTML = `
    <section class='map-page'>
      <div class='map-head'>
        <h1>The acceleration</h1>
        <p>Every tick, plotted on a log-scale time axis. Each row is a domain. Sixty thousand years of nothing. Then everything.</p>
        <div class='map-stats'>
          <span><strong>${TICKS.length.toLocaleString()}</strong> moments</span>
          <span><strong>${domains.length}</strong> domains</span>
          <span><strong>${ZONES.length}</strong> eras</span>
        </div>
      </div>
      <div class='map-domains'>
        <button class='all ${MAP_STATE.domain==='all'?'active':''}' data-d='all'>all</button>
        ${domains.map(d => `<button class='${MAP_STATE.domain===d?'active':''}' data-d='${d}' style='${domStyle(d)}'>${d}</button>`).join('')}
      </div>
      <div class='map-canvas-wrap'>
        <div class='map-y-labels'>
          ${domains.map(d => `<div class='map-y-label' style='${domStyle(d)};color:var(--dc)'>${obTetraHtml()}${d}</div>`).join('')}
        </div>
        <div class='map-mobile-scroller' id='mapScroller'>
          <canvas class='map-canvas' id='mapCanvas'></canvas>
          <div class='map-eras' id='mapEras'></div>
          <div class='map-crosshair' id='mapCrosshair'>
            <div class='map-crosshair-h'></div>
            <div class='map-crosshair-v'></div>
          </div>
          <div class='map-tooltip' id='mapTip'>${obBracketsHtml()}<span class='map-tip-text'></span></div>
        </div>
      </div>
      <p class='map-marginalia' id='mapMarginalia' role='status' aria-live='polite'>
        <span class='map-marginalia-hint'>Hover a column. Each era named what was true before it began.</span>
      </p>
      <p class='map-help'>Click any dot to open the tick. Hover for details.</p>
    </section>
  `;
  document.querySelectorAll('.map-domains button').forEach(b => b.onclick = () => {
    MAP_STATE.domain = b.dataset.d; map();
  });
  drawMap();
  window.addEventListener('resize', drawMapOnce);
}
let _mapResizeT;
function drawMapOnce(){ clearTimeout(_mapResizeT); _mapResizeT = setTimeout(drawMap, 80); }

function drawMap(){
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const isNarrow = window.innerWidth < 720;
  // On mobile, force a usable canvas width so era columns stay readable; the
  // wrapping scroller handles overflow. Desktop fills the parent.
  const W = isNarrow ? Math.max(wrap.clientWidth, 880) : wrap.clientWidth;
  const H = isNarrow ? 480 : 520;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  // padL: room for y-labels (desktop) or 0 (mobile, labels are sticky outside)
  const padL = isNarrow ? 18 : 130;
  const padR = 24, padT = 32, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const domains = Object.keys(DOMAINS);
  const rowH = innerH / domains.length;

  // Equal-width zone bands. Bucket each tick into a coarse zone by year range
  // (data uses 20 fine-grained zone ids; the 12 ZONES are the display buckets).
  const zoneW = innerW / ZONES.length;
  const zoneOfYear = (yearN) => {
    for (let i = 0; i < ZONES.length; i++){
      const z = ZONES[i];
      if (yearN >= z.from && yearN <= z.to) return i;
    }
    return yearN < ZONES[0].from ? 0 : ZONES.length - 1;
  };
  const x = (yearN) => {
    const i = zoneOfYear(yearN);
    const z = ZONES[i];
    const span = Math.max(1, z.to - z.from);
    const t = Math.max(0, Math.min(1, (yearN - z.from) / span));
    return padL + i*zoneW + t*zoneW;
  };

  // Era backgrounds + labels
  const erasContainer = document.getElementById('mapEras');
  erasContainer.innerHTML = '';
  ZONES.forEach((z, i) => {
    const x1 = padL + i*zoneW;
    const x2 = padL + (i+1)*zoneW;
    if (i % 2 === 0){
      ctx.fillStyle = 'rgba(0,0,0,.018)';
      ctx.fillRect(x1, padT, x2-x1, innerH);
    }
    // vertical separator
    if (i > 0){
      ctx.strokeStyle = 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, padT); ctx.lineTo(x1, padT+innerH); ctx.stroke();
    }
    // era label container (HTML for crisp rotated text)
    const lbl = document.createElement('div');
    lbl.className = 'map-era-label';
    lbl.style.left = x1 + 'px';
    lbl.style.width = (x2-x1) + 'px';
    lbl.style.top = '8px';
    lbl.style.height = '20px';
    const yrFrom = z.from < 0 ? Math.abs(z.from)+' BC' : z.from+' AD';
    const yrTo = z.to < 0 ? Math.abs(z.to)+' BC' : z.to+' AD';
    lbl.innerHTML = `<span class='nm'>${z.name}</span><span class='rng'>${yrFrom} – ${yrTo}</span>`;
    erasContainer.appendChild(lbl);
  });

  // Domain row guides
  ctx.strokeStyle = 'rgba(0,0,0,.05)';
  ctx.lineWidth = 1;
  domains.forEach((d, i) => {
    const y = padT + (i+1)*rowH;
    ctx.beginPath();
    ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
  });

  // Plot dots — jitter slightly within row so density reads. When a domain is
  // selected, we render non-matches as a faint context layer FIRST (silhouette
  // of the corpus) then matching dots solid on top. Non-matches are not
  // hit-targets so taps land on the filtered set the user is actually looking
  // at — that's what "filter" means to a reader, not "dim everything but
  // still let me click any of it."
  const dots = [];
  const isFiltered = MAP_STATE.domain !== 'all';
  const matches = (t) => !isFiltered || t.domain === MAP_STATE.domain;

  // Pass 1: silhouette layer (non-matches only when filtered, else nothing).
  if (isFiltered) {
    ctx.globalAlpha = 0.06;
    TICKS.forEach(t => {
      if (t.yearN == null || matches(t)) return;
      const cx = x(t.yearN);
      const di = domains.indexOf(t.domain);
      if (di < 0) return;
      let h = 0; for (let i = 0; i < t.id.length; i++) h = (h*31 + t.id.charCodeAt(i)) | 0;
      const jitter = ((h % 1000)/1000 - 0.5) * Math.min(rowH*0.6, 18);
      const cy = padT + di*rowH + rowH/2 + jitter;
      ctx.beginPath();
      ctx.fillStyle = DOMAINS[t.domain] || '#888';
      ctx.arc(cx, cy, 2.4, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Pass 2: active set (matches). These are the only hit-targets registered.
  TICKS.forEach(t => {
    if (t.yearN == null || !matches(t)) return;
    const cx = x(t.yearN);
    const di = domains.indexOf(t.domain);
    if (di < 0) return;
    let h = 0; for (let i = 0; i < t.id.length; i++) h = (h*31 + t.id.charCodeAt(i)) | 0;
    const jitter = ((h % 1000)/1000 - 0.5) * Math.min(rowH*0.6, 18);
    const cy = padT + di*rowH + rowH/2 + jitter;
    const c = DOMAINS[t.domain] || '#888';
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.82;
    const radius = (UNLOCKS[t.id]?.length || 0) > 4 ? 4 : 2.8;
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fill();
    dots.push({x:cx, y:cy, r:radius+4, t});
  });
  ctx.globalAlpha = 1;

  // Hover + click
  const tip = document.getElementById('mapTip');
  const marginalia = document.getElementById('mapMarginalia');
  let last = null;
  let lastZoneIdx = -1;
  const setMarginalia = (i) => {
    if (i === lastZoneIdx) return;
    lastZoneIdx = i;
    if (i < 0 || !marginalia) return;
    const z = ZONES[i];
    if (!z) return;
    const rule = ERA_RULES[z.id];
    const yrFrom = z.from < 0 ? Math.abs(z.from).toLocaleString()+' BC' : z.from+' AD';
    const yrTo = z.to < 0 ? Math.abs(z.to).toLocaleString()+' BC' : z.to+' AD';
    marginalia.innerHTML = rule
      ? `<span class='map-marginalia-era'>${escapeHtml(z.name)}</span><span class='map-marginalia-rng'>${yrFrom} – ${yrTo}</span><span class='map-marginalia-rule'>before this, ${escapeHtml(rule)}</span>`
      : `<span class='map-marginalia-era'>${escapeHtml(z.name)}</span><span class='map-marginalia-rng'>${yrFrom} – ${yrTo}</span>`;
  };
  const crosshair = document.getElementById('mapCrosshair');
  const tipText = tip.querySelector('.map-tip-text') || tip;
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hit = null;
    for (let i = dots.length-1; i >= 0; i--){
      const d = dots[i];
      if (Math.hypot(d.x-mx, d.y-my) <= d.r){ hit = d; break; }
    }
    // Marginalia: figure out which era column the cursor is over.
    if (mx >= padL && mx <= W - padR){
      const zi = Math.min(ZONES.length - 1, Math.max(0, Math.floor((mx - padL) / zoneW)));
      setMarginalia(zi);
    }
    if (hit){
      tip.classList.add('show');
      tipText.textContent = `${hit.t.year} · ${hit.t.name}`;
      tip.style.left = (mx+12) + 'px';
      tip.style.top = (my+12) + 'px';
      canvas.style.cursor = 'pointer';
      last = hit;
      // Crosshair guides — extend from dot to canvas edges in domain color.
      if (crosshair){
        crosshair.classList.add('show');
        const dc = DOMAINS[hit.t.domain] || '#888';
        crosshair.style.setProperty('--dc', dc);
        crosshair.querySelector('.map-crosshair-h').style.top = hit.y + 'px';
        crosshair.querySelector('.map-crosshair-v').style.left = hit.x + 'px';
      }
    } else {
      tip.classList.remove('show');
      crosshair?.classList.remove('show');
      canvas.style.cursor = 'default';
      last = null;
    }
  };
  canvas.onmouseleave = () => { tip.classList.remove('show'); crosshair?.classList.remove('show'); last = null; };
  // Hit-finder shared by mouse + touch. Slightly larger radius on touch.
  const hitAt = (mx, my, slop = 1) => {
    for (let i = dots.length-1; i >= 0; i--){
      const dt = dots[i];
      if (Math.hypot(dt.x-mx, dt.y-my) <= dt.r * slop) return dt;
    }
    return null;
  };
  // Distinguish mouse vs touch so we don't double-fire (touch synthesizes a
  // click after touchend; we'd open twice if we listened to both naively).
  let _touchOpenedAt = 0;
  // Click ripple — emits two expanding hairline rings in the dot's domain
  // color, then routes to /walk/<id>. Ripple lives 260ms before route swap.
  const emitRipple = (x, y, dc) => {
    if (reduced) return;
    const scroller = document.getElementById('mapScroller');
    if (!scroller) return;
    const r1 = document.createElement('div');
    r1.className = 'map-ripple';
    r1.style.left = x + 'px';
    r1.style.top = y + 'px';
    r1.style.borderColor = dc;
    scroller.appendChild(r1);
    const r2 = r1.cloneNode();
    r2.classList.add('map-ripple--late');
    scroller.appendChild(r2);
    setTimeout(() => { r1.remove(); r2.remove(); }, 360);
  };
  canvas.onclick = (e) => {
    if (Date.now() - _touchOpenedAt < 600) return; // touch already handled
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hit = last || hitAt(mx, my, 1.6);
    if (!hit) return;
    emitRipple(hit.x, hit.y, DOMAINS[hit.t.domain] || '#888');
    setTimeout(() => { location.hash = '#/walk/' + hit.t.id; }, reduced ? 0 : 180);
  };
  // Touch: single tap opens the tick directly. No double-tap-to-confirm
  // gauntlet on mobile — tooltips don't help on a small screen and most users
  // won't do the second tap. The slight finger-error margin is handled by
  // 1.6× hit radius.
  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const t0 = e.changedTouches[0];
    const mx = t0.clientX - rect.left, my = t0.clientY - rect.top;
    const hit = hitAt(mx, my, 2.0);
    if (!hit) return;
    e.preventDefault();
    _touchOpenedAt = Date.now();
    location.hash = '#/walk/' + hit.t.id;
  }, {passive: false});
  // Keyboard navigation: Tab to focus canvas, arrow keys cycle through dots, Enter opens
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Tick map. Press Tab to focus, arrow keys to navigate dots, Enter to open.');
  let kbdIdx = -1;
  const drawHighlight = (i) => {
    drawMap();
    if (i < 0 || i >= dots.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    const d = dots[i];
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#C2410C';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI*2); ctx.stroke();
    tip.classList.add('show');
    tip.textContent = `${d.t.year} · ${d.t.name}`;
    tip.style.left = (d.x + 12) + 'px';
    tip.style.top = (d.y + 12) + 'px';
    ctx.restore();
  };
  canvas.onkeydown = (e) => {
    if (!dots.length) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){
      kbdIdx = (kbdIdx + 1) % dots.length; drawHighlight(kbdIdx); e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
      kbdIdx = (kbdIdx - 1 + dots.length) % dots.length; drawHighlight(kbdIdx); e.preventDefault();
    } else if (e.key === 'Enter' && kbdIdx >= 0){
      location.hash = '#/walk/' + dots[kbdIdx].t.id; e.preventDefault();
    }
  };
}

/* ========== browse ========== */
const BROWSE_STATE = { q: '', collapsed: new Set() };
function browse(){
  const q = BROWSE_STATE.q.toLowerCase();
  const filtered = q ? TICKS.filter(t => t.name.toLowerCase().includes(q) || t.constraint.toLowerCase().includes(q) || (t.detail||'').toLowerCase().includes(q)) : TICKS;
  const byZone = {};
  filtered.forEach(t => { (byZone[t.zone] = byZone[t.zone] || []).push(t); });
  ZONES.forEach(z => { if (byZone[z.id]) byZone[z.id].sort((a,b) => (a.yearN||0)-(b.yearN||0)); });

  // While searching, force-expand all eras so hits are visible.
  const allCollapsed = !q && BROWSE_STATE.collapsed.size === ZONES.filter(z => byZone[z.id]).length;
  app.innerHTML = `
    <section class='browse-page'>
      <div class='browse-head'>
        <h1>Browse all ${TICKS.length.toLocaleString()}</h1>
        <p>Grouped by era. Click any tick to open it. Search to narrow.</p>
      </div>
      <div class='browse-toolbar'>
        <div class='browse-search'>
          ${obBracketsHtml()}
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/></svg>
          <input id='brQ' type='search' value='${escapeHtml(BROWSE_STATE.q)}' placeholder='search ticks…' />
        </div>
        <div class='browse-meta'>
          <span>${filtered.length.toLocaleString()} of ${TICKS.length.toLocaleString()}</span>
          <button class='browse-toggle' id='brToggle' type='button'>${allCollapsed ? 'expand all' : 'collapse all'}</button>
        </div>
      </div>
      ${filtered.length === 0 ? `
        <div class='browse-empty'>
          Nothing matches <strong>${escapeHtml(BROWSE_STATE.q)}</strong>.<br/>
          Try a fragment ("steam" instead of "steam engine"), a domain ("biology"), or hop over to <a href='#/hunt' style='color:var(--accent);border-bottom:1px solid var(--accent)'>hunt</a>.
        </div>` : ''}
      ${ZONES.map(z => {
        const items = byZone[z.id];
        if (!items?.length) return '';
        const range = z.from < 0 ? `${Math.abs(z.from).toLocaleString()} BC` : `${z.from} AD`;
        const rangeTo = z.to < 0 ? `${Math.abs(z.to).toLocaleString()} BC` : `${z.to} AD`;
        const collapsed = !q && BROWSE_STATE.collapsed.has(z.id);
        const rule = ERA_RULES[z.id] || '';
        return `
          <section class='browse-zone${collapsed ? ' is-collapsed' : ''}' data-zone='${z.id}'>
            <header class='browse-zone-head' role='button' tabindex='0' aria-expanded='${!collapsed}' data-hover-pulse>
              <span class='browse-chev' aria-hidden='true'>${collapsed ? '▸' : '▾'}</span>
              ${obScanTickHtml()}
              <h2>${escapeHtml(z.name)}</h2>
              <span class='range'>${range} → ${rangeTo}</span>
              ${rule ? `<span class='rule'>before this, ${escapeHtml(rule)}</span>` : ''}
              <span class='ct'><span class='ct-num'>${items.length}</span><span class='ct-zid'> :: T-ZONE-${escapeHtml(z.id.toUpperCase())}</span></span>
            </header>
            <div class='browse-zone-body'>
              ${items.map(t => `
                <a class='browse-row' href='#/walk/${t.id}' style='${domStyle(t.domain)}' data-hover-pulse>
                  <span class='yr'>${escapeHtml(t.year)}</span>
                  <div class='body'>
                    <span class='nm'>${escapeHtml(t.name)}</span>
                    <span class='be'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</span>
                  </div>
                  <span class='dom' style='${domStyle(t.domain)}'>${obTetraHtml()}${t.domain}</span>
                </a>`).join('')}
            </div>
          </section>`;
      }).join('')}
    </section>
  `;
  const qEl = document.getElementById('brQ');
  qEl.addEventListener('input', (e) => { BROWSE_STATE.q = e.target.value; clearTimeout(window._brT); window._brT = setTimeout(browse, 120); });
  // Era headers: click or Enter/Space to collapse/expand
  app.querySelectorAll('.browse-zone-head').forEach(h => {
    const z = h.parentElement.dataset.zone;
    const flip = () => {
      if (BROWSE_STATE.q) return; // no collapsing while searching
      if (BROWSE_STATE.collapsed.has(z)) BROWSE_STATE.collapsed.delete(z);
      else BROWSE_STATE.collapsed.add(z);
      browse();
    };
    h.addEventListener('click', flip);
    h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } });
  });
  document.getElementById('brToggle').onclick = () => {
    if (BROWSE_STATE.q) return;
    if (allCollapsed) BROWSE_STATE.collapsed.clear();
    else ZONES.forEach(z => BROWSE_STATE.collapsed.add(z.id));
    browse();
  };
}

/* ========== play (acceleration reels) ==========
   Seven curated reels through the corpus. Each is a 60-second auto-tour with
   year-loud single-tick frames and "world inverted" beats that hold an extra
   moment. Reels are randomized when /play has no arg; if the user arrives
   from a walk, the route hands /play/:reelForDomain so the reel matches the
   thread they were already on. Mid-play, chevrons cycle to the next reel. */
const PLAY_BEATS = new Set([
  'recursive-language',
  'wheat-domestication',
  'sumerian-writing-first-literature',
  'gutenbergs-printing-press',
  'transistor-bell-labs-shockley-bardeen-brattain',
  'transistor-invention',
  'chatgpt-rlhf-alignment',
  'first-cities',
  'agricultural-revolution',
  'germ-theory-of-disease',
  'penicillin-fleming',
  'newton-principia',
  'einsteins-special-relativity',
  'arpanet-first-message',
  'world-wide-web-berners-lee',
  'iphone-touchscreen-computing',
]);

/* Reel taxonomy. domains:null means "all"; cap drives the playlist length.
   Each reel scores ticks within its domain set by parents+children, picks the
   top N, then sorts ascending by year. Order in the array is the cycle order
   used by the chevrons + the keyboard shortcut. */
const REELS = [
  { id: 'acceleration', name: 'the acceleration',      tagline: 'From the hand-axe to ChatGPT — every step in between.',     domains: null,                                                cap: 180 },
  { id: 'mind',         name: 'the recursive mind',    tagline: 'Once a sentence could be about a sentence, everything followed.', domains: ['language','mind','philosophy'],            cap: 38 },
  { id: 'body',         name: 'we stopped dying',      tagline: 'What it took for a baby to reach school.',                  domains: ['biology','medicine'],                              cap: 38 },
  { id: 'tools',        name: 'tools of the gods',     tagline: 'What we held in our hands decided what we thought next.',   domains: ['physics','computing'],                             cap: 42 },
  { id: 'civilization', name: 'the long settle',       tagline: 'Wheat made cities possible. Cities made laws necessary.',   domains: ['agriculture','society','economics','law'],         cap: 42 },
  { id: 'worlds',       name: 'the stories that stuck', tagline: 'The medium changed every century. The story didn\'t.',      domains: ['art','religion'],                                  cap: 32 },
  { id: 'conflict',     name: 'force and counter-force', tagline: 'What changed between the spear and the H-bomb.',          domains: ['war','law','economics'],                           cap: 30 },
];

/* Maps a tick's domain to the reel that best fits it. Lets a walk on a
   transistor tick suggest "tools of the gods" for the 60s reel, etc. */
const DOMAIN_TO_REEL = {
  language: 'mind', mind: 'mind', philosophy: 'mind',
  biology: 'body', medicine: 'body',
  physics: 'tools', computing: 'tools',
  agriculture: 'civilization', society: 'civilization', economics: 'civilization', law: 'civilization',
  art: 'worlds', religion: 'worlds',
  war: 'conflict',
};
function reelForDomain(domain){ return DOMAIN_TO_REEL[domain] || 'acceleration'; }
function pickRandomReel(){
  // Default to "acceleration" 30% of the time; otherwise random themed reel
  // so a fresh visitor gets the everything-everywhere reel often, but repeat
  // visitors are surprised.
  if (Math.random() < 0.3) return 'acceleration';
  const themed = REELS.filter(r => r.id !== 'acceleration');
  return themed[Math.floor(Math.random() * themed.length)].id;
}
function getReel(reelId){
  return REELS.find(r => r.id === reelId) || REELS[0];
}
/* Hand-picked reel curations override the algorithmic top-N. Each curation
   is an ordered list of tick IDs chosen for narrative arc (start → middle
   → end with clear inflection), beat moments every 6-8 ticks, and minimal
   same-domain repeats. If a curation is missing or empty, we fall back to
   the algorithmic top-N so a partial curation doesn't break a reel. */
const REEL_CURATIONS = {
  acceleration: [
    'recursive-language',
    'collective-fiction',
    'cave-painting-symbolic-art',
    'wheat-domestication',
    'animal-domestication',
    'pottery-fired-clay',
    'plow-invention-ard',
    'cuneiform-writing',
    'mesopotamian-clay-tablet-record-keeping',
    'babylonian-quadratic-equations',
    'greek-alphabet-with-vowels',
    'athenian-democracy',
    'p-inis-sanskrit-grammar',
    'roman-citizenship-universal-civic-identity',
    'paper-cai-lun-han-dynasty',
    'ptolemys-coordinate-system',
    'justinians-corpus-juris-civilis-roman-law-codified',
    'algebra-al-khwarizmi',
    'diamond-sutra-first-dated-printed-book',
    'magna-carta-rule-of-law-over-divine-right',
    'gutenbergs-printing-press',
    'pacioli-double-entry-bookkeeping',
    'luthers-95-theses-reformation',
    'descartes-method-of-doubt',
    'newtons-calculus-mathematics-of-change',
    'lockes-two-treatises-natural-rights',
    'daltons-atomic-theory-atoms-as-real',
    'emancipation-proclamation',
    'maxwells-equations-unified-electromagnetism',
    'first-telephone-call-voice-transmission',
    'general-relativity-einstein',
    'penicillin-fleming',
    'transistor-bell-labs-shockley-bardeen-brattain',
    'dna-double-helix-watson-crick-franklin',
    'dartmouth-workshop-ai-as-a-field',
    'xerox-parc-modern-computing-interface',
    'public-key-cryptography-diffie-hellman',
    'world-wide-web-berners-lee',
    'crispr-cas9-as-genome-editing-tool-doudna-charpentier',
    'alphafold-2-protein-structure-prediction',
    'chatgpt-rlhf-alignment',
  ],
  mind: [
    'recursive-language',
    'collective-fiction',
    'cuneiform-writing',
    'sumerian-writing-first-literature',
    'epic-of-gilgamesh-first-narrative-literature',
    'greek-alphabet-with-vowels',
    'p-inis-sanskrit-grammar',
    'algebra-al-khwarizmi',
    'descartes-method-of-doubt',
    'lockes-two-treatises-natural-rights',
    'newtons-calculus-mathematics-of-change',
    'hume-bundle-theory-of-the-self',
    'rawls-theory-of-justice',
    'nietzsche-death-of-god',
    'set-theory-cantor',
    'turings-universal-machine',
    'saussures-course-in-general-linguistics',
    'putnams-twin-earth-thought-experiment',
    'dartmouth-workshop-ai-as-a-field',
    'unicode-standard-universal-character-encoding',
    'oxford-english-dictionary-completed',
    'gpt-3-175b-parameters',
    'attention-is-all-you-need-transformer-paper',
    'chatgpt-rlhf-alignment',
  ],
  tools: [
    'cave-painting-symbolic-art',
    'pottery-fired-clay',
    'plow-invention-ard',
    'galvani-bioelectricity',
    'newtons-calculus-mathematics-of-change',
    'daltons-atomic-theory-atoms-as-real',
    'maxwells-equations-unified-electromagnetism',
    'first-telephone-call-voice-transmission',
    'phonograph-edison',
    'general-relativity-einstein',
    'quantum-mechanics-heisenberg-schr-dinger',
    'nuclear-magnetic-resonance-discovered',
    'turings-universal-machine',
    'transistor-bell-labs-shockley-bardeen-brattain',
    'difference-engine-babbage-concept',
    'hollerith-tabulating-machine-us-census',
    'dartmouth-workshop-ai-as-a-field',
    'xerox-parc-modern-computing-interface',
    'public-key-cryptography-diffie-hellman',
    'rsa-encryption-1977',
    'world-wide-web-berners-lee',
    'attention-is-all-you-need-transformer-paper',
    'gpt-3-175b-parameters',
    'alphafold-2-protein-structure-prediction',
    'chatgpt-rlhf-alignment',
  ],
};

function buildReelPlaylist(reelId){
  const reel = getReel(reelId);
  // Hand-curated path — each curation is an ordered ID list. Filter for
  // ticks that actually exist (so a stale ID doesn't crash the reel).
  const curation = REEL_CURATIONS[reelId];
  if (curation && curation.length){
    const picked = curation.map(id => TICK_BY_ID[id]).filter(Boolean);
    if (picked.length >= 8) return picked;  // require minimum length for safety
  }
  const pool = reel.domains
    ? TICKS.filter(t => reel.domains.includes(t.domain))
    : TICKS;
  // Algorithmic fallback: prefer featured.json for acceleration if loaded.
  if (!reel.domains){
    const features = (window.__features || []).map(id => TICK_BY_ID[id]).filter(Boolean);
    if (features.length) return [...features].sort((a, b) => (a.yearN || 0) - (b.yearN || 0));
  }
  const scored = pool.map(t => ({
    t,
    score: (UNLOCKS[t.id]?.length || 0) * 2 + (UNLOCKED_BY[t.id]?.length || 0),
  })).sort((a, b) => b.score - a.score).slice(0, reel.cap);
  return scored.map(s => s.t).sort((a, b) => (a.yearN || 0) - (b.yearN || 0));
}

let _playTimer = null;
let _playState = null;

function play(reelId){
  // No reelId → land on the picker. The picker shows seven glass panes —
  // one per curated reel — plus a "surprise me" affordance that picks one
  // at random. /play/:reelId starts that specific reel directly. The walk
  // CTA "play this thread" pre-bakes the domain-matched reelId so the
  // reader who clicks it lands inside the reel, not on the picker.
  if (!reelId) return renderPlayPicker();
  if (reelId === 'random'){
    const r = pickRandomReel();
    history.replaceState(null, '', `#/play/${r}`);
    return play(r);
  }
  const reel = getReel(reelId);
  if (reel.id !== reelId) return renderPlayPicker();
  const id = reelId;
  const list = buildReelPlaylist(id);

  app.innerHTML = `
    <section class='play' aria-label='Acceleration reel'>
      <div class='play-meta'>
        <div class='play-reel-meta'>
          <button class='play-reel-chev' id='playPrevReel' type='button' aria-label='Previous reel'>‹</button>
          <div class='play-reel-name-block'>
            <div class='play-reel-name' id='playReelName'>${escapeHtml(reel.name)}</div>
            <div class='play-reel-tagline' id='playReelTagline'>${escapeHtml(reel.tagline)}</div>
          </div>
          <button class='play-reel-chev' id='playNextReel' type='button' aria-label='Next reel'>›</button>
        </div>
        <span class='play-counter' id='playCount'>1 / ${list.length}</span>
      </div>
      <div class='play-stage' id='playStage'></div>
      <div class='play-progress' aria-hidden='true'><div class='play-progress-fill' id='playFill'></div></div>
      <div class='play-controls'>
        <button id='playToggle' type='button'>pause</button>
        <span class='play-help'>space pauses · ‹ › swap reel · esc exits</span>
        <a class='play-exit' href='#/'>exit</a>
      </div>
    </section>
  `;

  _playState = { reelId: id, list, idx: 0, paused: false, baseDelay: 333, beatDelay: 1500 };
  // Set ambient using the FIRST tick's domain so the room lights up before
  // the first frame renders. setAmbient is then called per-frame in render.
  if (list[0]) setAmbient(list[0].domain);
  renderPlayFrame();
  schedulePlay();

  document.getElementById('playToggle').onclick = togglePlay;
  document.getElementById('playPrevReel').onclick = () => switchReel(-1);
  document.getElementById('playNextReel').onclick = () => switchReel(1);
}

function switchReel(dir){
  const s = _playState;
  if (!s) return;
  const i = REELS.findIndex(r => r.id === s.reelId);
  const next = REELS[(i + dir + REELS.length) % REELS.length];
  // Update the URL without re-running the route handler — play() already
  // does a full rebuild and that would re-trigger the route.
  history.replaceState(null, '', `#/play/${next.id}`);
  play(next.id);
}

/* The picker — seven curated reels as glass panes. Lands at /play with no
   reelId. Each card is its own glass surface tinted by a representative
   domain color, and links into /play/:reelId to start the reel. */
function renderPlayPicker(){
  // Pick a representative tick from each reel so the panel can borrow that
  // domain's color via --dc. For "acceleration" use the broadest signal.
  const reelDc = {
    acceleration: '#FB923C',
    mind: DOMAINS.mind || '#A78BFA',
    body: DOMAINS.medicine || '#10B981',
    tools: DOMAINS.computing || '#60A5FA',
    civilization: DOMAINS.agriculture || '#F59E0B',
    worlds: DOMAINS.art || '#EC4899',
    conflict: DOMAINS.war || '#EF4444',
  };
  setAmbient(null);
  app.innerHTML = `
    <section class='play-picker' aria-label='Pick a reel'>
      <header class='play-picker-head'>
        <h1>Pick a thread</h1>
        <p>Each reel is a curated 60-second walk through one strand of the corpus, year by year. Or <a href='#/play/random' class='play-picker-random'>surprise me</a>.</p>
      </header>
      <div class='play-picker-grid'>
        ${REELS.map(r => {
          const count = buildReelPlaylist(r.id).length;
          return `
          <a class='play-picker-card' href='#/play/${r.id}' style='--dc:${reelDc[r.id] || '#FB923C'}'>
            <div class='play-picker-card-inner'>
              <div class='play-picker-name'>${escapeHtml(r.name)}</div>
              <div class='play-picker-tagline'>${escapeHtml(r.tagline)}</div>
              <div class='play-picker-meta'>
                <span class='play-picker-count'>${count} ticks</span>
                <span class='play-picker-sep'>·</span>
                <span class='play-picker-time'>~60 seconds</span>
              </div>
            </div>
            <div class='play-picker-go' aria-hidden='true'>play →</div>
          </a>`;
        }).join('')}
      </div>
    </section>
  `;
}

function renderPlayFrame(){
  const s = _playState;
  if (!s) return;
  const t = s.list[s.idx];
  if (!t) return;
  setAmbient(t.domain);
  const stage = document.getElementById('playStage');
  if (!stage) return;
  const isBeat = PLAY_BEATS.has(t.id);
  // Stage scan sweep — left-to-right hairline that runs ahead of each new
  // frame. Lives in stage so it inherits --dc (domain color) from the
  // section. CSS animation; we just toggle the run class.
  let scan = stage.querySelector('.play-stage-scan');
  if (!scan){
    scan = document.createElement('div');
    scan.className = 'play-stage-scan';
    stage.appendChild(scan);
  }
  if (!reduced){
    scan.classList.remove('run');
    void scan.offsetWidth;
    scan.classList.add('run');
  }
  // Build the frame template with year-glyph rings host. On beats, also
  // include a pulse ring + bracket flash overlay.
  const frame = document.createElement('div');
  frame.className = 'play-frame' + (isBeat ? ' is-beat' : '');
  frame.style.cssText = domStyle(t.domain);
  frame.innerHTML = `
    <div class='play-dom dom' style='${domStyle(t.domain)}'>${obTetraHtml()}${t.domain}</div>
    <div class='play-year-host'>
      ${obRingsHtml({size: 70, spin: 'ccw'})}
      ${obBracketsHtml().replace("class='ob-brackets'", "class='ob-brackets flash'")}
      <span class='play-year'>${escapeHtml(t.year)}</span>
      ${isBeat ? '<span class="play-pulse-ring"></span>' : ''}
    </div>
    <div class='play-name'>${escapeHtml(t.name)}</div>
    <div class='play-constraint'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</div>
    ${isBeat ? '<div class="play-beat-mark">the world inverted here</div>' : ''}
  `;
  // Replace the old frame (preserve the .play-stage-scan element).
  const oldFrame = stage.querySelector('.play-frame');
  if (oldFrame) oldFrame.remove();
  stage.appendChild(frame);

  const count = document.getElementById('playCount');
  if (count) count.textContent = `${s.idx + 1} / ${s.list.length}`;
  const fill = document.getElementById('playFill');
  if (fill) fill.style.width = `${((s.idx + 1) / s.list.length) * 100}%`;
}

function schedulePlay(){
  clearTimeout(_playTimer);
  const s = _playState;
  if (!s || s.paused) return;
  const t = s.list[s.idx];
  const delay = (t && PLAY_BEATS.has(t.id)) ? s.beatDelay : s.baseDelay;
  _playTimer = setTimeout(() => {
    s.idx++;
    if (s.idx >= s.list.length){
      s.paused = true;
      const btn = document.getElementById('playToggle');
      if (btn) btn.textContent = 'replay';
      btn.onclick = () => { s.idx = 0; s.paused = false; btn.textContent = 'pause'; btn.onclick = togglePlay; renderPlayFrame(); schedulePlay(); };
      return;
    }
    renderPlayFrame();
    schedulePlay();
  }, delay);
}

function togglePlay(){
  const s = _playState;
  if (!s) return;
  s.paused = !s.paused;
  const btn = document.getElementById('playToggle');
  if (btn) btn.textContent = s.paused ? 'play' : 'pause';
  if (!s.paused) schedulePlay();
  else clearTimeout(_playTimer);
}

function stopPlay(){
  clearTimeout(_playTimer);
  _playTimer = null;
  _playState = null;
}

/* ========== about ========== */
function about(){
  app.innerHTML = `
    <article class='about'>
      <h1>About ticks</h1>
      <p class='lede'>A tick is the moment a constraint dissolved. Before it, we couldn't. After it, the things downstream became possible.</p>
      <p>This site is a corpus of ${TICKS.length.toLocaleString()} such moments across 14 domains of human history. Small enough to walk through in an afternoon. Dense enough to surprise you for years.</p>
      <p>The thesis is simple. <em>History is a chain of breakpoints.</em> A constraint dissolves (recursive language, written script, the joint-stock company, the transistor) and a flood of new things become possible that simply weren't before. Every tick is one of those breakpoints, named in plain English, dated, attributed, and linked to what flowed from it.</p>
      <p>The longer version of the argument lives in <a href='why.md' target='_blank' rel='noopener' style='color:var(--accent);border-bottom:1px solid var(--accent)'>why.md</a>: why a corpus of breakpoints, why now.</p>
      <h2>Five ways in</h2>
      <div class='modes'>
        <a class='mode-tile' href='#/walk'><h3>walk →</h3><p>One tick at a time. Year is loud. Click anything that flowed from it to keep walking.</p></a>
        <a class='mode-tile' href='#/map'><h3>map →</h3><p>All ${TICKS.length.toLocaleString()} plotted across ${ZONES.length} eras. The acceleration becomes a thing you feel.</p></a>
        <a class='mode-tile' href='#/hunt'><h3>hunt →</h3><p>Pick something modern. Walk backward through every constraint that had to dissolve.</p></a>
        <a class='mode-tile' href='#/browse'><h3>browse →</h3><p>The full list, grouped by era, with search.</p></a>
        <a class='mode-tile' href='#/play'><h3>play →</h3><p>A 60-second auto-tour. Seven curated reels. Sit back; the chain runs itself.</p></a>
      </div>
      <h2>A note on accuracy</h2>
      <p>This is an editorial sketch, not a peer-reviewed reference. The dates and the chain-of-influence edges are one person's reading of history, drafted with the help of language models, audited against primary sources. Some entries compress ("iPhone / touchscreen computing" elides two decades of prior touchscreen work). Some intermediate ticks are missing. Some ancestry edges are associative rather than strictly causal.</p>
      <p>The chain is meant to be quibbled with. When you find an edge that should be cut or a tick that should be inserted, <a href='https://github.com/k3sava/ticks/issues/new' target='_blank' rel='noopener' style='color:var(--accent);border-bottom:1px solid var(--accent)'>open an issue</a>, or send a PR. Every tick has 2 to 3 source links you can verify. Ongoing audits live in <a href='AUDIT-CHAIN.md' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>AUDIT-CHAIN.md</a>, <a href='AUDIT-CLAIMS.md' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>AUDIT-CLAIMS.md</a>, and <a href='AUDIT-DEADLINKS.md' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>AUDIT-DEADLINKS.md</a>.</p>
      <h2>How to cite</h2>
      <p>If you write about a tick, please link to it. The corpus is open. The chain is the value. A citation that points back lets someone walk it themselves.</p>
      <pre class='cite'><code id='citeText'>Mandiga, Kesava. "Ticks · ${escapeHtml(TICKS.length.toLocaleString())} moments." https://ticks.iamkesava.com/.</code></pre>
      <button class='cite-copy' id='citeCopy' type='button'>copy citation</button>
      <p style='margin-top:8px;color:var(--muted);font-size:.92em'>For a single tick: <code>Mandiga, Kesava. "Ticks · {tick name} ({year})." https://ticks.iamkesava.com/#/walk/{id}.</code></p>
      <h2>For machines</h2>
      <p>Four machine-readable surfaces. Use whichever fits.</p>
      <ul class='about-list'>
        <li><a href='featured.json'>featured.json</a>: the 200 most-connected ticks. A curated tour, not a corpus dump.</li>
        <li><a href='search-index.json'>search-index.json</a>: one row per tick (id, name, year, zone, domain, constraint, parents and children counts).</li>
        <li><a href='data.json'>data.json</a>: the full corpus, including the edge graph, source links, and editorial detail.</li>
        <li><a href='llms.txt'>llms.txt</a>: schema, modes, citation format, in plain English. Read this first.</li>
      </ul>
      <p>Agent permissions, skill catalog, and the RFC 9727 linkset live under <a href='.well-known/agent-permissions.json'>.well-known/agent-permissions.json</a>, <a href='.well-known/agent-skills/index.json'>.well-known/agent-skills/index.json</a>, and <a href='.well-known/api-catalog'>.well-known/api-catalog</a>. Fetch, index, summarize, and quote are explicitly allowed. Citation back to the canonical tick URL is required.</p>

      <h2>Sources</h2>
      <p>Every tick has 2 to 3 source links you can follow. Most factual claims trace back to <strong>Wikipedia</strong>. Where its coverage was thin, ticks lean on the <strong>Stanford Encyclopedia of Philosophy</strong>, <strong>Encyclopaedia Britannica</strong>, and named academic monographs, with primary sources cited per tick. Some entries draw on field-specific references: <em>JSTOR</em> for journals, the <em>Internet Archive</em> for out-of-print books, <em>arXiv</em> for recent science, regional natural-history journals for biology.</p>
      <p>If a tick's source feels weak, <a href='https://github.com/k3sava/ticks/issues/new' target='_blank' rel='noopener' style='color:var(--accent);border-bottom:1px solid var(--accent)'>open an issue</a>. The corpus gets better when readers push back.</p>

      <h2>Influences</h2>
      <p>The framing — history as a chain of constraint dissolutions, each tick a moment when a new floor of possibility opens — owes the most to:</p>
      <ul class='about-list'>
        <li><strong>David Deutsch</strong>, <em>The Beginning of Infinity</em>. The thesis that all progress is constraint dissolution. The chain reasoning lives or dies by this idea.</li>
        <li><strong>James Burke</strong>, <em>Connections</em> (BBC, 1978). The format that links technologies and ideas across centuries through specific causal traces, not just thematic adjacency.</li>
        <li><strong>David Christian</strong>, <em>Maps of Time</em> and the Big History project. The decision to put pre-language hominins and ChatGPT into a single corpus, sorted by year.</li>
        <li><strong>Will and Ariel Durant</strong>, <em>The Story of Civilization</em>. The instinct that one person can hold all of recorded history in a single reading order.</li>
        <li><strong>Joel Mokyr</strong>, <em>A Culture of Growth</em>. The argument that institutions, not just inventions, drive breakthroughs.</li>
        <li><strong>Jared Diamond</strong>, <em>Guns, Germs, and Steel</em>. Reading geography and biology as constraints that shape what's possible where.</li>
        <li><strong>Yuval Noah Harari</strong>, <em>Sapiens</em>. The proof that popular history can take 70,000-year sweeps seriously without losing its reader.</li>
        <li><strong>Andrej Karpathy</strong>, <a href='https://gist.github.com/karpathy/1dd0294ef9567971c1e4348a90d69285' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>the LLM wiki gist</a>. The pattern of using a language model as a synthesis substrate. This corpus is one such substrate.</li>
        <li><strong>Edge.org</strong> annual questions. The discipline of compressing a thesis into one sentence and naming the breakpoint.</li>
        <li><strong>Long Now Foundation</strong>. The reminder that a thousand-year frame changes which moments matter.</li>
      </ul>
      <p>Drafted with <strong>Anthropic's Claude</strong> as a research and writing partner. Editorial decisions, the chain edges, the curation, and any errors are the human author's.</p>
    </article>
  `;
  document.getElementById('citeCopy')?.addEventListener('click', async () => {
    const text = document.getElementById('citeText')?.textContent || '';
    try { await navigator.clipboard.writeText(text); toast('citation copied'); }
    catch { toast('couldn\'t copy. select the text manually.', { error:true }); }
  });
}

/* ========== keyboard ========== */
let _gPending = 0;  // timestamp of last 'g' for two-key chords
window.addEventListener('keydown', (e) => {
  // Esc: close any open overlay regardless of focus context.
  if (e.key === 'Escape'){
    if (closeKbdHelp()) { e.preventDefault(); return; }
    const menu = document.getElementById('shareMenu');
    if (menu && !menu.hidden){ closeShareMenu(); e.preventDefault(); return; }
  }
  if (e.target.matches('input, textarea')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const k = e.key.toLowerCase();

  // g+<letter> chord navigation
  if (k === 'g'){ _gPending = Date.now(); e.preventDefault(); return; }
  if (_gPending && (Date.now() - _gPending) < 1200){
    _gPending = 0;
    const map = { h:'#/', w:'#/walk', m:'#/map', n:'#/hunt', b:'#/browse', a:'#/about' };
    if (map[k]){ location.hash = map[k]; e.preventDefault(); return; }
  }

  if (k === '?' || (e.key === '/' && e.shiftKey)){ openKbdHelp(); e.preventDefault(); return; }
  if (e.key === '/'){
    const q = document.getElementById('huntQ') || document.getElementById('brQ');
    if (q){ q.focus(); e.preventDefault(); return; }
  }
  // Play-mode controls
  if (location.hash.startsWith('#/play') && _playState){
    if (e.key === ' '){ togglePlay(); e.preventDefault(); return; }
    if (e.key === '['){ _playState.baseDelay = Math.min(900, _playState.baseDelay + 80); return; }
    if (e.key === ']'){ _playState.baseDelay = Math.max(120, _playState.baseDelay - 80); return; }
    if (e.key === 'ArrowLeft' || e.key === ','){ switchReel(-1); e.preventDefault(); return; }
    if (e.key === 'ArrowRight' || e.key === '.'){ switchReel(1); e.preventDefault(); return; }
  }
  if (k === 'r'){ const t = TICKS[Math.floor(Math.random()*TICKS.length)]; location.hash = '#/walk/' + t.id; e.preventDefault(); return; }
  if (k === 's' && location.hash.startsWith('#/walk')){
    const t = TICKS_SORTED[walkIdx];
    if (t){ shareTick(t, document.querySelector('[data-act="share"]') || document.body); e.preventDefault(); return; }
  }
  if (location.hash.startsWith('#/walk')){
    if (e.key === 'ArrowRight'){ walkStep(+1); }
    else if (e.key === 'ArrowLeft'){ walkStep(-1); }
    else if (e.key === 'ArrowUp'){
      const t = TICKS_SORTED[walkIdx];
      if (t) location.hash = '#/hunt/' + t.id;
    }
  }
});

/* ========== keyboard help dialog ========== */
let _kbdHelpOpener = null;
function openKbdHelp(){
  const d = document.getElementById('kbdHelp');
  if (!d) return;
  _kbdHelpOpener = document.activeElement;
  d.hidden = false;
  d.querySelector('.kbd-close')?.focus();
}
function closeKbdHelp(){
  const d = document.getElementById('kbdHelp');
  if (!d || d.hidden) return false;
  d.hidden = true;
  // Return focus to whatever opened the dialog so keyboard users don't get lost.
  if (_kbdHelpOpener && document.contains(_kbdHelpOpener)){
    _kbdHelpOpener.focus({preventScroll:true});
  }
  _kbdHelpOpener = null;
  return true;
}
function bindKbdHelp(){
  const d = document.getElementById('kbdHelp');
  if (!d) return;
  d.querySelector('.kbd-close')?.addEventListener('click', closeKbdHelp);
  d.addEventListener('click', (e) => { if (e.target === d) closeKbdHelp(); });
  // Trap focus inside the dialog while it's open
  d.addEventListener('keydown', (e) => {
    if (d.hidden) return;
    if (e.key !== 'Tab') return;
    const focusable = d.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
}

/* ========== close share menu on outside click ========== */
document.addEventListener('click', (e) => {
  const menu = document.getElementById('shareMenu');
  if (!menu || menu.hidden) return;
  if (menu.contains(e.target)) return;
  if (e.target.closest('[data-act="share"]')) return;
  closeShareMenu();
}, true);

/* ========== per-tick JSON-LD Article schema (AEO/GEO) ========== */
function injectArticleSchema(base, arg){
  let el = document.getElementById('tickArticleLD');
  if (base !== '/walk' || !arg || !TICK_BY_ID[arg]){
    if (el) el.remove();
    return;
  }
  const t = TICK_BY_ID[arg];
  const url = `${location.origin}${location.pathname}#/walk/${t.id}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': `${t.name} (${t.year})`,
    'name': t.name,
    'about': `${t.year}. ${t.name}. The moment ${cleanConstraint(t.constraint).toLowerCase()} stopped being a constraint.`,
    'url': url,
    'mainEntityOfPage': url,
    'inLanguage': 'en',
    'isPartOf': { '@id': 'https://ticks.iamkesava.com/#dataset' },
    'author': { '@type': 'Person', 'name': 'Kesava Mandiga', 'url': 'https://github.com/k3sava' },
    'publisher': { '@type': 'Person', 'name': 'Kesava Mandiga' },
    'license': 'https://opensource.org/licenses/MIT',
    'keywords': [t.domain, 'history', 'breakthrough', 'constraint dissolved'],
    'articleSection': t.domain,
    'description': `${t.year}. ${t.name}. Before this, ${cleanConstraint(t.constraint).toLowerCase()}.`,
  };
  if (t.detail) data.articleBody = t.detail;
  if (t.links?.length) data.citation = t.links.map(l => ({ '@type': 'CreativeWork', 'name': l.label, 'url': l.url }));
  if (!el){
    el = document.createElement('script');
    el.id = 'tickArticleLD';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/* ========== random button ========== */
function bindRandom(){
  const fire = () => { const t = TICKS[Math.floor(Math.random()*TICKS.length)]; location.hash = '#/walk/' + t.id; };
  document.getElementById('randomBtn').onclick = fire;
  document.getElementById('randomBtnMobile').onclick = fire;
}

/* ========== share + toast ========== */
function payloadFor(t){
  const url = `${location.origin}${location.pathname}#/walk/${t.id}`;
  const title = `${t.name} (${t.year}) · Ticks`;
  const text = `${t.year}. ${t.name}. Before this, ${cleanConstraint(t.constraint).toLowerCase()}.`;
  return { url, title, text };
}
function openShareMenu(triggerEl, t){
  const menu = document.getElementById('shareMenu');
  if (!menu) return;
  const { url, title, text } = payloadFor(t);
  const nativeBtn = menu.querySelector('[data-act="native"]');
  const canNative = !!(navigator.share && navigator.canShare?.({ title, url }));
  nativeBtn.hidden = !canNative;

  // Position relative to the trigger
  const r = triggerEl.getBoundingClientRect();
  menu.hidden = false;
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  let left = Math.max(8, r.left + window.scrollX);
  if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
  let top = r.bottom + 6 + window.scrollY;
  if (r.bottom + mh + 12 > window.innerHeight) top = r.top - mh - 6 + window.scrollY;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  const acts = {
    native: async () => {
      try { await navigator.share({ url, title, text }); }
      catch(e){ if (e?.name !== 'AbortError') toast('share failed', { error:true }); }
    },
    copy: async () => {
      try { await navigator.clipboard.writeText(url); toast('link copied'); }
      catch { toast('couldn\'t copy. long-press the URL.', { error:true }); }
    },
    x: () => {
      const tweet = `${text}\n\n`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    },
    linkedin: () => {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    },
    email: () => {
      const subject = title;
      const body = `${text}\n\n${url}`;
      location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    },
  };
  if (!menu.dataset.wired){
    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.share-opt');
      if (!btn) return;
      const handler = menu._acts?.[btn.dataset.act];
      closeShareMenu();
      handler?.();
    });
    menu.dataset.wired = 'true';
  }
  menu._acts = acts;
  setTimeout(() => menu.querySelector('.share-opt:not([hidden])')?.focus(), 20);
}
function closeShareMenu(){
  const menu = document.getElementById('shareMenu');
  if (menu) menu.hidden = true;
}
async function shareTick(t, triggerEl){
  if (triggerEl){ openShareMenu(triggerEl, t); return; }
  // Fallback (keyboard "s"): native if available, else copy.
  const { url, title, text } = payloadFor(t);
  if (navigator.share && navigator.canShare?.({ url, title })){
    try { await navigator.share({ url, title, text }); return; }
    catch(e){ if (e?.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('link copied'); }
  catch { toast('couldn\'t copy. long-press the URL.', { error:true }); }
}
let _toastT;
function toast(msg, opts={}){
  let el = document.getElementById('toast');
  if (!el){
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.dataset.show = 'true';
  el.dataset.error = opts.error ? 'true' : '';
  clearTimeout(_toastT);
  _toastT = setTimeout(() => { el.dataset.show = ''; }, opts.duration || 2200);
}

/* ========== mobile menu ========== */
function bindMobileMenu(){
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  const back = document.getElementById('mobileBackdrop');
  btn.onclick = () => { menu.classList.add('open'); back.classList.add('show'); };
  back.onclick = closeMobileMenu;
  document.getElementById('menuClose')?.addEventListener('click', closeMobileMenu);
  menu.querySelectorAll('a').forEach(a => a.onclick = closeMobileMenu);
}
function closeMobileMenu(){
  document.getElementById('mobileMenu')?.classList.remove('open');
  document.getElementById('mobileBackdrop')?.classList.remove('show');
}

/* ========== theme ==========
   Four-theme cycle: dark → light → brutalist → matrix → dark.
   - dark: graphite + warm bloom, the photon-glass baseline (Oblivion Dark)
   - light: warm paper, sienna accent, pebbled grain on glass (Oblivion Light)
   - brutalist: solid white/black, no glass, no blur, print-like
   - matrix: phosphor green on near-black, scanline texture, CRT flicker
   The user's system preference wins on first paint; once they
   cycle, we persist. */
const THEMES = ['dark', 'light', 'brutalist', 'matrix'];
const THEME_BG = { light: '#F4EFE6', dark: '#0A0A0F', matrix: '#040806', brutalist: '#FAFAFA' };
// Human-readable theme names for the label
const THEME_LABEL = { light: 'oblivion', dark: 'oblivion', brutalist: 'brutalist', matrix: 'matrix' };
function bindTheme(){
  const btn = document.getElementById('themeBtn');
  const label = document.getElementById('themeLabel');
  const apply = (t) => {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    try { if (t) localStorage.setItem('ticks-theme', t); else localStorage.removeItem('ticks-theme'); } catch(e){}
    // Sync the active <meta name="theme-color"> so the iOS/Android chrome
    // matches the active theme, including brutalist.
    const meta = document.getElementById('themeColorActive');
    if (meta){
      const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
      const eff = t || (sysDark ? 'dark' : 'light');
      meta.setAttribute('content', THEME_BG[eff] || THEME_BG.dark);
    }
    if (label){
      const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
      const eff = t || (sysDark ? 'dark' : 'light');
      label.textContent = THEME_LABEL[eff] || eff;
    }
  };
  try { const saved = localStorage.getItem('ticks-theme'); if (saved) apply(saved); else apply(null); } catch(e){}
  const toggle = () => {
    const cur = document.documentElement.dataset.theme;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    // First click — start the cycle from the system-effective theme.
    let next;
    if (!cur){
      next = sysDark ? 'light' : 'dark';
    } else {
      const i = THEMES.indexOf(cur);
      next = THEMES[(i + 1) % THEMES.length];
    }
    apply(next);
  };
  btn.onclick = toggle;
  document.getElementById('themeBtnMobile')?.addEventListener('click', toggle);
}

/* ========== scroll header ========== */
function bindScrollHeader(){
  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ========== querystring permalinks (for crawlers + share-tools that
   strip the hash) ============================================== */
// Accept ?tick=ID or ?walk=ID or ?hunt=ID and convert to a hash route
// before render. Keeps the address bar stable for users who land via
// a stripped-hash share link.
function rewriteFromQuery(){
  const u = new URL(location.href);
  const params = u.searchParams;
  const map = { tick: 'walk', walk: 'walk', hunt: 'hunt' };
  for (const k of Object.keys(map)){
    const id = params.get(k);
    if (id){
      params.delete(k);
      const newSearch = params.toString();
      const newUrl = `${u.pathname}${newSearch ? '?' + newSearch : ''}#/${map[k]}/${encodeURIComponent(id)}`;
      history.replaceState(null, '', newUrl);
      return;
    }
  }
  // ?random=1 → pick one and replace
  if (params.has('random')){
    params.delete('random');
    const t = TICKS[Math.floor(Math.random() * TICKS.length)] || null;
    const ns = params.toString();
    const newUrl = `${u.pathname}${ns ? '?' + ns : ''}#/walk/${t ? t.id : ''}`;
    history.replaceState(null, '', newUrl);
  }
}

/* ========== boot ========== */
Promise.all([loadData(), loadOgManifest()]).then(() => {
  rewriteFromQuery();
  bindRandom(); bindMobileMenu(); bindTheme(); bindScrollHeader(); bindKbdHelp();
  render();
}).catch(err => {
  app.innerHTML = `<div style='padding:48px;font-family:var(--mono);color:var(--muted)'>Failed to load ticks: ${escapeHtml(err.message)}</div>`;
});
