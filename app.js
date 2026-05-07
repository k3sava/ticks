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
  document.getElementById('ftrCount').textContent = `${TICKS.length.toLocaleString()} moments`;
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
  '/play': play,
};

function parseHash(){
  let h = location.hash.replace(/^#/, '');
  if (!h || h === '/') return ['', null];
  const parts = h.split('/').filter(Boolean);
  return ['/'+parts[0], parts[1] ? decodeURIComponent(parts[1]) : null];
}

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
          <div class='dom' style='${domStyle(hero.domain)}'>${hero.domain}</div>
          <div class='yr'>${escapeHtml(hero.year)}</div>
          <div class='nm'>${escapeHtml(hero.name)}</div>
          <div class='be'>before this, ${escapeHtml(cleanConstraint(hero.constraint).toLowerCase())}.</div>
        </div>
        <div class='home-show-flow'>
          <div class='label'>everything that flowed →</div>
          ${flow.length ? flow.map(t => `
            <div class='row' onclick='location.hash="#/walk/${t.id}"'>
              <span>${escapeHtml(t.name)}</span>
              <span class='y'>${escapeHtml(t.year)}</span>
            </div>`).join('') : '<div style="color:var(--muted);font-style:italic">a single thread; click walk to follow</div>'}
        </div>
      </div>

      <div class='home-cta'>
        <div class='home-cta-buttons'>
          <a href='#/walk'>start walking →</a>
          <a class='secondary' href='#/map'>see all ${TICKS.length.toLocaleString()}</a>
          <a class='secondary' href='#/hunt'>walk backward from a thing you know</a>
          <a class='secondary' href='#/play'>play the chain (60s)</a>
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
// Three hand-written hero openings. Same voice, different doors.
// Picked deterministically by date so the homepage feels alive but a
// shared link on the same day shows the same opener.
const HERO_OPENINGS = [
  { h: "The right breakpoint, and <em>everything flows</em>.",
    sub: "A tick is the moment a constraint dissolved.",
    sub2: "Before it, we couldn't. After it, things kinda blew up." },
  { h: "History, but <em>only the moments that mattered</em>.",
    sub: "A tick is the moment a constraint dissolved.",
    sub2: "Walk forward, or backward from a thing you already know." },
  { h: "Each one made the <em>next one</em> possible.",
    sub: "A tick is the moment a constraint dissolved.",
    sub2: "The chain teaches you more than the list ever could." },
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
function walk(id){
  if (id && TICK_BY_ID[id]) walkIdx = TICKS_SORTED.findIndex(t => t.id === id);
  if (walkIdx < 0) walkIdx = 0;
  renderWalk();
}

function renderWalk(){
  const t = TICKS_SORTED[walkIdx];
  if (!t){ app.innerHTML = '<p style="padding:48px">No tick.</p>'; return; }
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
      ${ancestors.length ? `
      <nav class='walk-trail' aria-label='What had to dissolve before this'>
        ${ancestors.map(a => `
          <a class='walk-trail-step' href='#/walk/${a.id}' style='${domStyle(a.domain)}'>
            <span class='yr'>${escapeHtml(a.year)}</span>
            <span class='nm'>${escapeHtml(a.name)}</span>
          </a>`).join('<span class="walk-trail-link" aria-hidden="true">↓</span>')}
        <span class='walk-trail-link walk-trail-here' aria-hidden="true">↓</span>
      </nav>` : ''}
      <div class='walk-stage'>
        <div class='dom walk-domain' style='${domStyle(t.domain)}'>${t.domain}</div>
        <div class='walk-year'>${escapeHtml(t.year)}</div>
        <div class='walk-name'>${escapeHtml(t.name)}</div>
        <div class='walk-before'>
          <span class='label'>before this</span>
          ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.
        </div>
        ${EDITORIAL_NOTES[t.id] ? `<aside class='walk-note' aria-label='Editorial note'>${escapeHtml(EDITORIAL_NOTES[t.id])}</aside>` : ''}
        ${t.detail ? `<div class='walk-detail'>${escapeHtml(t.detail)}</div>` : ''}
        ${t.links?.length ? `<div class='walk-links'>${t.links.map(l => `<a href='${escapeHtml(l.url)}' target='_blank' rel='noopener'>→ ${escapeHtml(l.label)}</a>`).join('')}</div>` : ''}
        <div class='walk-actions'>
          <button class='walk-action' data-act='share' aria-label='Share this tick'>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M11 5.5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-6 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm6 4a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm-1.5-9-3 2.4M9.5 13l-3-2.4"/></svg>
            share
          </button>
          <a class='walk-action' href='https://github.com/k3sava/ticks/issues/new?title=${encodeURIComponent('Edit: ' + t.name)}&body=${encodeURIComponent('Tick: ' + t.id + '\\n\\nWhat needs fixing:\\n\\nSource:')}' target='_blank' rel='noopener'>↗ suggest an edit</a>
        </div>
      </div>

      <div class='walk-flow'>
        <div class='walk-flow-head'>${flow.length ? `everything that flowed from this (${flow.length}${flowDepth2 ? `, ${flowDepth2.toLocaleString()} more two steps out` : ''})` : 'no recorded downstream. a quiet tick.'}</div>
        ${flow.length ? flow.map(f => `
          <a class='walk-flow-card' href='#/walk/${f.id}' style='${domStyle(f.domain)}'>
            <span class='yr'>${escapeHtml(f.year)}</span>
            <span class='nm'>${escapeHtml(f.name)}</span>
          </a>`).join('') : '<div class="walk-flow-empty">A frontier tick. What flows from this is still being written. Press → to keep walking.</div>'}
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
  document.getElementById('wPrev').onclick = () => { walkIdx = Math.max(0, walkIdx-1); renderWalk(); };
  document.getElementById('wNext').onclick = () => { walkIdx = Math.min(TICKS_SORTED.length-1, walkIdx+1); renderWalk(); };
  // Share button: opens the share menu anchored under the trigger.
  const shareBtn = app.querySelector('[data-act="share"]');
  if (shareBtn) shareBtn.onclick = (e) => { e.stopPropagation(); shareTick(t, shareBtn); };
  // Touch swipe (left/right) on the walk stage
  const stage = document.querySelector('.walk');
  if (stage){
    let sx = 0, sy = 0, swiping = false;
    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true;
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (!swiping) return;
      swiping = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      // Horizontal swipe > 60px and clearly horizontal (not a scroll)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5){
        if (dx < 0){ walkIdx = Math.min(TICKS_SORTED.length-1, walkIdx+1); renderWalk(); }
        else      { walkIdx = Math.max(0, walkIdx-1); renderWalk(); }
      }
    }, { passive: true });
  }
}

