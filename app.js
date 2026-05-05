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

function domStyle(domain){
  return `--dc:${DOMAINS[domain] || '#888'}`;
}

/* ========== loading ========== */
async function loadData(){
  const r = await fetch('data.json');
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
  const handler = routes[base + (arg ? '/:id' : '')] || routes[base] || home;
  app.className = '';
  if (base === '/walk') app.classList.add('full-bleed');
  else if (base === '/map') app.classList.add('wide');
  handler(arg);
  window.scrollTo({top:0, behavior:'instant'});
  closeMobileMenu();
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

  app.innerHTML = `
    <section class='home-hero'>
      <div class='home-thesis'>
        <div class='eyebrow'>1,061 moments that changed what comes next</div>
        <h1>The right breakpoint, and <em>everything flows</em>.</h1>
        <p class='home-sub'>A tick is the moment a constraint dissolved.<span class='home-sub-2'>Before it, we couldn't. After it, things kinda blew up.</span></p>
      </div>

      <div class='home-show'>
        <div class='home-show-tick'>
          <div class='dom' style='${domStyle(hero.domain)}'>${hero.domain}</div>
          <div class='yr'>${escapeHtml(hero.year)}</div>
          <div class='nm'>${escapeHtml(hero.name)}</div>
          <div class='be'>before this, ${escapeHtml(hero.constraint.toLowerCase())}.</div>
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
          <a class='secondary' href='#/map'>see all 1,061</a>
          <a class='secondary' href='#/hunt'>walk backward from a thing you know</a>
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
  // Prefer a foundational tick with rich downstream
  const candidates = ['recursive-language','collective-fiction','wheat-domestication','sumerian-writing-first-literature','printing-press-gutenberg','transistor','the-internet-tcp-ip'];
  for (const id of candidates){ if (TICK_BY_ID[id]) return TICK_BY_ID[id]; }
  // Fall back: tick with most unlocks
  let best = TICKS[0], bestN = 0;
  for (const t of TICKS){
    const n = (UNLOCKS[t.id] || []).length;
    if (n > bestN){ best = t; bestN = n; }
  }
  return best;
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

  app.innerHTML = `
    <section class='walk' style='${domStyle(t.domain)}'>
      <div class='walk-meta'>
        <span class='zone-name'>${escapeHtml(zone?.name || t.zone)}</span>
        <span class='pos'>${walkIdx+1} / ${TICKS_SORTED.length}</span>
      </div>
      <div class='walk-stage'>
        <div class='dom walk-domain' style='${domStyle(t.domain)}'>${t.domain}</div>
        <div class='walk-year'>${escapeHtml(t.year)}</div>
        <div class='walk-name'>${escapeHtml(t.name)}</div>
        <div class='walk-before'>
          <span class='label'>before this</span>
          ${escapeHtml(t.constraint.toLowerCase())}.
        </div>
        ${t.detail ? `<div class='walk-detail'>${escapeHtml(t.detail)}</div>` : ''}
        ${t.links?.length ? `<div class='walk-links'>${t.links.map(l => `<a href='${escapeHtml(l.url)}' target='_blank' rel='noopener' style='font-family:var(--mono);font-size:.78rem;color:var(--muted);border-bottom:1px solid var(--line);padding:4px 0'>→ ${escapeHtml(l.label)}</a>`).join('')}</div>` : ''}
        <a class='walk-suggest' href='https://github.com/k3sava/ticks/issues/new?title=${encodeURIComponent('Edit: ' + t.name)}&body=${encodeURIComponent('Tick: ' + t.id + '\\n\\nWhat needs fixing:\\n\\nSource:')}' target='_blank' rel='noopener' style='font-family:var(--mono);font-size:.78rem;color:var(--faint);margin-top:4px;padding:8px 0;display:inline-block'>↗ suggest an edit</a>
      </div>

      <div class='walk-flow'>
        <div class='walk-flow-head'>${flow.length ? `everything that flowed from this (${flow.length})` : 'no recorded downstream — a quiet tick'}</div>
        ${flow.length ? flow.map(f => `
          <a class='walk-flow-card' href='#/walk/${f.id}' style='${domStyle(f.domain)}'>
            <span class='yr'>${escapeHtml(f.year)}</span>
            <span class='nm'>${escapeHtml(f.name)}</span>
          </a>`).join('') : '<div class="walk-flow-empty">It still mattered. Hit → for the next moment in time.</div>'}
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
        ${chain.length === 0 ? '<div class="hunt-empty">No recorded ancestors. Pick another below.</div>' : chain.map((t, i) => `
          <div class='hunt-step' style='${domStyle(t.domain)}'>
            <div class='hunt-step-yr'>${escapeHtml(t.year)}</div>
            <div class='hunt-step-body'>
              <div class='hunt-step-name' onclick='location.hash="#/walk/${t.id}"'>${escapeHtml(t.name)}</div>
              <div class='hunt-step-before'>before this, ${escapeHtml(t.constraint.toLowerCase())}.</div>
              <div class='hunt-step-meta'><span class='dom' style='${domStyle(t.domain)}'>${t.domain}</span></div>
            </div>
          </div>
          ${i < chain.length-1 ? `<div class='hunt-arrow'>required ↓</div>` : ''}
        `).join('')}
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
        <input id='huntQ' type='search' placeholder='search any tick — penicillin, the iPhone, jazz, democracy…' autocomplete='off' />
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
        <p>Every tick, plotted on a log-scale time axis. Each row is a domain. Sixty thousand years of nothing — then everything.</p>
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
        <canvas class='map-canvas' id='mapCanvas'></canvas>
        <div class='map-eras' id='mapEras'></div>
        <div class='map-tooltip' id='mapTip'></div>
      </div>
      <p style='font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:14px'>Click any dot to open the tick. Hover for details.</p>
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
  const W = wrap.clientWidth;
  const H = 520;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0,0,W,H);

  const padL = 130, padR = 24, padT = 32, padB = 28;
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

  // Plot dots — jitter slightly within row so density reads
  const filtered = MAP_STATE.domain === 'all' ? TICKS : TICKS;
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
  let last = null;
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hit = null;
    for (let i = dots.length-1; i >= 0; i--){
      const d = dots[i];
      if (Math.hypot(d.x-mx, d.y-my) <= d.r){ hit = d; break; }
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
const BROWSE_STATE = { q: '' };
function browse(){
  const q = BROWSE_STATE.q.toLowerCase();
  const filtered = q ? TICKS.filter(t => t.name.toLowerCase().includes(q) || t.constraint.toLowerCase().includes(q) || (t.detail||'').toLowerCase().includes(q)) : TICKS;
  const byZone = {};
  filtered.forEach(t => { (byZone[t.zone] = byZone[t.zone] || []).push(t); });
  ZONES.forEach(z => { if (byZone[z.id]) byZone[z.id].sort((a,b) => (a.yearN||0)-(b.yearN||0)); });

  app.innerHTML = `
    <section class='browse-page'>
      <div class='browse-head'>
        <h1>Browse all 1,061</h1>
        <p>Grouped by era. Click any tick to open it. Search to narrow.</p>
      </div>
      <div class='browse-toolbar'>
        <div class='browse-search'>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="m11 11 3 3"/></svg>
          <input id='brQ' type='search' value='${escapeHtml(BROWSE_STATE.q)}' placeholder='search ticks…' />
        </div>
        <div class='browse-meta'>${filtered.length.toLocaleString()} of ${TICKS.length.toLocaleString()}</div>
      </div>
      ${ZONES.map(z => {
        const items = byZone[z.id];
        if (!items?.length) return '';
        const range = z.from < 0 ? `${Math.abs(z.from).toLocaleString()} BC` : `${z.from} AD`;
        const rangeTo = z.to < 0 ? `${Math.abs(z.to).toLocaleString()} BC` : `${z.to} AD`;
        return `
          <section class='browse-zone'>
            <header class='browse-zone-head'>
              <h2>${escapeHtml(z.name)}</h2>
              <span class='range'>${range} → ${rangeTo}</span>
              <span class='ct'>${items.length}</span>
            </header>
            ${items.map(t => `
              <a class='browse-row' href='#/walk/${t.id}' style='${domStyle(t.domain)}'>
                <span class='yr'>${escapeHtml(t.year)}</span>
                <div class='body'>
                  <span class='nm'>${escapeHtml(t.name)}</span>
                  <span class='be'>before this, ${escapeHtml(t.constraint.toLowerCase())}.</span>
                </div>
                <span class='dom' style='${domStyle(t.domain)}'>${t.domain}</span>
              </a>`).join('')}
          </section>`;
      }).join('')}
    </section>
  `;
  const qEl = document.getElementById('brQ');
  qEl.addEventListener('input', (e) => { BROWSE_STATE.q = e.target.value; clearTimeout(window._brT); window._brT = setTimeout(browse, 120); });
}

/* ========== about ========== */
function about(){
  app.innerHTML = `
    <article class='about'>
      <h1>About ticks</h1>
      <p class='lede'>A tick is the moment a constraint dissolved. Before it, we couldn't. After it, things kinda blew up — and what came next required it.</p>
      <p>This site is a database of 1,061 such moments across 14 domains of human history. It is small enough to walk through in an afternoon and dense enough to surprise you for years.</p>
      <p>The thesis is simple: <em>history is a chain of breakpoints</em>. A constraint dissolves — recursive language, written script, the joint-stock company, the transistor — and a flood of new things become possible that simply weren't before. Each tick is a moment when one of those breakpoints came through.</p>
      <h2>Four ways to play</h2>
      <div class='modes'>
        <a class='mode-tile' href='#/walk'><h3>walk →</h3><p>One tick at a time. Year is loud. Click anything that flowed from it to keep walking.</p></a>
        <a class='mode-tile' href='#/map'><h3>map →</h3><p>All 1,061 plotted across 12 eras. The acceleration becomes a thing you feel.</p></a>
        <a class='mode-tile' href='#/hunt'><h3>hunt →</h3><p>Pick something modern. Walk backward through every constraint that had to dissolve.</p></a>
        <a class='mode-tile' href='#/browse'><h3>browse →</h3><p>The full list, grouped by era, with search.</p></a>
      </div>
      <h2>A note on accuracy</h2>
      <p>This is an editorial sketch, not a peer-reviewed reference. The dates and the chain-of-influence edges are one person's reading of history, drafted with the help of language models. Some entries oversimplify ("iPhone / touchscreen computing" undersells two decades of prior touchscreen work). Some intermediate ticks are missing. Some ancestry edges are associative rather than strictly causal.</p>
      <p>A full audit pass — verifying each tick against primary sources and tightening the chain — is the next project. In the meantime: <a href='https://github.com/k3sava/ticks/issues/new' target='_blank' rel='noopener' style='color:var(--accent);border-bottom:1px solid var(--accent)'>open an issue</a> to flag corrections, or send a PR. Every tick has 2–3 source links you can verify.</p>
      <h2>Credit</h2>
      <p class='credit'>Made by <a href='https://github.com/k3sava' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>Kesava</a> · MIT · <a href='https://github.com/k3sava/ticks' target='_blank' rel='noopener' style='color:var(--ink-2);border-bottom:1px solid var(--line)'>source on GitHub</a></p>
    </article>
  `;
}

/* ========== keyboard ========== */
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'r'){ const t = TICKS[Math.floor(Math.random()*TICKS.length)]; location.hash = '#/walk/' + t.id; e.preventDefault(); return; }
  if (location.hash.startsWith('#/walk')){
    if (e.key === 'ArrowRight'){ walkIdx = Math.min(TICKS_SORTED.length-1, walkIdx+1); renderWalk(); }
    else if (e.key === 'ArrowLeft'){ walkIdx = Math.max(0, walkIdx-1); renderWalk(); }
    else if (e.key === 'ArrowUp'){
      const t = TICKS_SORTED[walkIdx];
      if (t) location.hash = '#/hunt/' + t.id;
    }
  }
});

/* ========== random button ========== */
function bindRandom(){
  const fire = () => { const t = TICKS[Math.floor(Math.random()*TICKS.length)]; location.hash = '#/walk/' + t.id; };
  document.getElementById('randomBtn').onclick = fire;
  document.getElementById('randomBtnMobile').onclick = fire;
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

/* ========== boot ========== */
loadData().then(() => {
  bindRandom(); bindMobileMenu(); bindTheme(); bindScrollHeader();
  render();
}).catch(err => {
  app.innerHTML = `<div style='padding:48px;font-family:var(--mono);color:var(--muted)'>Failed to load ticks: ${escapeHtml(err.message)}</div>`;
});