/* ========== hunt — walk backward through what unlocked X ========== */
function hunt(id){
  if (!id){
    renderHuntPicker();
    return;
  }
  const tick = TICK_BY_ID[id];
  if (!tick){ renderHuntPicker(); return; }
  const chain = buildAncestryChain(id, 12);
  app.innerHTML = `
    <section class='hunt'>
      <div class='hunt-head'>
        <h1>How did we get to <em>${escapeHtml(tick.name.toLowerCase())}</em>?</h1>
        <p>Walking backward through the constraints that had to dissolve first. Each step required the one above.</p>
      </div>
      <div class='hunt-chain'>
        ${chain.length === 0 ? '<div class="hunt-empty">No recorded ancestors. Pick another below.</div>' : chain.map((t, i) => {
          const next = chain[i+1];
          const bridge = next ? `before <em>${escapeHtml(next.name.toLowerCase())}</em>, ${escapeHtml(cleanConstraint(next.constraint).toLowerCase())}.` : '';
          return `
          <div class='hunt-step' style='${domStyle(t.domain)}'>
            <div class='hunt-step-yr'>${escapeHtml(t.year)}</div>
            <div class='hunt-step-body'>
              <div class='hunt-step-name' onclick='location.hash="#/walk/${t.id}"'>${escapeHtml(t.name)}</div>
              <div class='hunt-step-before'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</div>
              <div class='hunt-step-meta'><span class='dom' style='${domStyle(t.domain)}'>${t.domain}</span></div>
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
      <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}'>
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
      <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}'>
        <span class='nm'>${escapeHtml(t.name)}</span>
        <span class='yr'>${escapeHtml(t.year)} · ${t.domain}</span>
      </button>`).join('')}</div>`;
  }
  return `<div class='hunt-suggest-grid'>${items.map(t => `
    <button onclick='location.hash="#/hunt/${t.id}"' style='${domStyle(t.domain)}'>
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
          ${domains.map(d => `<div class='map-y-label' style='${domStyle(d)};color:var(--dc)'>${d}</div>`).join('')}
        </div>
        <div class='map-mobile-scroller' id='mapScroller'>
          <canvas class='map-canvas' id='mapCanvas'></canvas>
          <div class='map-eras' id='mapEras'></div>
          <div class='map-tooltip' id='mapTip'></div>
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
  // selected, we still render the full set but dim non-matches so the silhouette
  // of the corpus stays visible — the alpha branch below handles the dimming.
  const filtered = TICKS;
  const dots = [];
  filtered.forEach(t => {
    if (t.yearN == null) return;
    const cx = x(t.yearN);
    const di = domains.indexOf(t.domain);
    if (di < 0) return;
    // jitter Y a touch by hashing the id to spread overlapping dots
    let h = 0; for (let i = 0; i < t.id.length; i++) h = (h*31 + t.id.charCodeAt(i)) | 0;
    const jitter = ((h % 1000)/1000 - 0.5) * Math.min(rowH*0.6, 18);
    const cy = padT + di*rowH + rowH/2 + jitter;
    const c = DOMAINS[t.domain] || '#888';
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.globalAlpha = MAP_STATE.domain !== 'all' && t.domain !== MAP_STATE.domain ? 0.06 : 0.82;
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
      tip.textContent = `${hit.t.year} · ${hit.t.name}`;
      tip.style.left = (mx+12) + 'px';
      tip.style.top = (my+12) + 'px';
      canvas.style.cursor = 'pointer';
      last = hit;
    } else {
      tip.classList.remove('show');
      canvas.style.cursor = 'default';
      last = null;
    }
  };
  canvas.onmouseleave = () => { tip.classList.remove('show'); last = null; };
  canvas.onclick = (e) => {
    // Touch / click parity: locate hit by coordinates if `last` not set (touch devices don't fire mousemove first)
    if (!last){
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (let i = dots.length-1; i >= 0; i--){
        const dt = dots[i];
        if (Math.hypot(dt.x-mx, dt.y-my) <= dt.r * 1.6){ last = dt; break; }
      }
    }
    if (last){
      // Touch: show tooltip briefly first. If already showing for same dot, navigate.
      const sameAsLastTap = canvas._lastTapId === last.t.id;
      if (!tip.classList.contains('show') || !sameAsLastTap){
        tip.classList.add('show');
        tip.textContent = `${last.t.year} · ${last.t.name} (tap again to open)`;
        const rect = canvas.getBoundingClientRect();
        tip.style.left = (e.clientX - rect.left + 12) + 'px';
        tip.style.top = (e.clientY - rect.top + 12) + 'px';
        canvas._lastTapId = last.t.id;
        setTimeout(() => { canvas._lastTapId = null; tip.classList.remove('show'); }, 2400);
      } else {
        location.hash = '#/walk/' + last.t.id;
      }
    }
  };
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
            <header class='browse-zone-head' role='button' tabindex='0' aria-expanded='${!collapsed}'>
              <span class='browse-chev' aria-hidden='true'>${collapsed ? '▸' : '▾'}</span>
              <h2>${escapeHtml(z.name)}</h2>
              <span class='range'>${range} → ${rangeTo}</span>
              ${rule ? `<span class='rule'>before this, ${escapeHtml(rule)}</span>` : ''}
              <span class='ct'>${items.length}</span>
            </header>
            <div class='browse-zone-body'>
              ${items.map(t => `
                <a class='browse-row' href='#/walk/${t.id}' style='${domStyle(t.domain)}'>
                  <span class='yr'>${escapeHtml(t.year)}</span>
                  <div class='body'>
                    <span class='nm'>${escapeHtml(t.name)}</span>
                    <span class='be'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</span>
                  </div>
                  <span class='dom' style='${domStyle(t.domain)}'>${t.domain}</span>
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

/* ========== play (acceleration finale) ========== */
// 60-second auto-tour of the corpus. Year-loud, single tick at a time,
// with five "world inverted" beats that hold an extra moment.
const PLAY_BEATS = new Set([
  'recursive-language',
  'wheat-domestication',
  'sumerian-writing-first-literature',
  'gutenbergs-printing-press',
  'transistor-bell-labs-shockley-bardeen-brattain',
  'transistor-invention',
  'chatgpt-rlhf-alignment',
]);
let _playTimer = null;
let _playState = null;

function play(){
  // Build the playlist: prefer featured.json items if loaded, else top-200
  // by parents+children. Sort by yearN ascending. Cap at 180 items so a
  // 60s playback at ≈333ms/tick fits with beat pauses.
  const features = (window.__features || []).map(id => TICK_BY_ID[id]).filter(Boolean);
  const baseList = features.length ? features : (() => {
    const scored = TICKS.map(t => ({
      t,
      score: (UNLOCKS[t.id]?.length || 0) * 2 + (UNLOCKED_BY[t.id]?.length || 0),
    })).sort((a, b) => b.score - a.score).slice(0, 180);
    return scored.map(s => s.t);
  })();
  const list = [...baseList].sort((a, b) => (a.yearN || 0) - (b.yearN || 0));

  app.innerHTML = `
    <section class='play' aria-label='Acceleration finale'>
      <div class='play-meta'>
        <span class='play-counter' id='playCount'>1 / ${list.length}</span>
        <span class='play-help'>space pauses · [ slows · ] speeds · esc exits</span>
      </div>
      <div class='play-stage' id='playStage'></div>
      <div class='play-progress' aria-hidden='true'><div class='play-progress-fill' id='playFill'></div></div>
      <div class='play-controls'>
        <button id='playToggle' type='button'>pause</button>
        <a class='play-exit' href='#/'>exit</a>
      </div>
    </section>
  `;

  _playState = { list, idx: 0, paused: false, baseDelay: 333, beatDelay: 1500 };
  renderPlayFrame();
  schedulePlay();

  document.getElementById('playToggle').onclick = togglePlay;
}

function renderPlayFrame(){
  const s = _playState;
  if (!s) return;
  const t = s.list[s.idx];
  if (!t) return;
  const stage = document.getElementById('playStage');
  if (!stage) return;
  const isBeat = PLAY_BEATS.has(t.id);
  stage.innerHTML = `
    <div class='play-frame ${isBeat ? 'is-beat' : ''}' style='${domStyle(t.domain)}'>
      <div class='play-dom dom' style='${domStyle(t.domain)}'>${t.domain}</div>
      <div class='play-year'>${escapeHtml(t.year)}</div>
      <div class='play-name'>${escapeHtml(t.name)}</div>
      <div class='play-constraint'>before this, ${escapeHtml(cleanConstraint(t.constraint).toLowerCase())}.</div>
      ${isBeat ? '<div class="play-beat-mark">the world inverted here</div>' : ''}
    </div>
  `;
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
      <p class='lede'>A tick is the moment a constraint dissolved. Before it, we couldn't. After it, things kinda blew up. What came next required it.</p>
      <p>This site is a database of ${TICKS.length.toLocaleString()} such moments across 14 domains of human history. Small enough to walk through in an afternoon. Dense enough to surprise you for years.</p>
      <p>The thesis is simple. <em>History is a chain of breakpoints.</em> A constraint dissolves (recursive language, written script, the joint-stock company, the transistor) and a flood of new things become possible that simply weren't before. Each tick is a moment when one of those breakpoints came through.</p>
      <h2>Four ways to play</h2>
      <div class='modes'>
        <a class='mode-tile' href='#/walk'><h3>walk →</h3><p>One tick at a time. Year is loud. Click anything that flowed from it to keep walking.</p></a>
        <a class='mode-tile' href='#/map'><h3>map →</h3><p>All ${TICKS.length.toLocaleString()} plotted across ${ZONES.length} eras. The acceleration becomes a thing you feel.</p></a>
        <a class='mode-tile' href='#/hunt'><h3>hunt →</h3><p>Pick something modern. Walk backward through every constraint that had to dissolve.</p></a>
        <a class='mode-tile' href='#/browse'><h3>browse →</h3><p>The full list, grouped by era, with search.</p></a>
      </div>
      <h2>A note on accuracy</h2>
      <p>This is an editorial sketch, not a peer-reviewed reference. The dates and the chain-of-influence edges are one person's reading of history, drafted with the help of language models. Some entries oversimplify ("iPhone / touchscreen computing" undersells two decades of prior touchscreen work). Some intermediate ticks are missing. Some ancestry edges are associative rather than strictly causal.</p>
      <p>A full audit pass, verifying each tick against primary sources and tightening the chain, is the next project. In the meantime, <a href='https://github.com/k3sava/ticks/issues/new' target='_blank' rel='noopener' style='color:var(--accent);border-bottom:1px solid var(--accent)'>open an issue</a> to flag corrections, or send a PR. Every tick has 2–3 source links you can verify.</p>
      <h2>How to cite</h2>
      <p>If you write about a tick, please link to it. The corpus is open and the chain is the value; a citation that points back lets someone walk it themselves.</p>
      <pre class='cite'><code id='citeText'>Mandiga, Kesava. "Ticks · ${escapeHtml(TICKS.length.toLocaleString())} moments." https://k3sava.github.io/ticks/.</code></pre>
      <button class='cite-copy' id='citeCopy' type='button'>copy citation</button>
      <h2>For machines</h2>
      <p>Three machine-readable surfaces, in increasing density:</p>
      <ul class='about-list'>
        <li><a href='featured.json'>featured.json</a>: the 200 most-connected ticks. Curated tour, not a corpus dump.</li>
        <li><a href='search-index.json'>search-index.json</a>: one row per tick (id, name, year, zone, domain, constraint, parents and children counts).</li>
        <li><a href='data.json'>data.json</a>: the full corpus, including the edge graph, source links, and editorial detail.</li>
      </ul>
      <p>Schema is documented in <a href='llms.txt'>llms.txt</a>. Agent permissions and citation format live in <a href='.well-known/agent-permissions.json'>.well-known/agent-permissions.json</a>.</p>
      <h2>Credit</h2>
      <p class='credit'>Made by <a href='https://github.com/k3sava' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>Kesava</a> · MIT · <a href='https://github.com/k3sava/ticks' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>source on GitHub</a></p>
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
  }
  if (k === 'r'){ const t = TICKS[Math.floor(Math.random()*TICKS.length)]; location.hash = '#/walk/' + t.id; e.preventDefault(); return; }
  if (k === 's' && location.hash.startsWith('#/walk')){
    const t = TICKS_SORTED[walkIdx];
    if (t){ shareTick(t, document.querySelector('[data-act="share"]') || document.body); e.preventDefault(); return; }
  }
  if (location.hash.startsWith('#/walk')){
    if (e.key === 'ArrowRight'){ walkIdx = Math.min(TICKS_SORTED.length-1, walkIdx+1); renderWalk(); }
    else if (e.key === 'ArrowLeft'){ walkIdx = Math.max(0, walkIdx-1); renderWalk(); }
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
    'isPartOf': { '@id': 'https://k3sava.github.io/ticks/#dataset' },
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

/* ========== theme ========== */
function bindTheme(){
  const btn = document.getElementById('themeBtn');
  const apply = (t) => {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    try { if (t) localStorage.setItem('ticks-theme', t); else localStorage.removeItem('ticks-theme'); } catch(e){}
  };
  try { const saved = localStorage.getItem('ticks-theme'); if (saved) apply(saved); } catch(e){}
  const toggle = () => {
    const cur = document.documentElement.dataset.theme;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const next = cur === 'dark' ? 'light' : cur === 'light' ? (sysDark ? 'dark' : null) : (sysDark ? 'light' : 'dark');
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
