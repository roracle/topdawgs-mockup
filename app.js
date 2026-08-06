/* ==========================================================================
   TopDawgs — Application Logic (prototype)
   Everything here runs client-side, in memory, for demo purposes.
   No network calls, no persistence — refreshing resets state by design.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Mock data
   * ------------------------------------------------------------------ */

  const USERS = {
    marcus: { name: 'Marcus', handle: '@AlphaMarcus', emoji: '🧔', dist: '0.4 mi', age: 34, height: "5'11\"", weight: '182 lb', position: 'Vers', size: '6.5 in', nsfw: false, score: 4.2, rank: 'Pack Dawg', bio: "Gym in the morning, grill in the evening. Down for hikes, bad movies, and good chili. Not big on small talk over text — let's just meet up.", sti: 'Negative · tested 22 days ago', showSti: true },
    jax: { name: 'Jax', handle: '@RidgebackJax', emoji: '🐕', dist: '0.9 mi', age: 29, height: "6'1\"", weight: '195 lb', position: 'Top', size: '7 in', nsfw: true, score: 3.6, rank: 'Alpha', bio: 'New in town. Into leather nights, long drives, and my dog. NSFW mode on — say hi if yours is too.', sti: 'Negative · tested 5 days ago', showSti: true },
    theo: { name: 'Theo', handle: '@TheoBearcub', emoji: '🐻', dist: '1.2 mi', age: 41, height: "5'9\"", weight: '210 lb', position: 'Bottom', size: 'Prefer not to say', nsfw: false, score: 4.8, rank: 'Pack Dawg', bio: 'Chapter organizer. I host the Sunday cookout and run the trivia night at The Kennel. Ask me about Havens.', sti: 'Negative · tested 3 days ago', showSti: false },
    finn: { name: 'Finn', handle: '@FoxholeFinn', emoji: '🦊', dist: '2.1 mi', age: 26, height: "5'8\"", weight: '160 lb', position: 'Vers-bottom', size: '5.5 in', nsfw: false, score: 2.9, rank: 'Mutt', bio: 'New to the app, still figuring out the vibe. Into board games and bad karaoke.', sti: 'Not shared', showSti: false },
    rex: { name: 'Rex', handle: '@RexTheRottie', emoji: '🐕‍🦺', dist: '3.4 mi', age: 37, height: "6'3\"", weight: '225 lb', position: 'Top', size: '8 in', nsfw: true, score: 4.95, rank: 'Alpha', bio: 'Big guy, bigger heart. NSFW on, DMs open, incognito when I need a break. Chapter safety volunteer.', sti: 'Negative · tested 11 days ago', showSti: true },
  };

  const FILTER_MAP = {
    people: ['marcus', 'jax', 'theo', 'finn', 'rex'],
    havens: [],
    events: [],
    restaurants: [],
    gyms: [],
    other: [],
  };

  const NOTIFICATIONS = [
    { t: 'Jax sent you a flirt 😉', d: 'Tap to view their profile', time: '2m ago', unread: true },
    { t: 'Chapter Chat', d: 'Theo: Count me in, bringing Finn too.', time: '11m ago', unread: true },
    { t: 'Event reminder', d: 'Sunday Cookout starts in 3 hours', time: '1h ago', unread: false },
    { t: 'Marcus viewed your profile', d: 'Incognito was off for this visit', time: '3h ago', unread: false },
    { t: 'Checklist', d: 'Your PrEP refill reminder is due in 3 days', time: '1d ago', unread: false },
  ];

  const THREADS = [
    { id: 'marcus', last: "Yeah sounds good! Meet at 6.", time: '2m', unread: true },
    { id: 'jax', last: 'Sent a flirt 😉', time: '9m', unread: true },
    { id: 'theo', last: "I'll add you to the Havens list.", time: '1h', unread: false },
    { id: 'rex', last: 'Stay safe out there tonight.', time: '5h', unread: false },
  ];

  const WALL_POSTS = [
    { user: 'Theo', emoji: '🐻', time: '38m ago', text: 'Sunday Cookout is back on for this weekend — bring a side dish, I got the grill covered. 🐾', likes: 24 },
    { user: 'Finn', emoji: '🦊', time: '2h ago', text: 'First chapter meetup tonight, nervous but excited to finally put faces to handles.', likes: 41 },
    { user: 'Rex', emoji: '🐕‍🦺', time: '5h ago', text: 'Reminder: chapter safety volunteers are at every big event wearing the teal armband. Come find us if you need anything.', likes: 63 },
  ];

  const EVENTS = [
    { name: 'Sunday Chapter Cookout', emoji: '🍖', when: 'Sun · 2:00 PM', where: "Theo's Haven, Port Arthur", going: 18, tag: 'SFW' },
    { name: 'Trivia Night @ The Kennel', emoji: '🎯', when: 'Wed · 8:00 PM', where: 'The Kennel Bar', going: 9, tag: 'SFW' },
    { name: 'Leather & Lace Mixer', emoji: '🖤', when: 'Fri · 10:00 PM', where: 'Private Haven — address on RSVP', going: 22, tag: 'NSFW' },
  ];

  const HAVENS = [
    { name: "Theo's Den", emoji: '🏡', desc: 'Weekly cookouts, open door Sundays.', members: 46 },
    { name: 'The Quiet Room', emoji: '🕯️', desc: 'Sober, low-key hangout space. No hookup pressure.', members: 31 },
    { name: 'Rex\'s Yard', emoji: '🛖', desc: 'NSFW-tagged. 18+ verified only, consent-first events.', members: 58 },
  ];

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */

  const state = {
    tab: 'community',
    sub: { community: 'map', pack: 'messages', body: 'nutrition', mind: 'checklist' },
    toggles: {
      nsfw: false,          // rank-gated
      allowDMs: true,
      allowFlirts: true,
      incognito: false,
      ctxNotif: true,
      stiPublic: false,
    },
    rank: 'Pack Dawg',      // Mutt | Pack Dawg | Alpha — gates NSFW toggle
    packPoints: 128.45,
    integrityScore: 4.10,
    radius: 2,
    mapFilter: 'people',
    unreadNotifs: NOTIFICATIONS.filter(n => n.unread).length,
    blocked: [{ handle: '@TrollUser99' }, { handle: '@SpamBot12' }],
    chatCount: 0,
    chatCooldownUntil: 0,
    cooldownTimer: null,
    vaultUnlocked: false,
    vaultPinBuffer: '',
    activeFlirtTarget: null,
    activeBlockTarget: null,
    activePhoto: null,
  };

  const SUBSECTIONS = {
    community: [{ id: 'map', label: 'Map', icon: '🗺️' }, { id: 'list', label: 'Nearby List', icon: '📋' }],
    pack: [
      { id: 'messages', label: 'Messages', icon: '✉️' },
      { id: 'chat', label: 'Chat', icon: '💬' },
      { id: 'wall', label: 'Wall', icon: '📌' },
      { id: 'events', label: 'Events', icon: '🎟️' },
      { id: 'havens', label: 'Havens', icon: '🏡' },
    ],
    body: [{ id: 'nutrition', label: 'Nutrition', icon: '🥗' }, { id: 'exercise', label: 'Exercise', icon: '🏋️' }],
    mind: [
      { id: 'checklist', label: 'Checklist', icon: '✅' },
      { id: 'modules', label: 'Modules', icon: '🎬' },
      { id: 'sounds', label: 'Sounds', icon: '🎧' },
      { id: 'secrets', label: 'Secrets', icon: '🔐' },
    ],
  };

  const CTX_NOTIF_LABEL = {
    community: 'Community Alerts', pack: 'Pack Alerts', body: 'Body Alerts', mind: 'Mind Alerts',
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function toast(msg) {
    const stack = $('#toastStack');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function openOverlay(id) { $('#' + id).classList.add('show'); }
  function closeOverlay(id) { $('#' + id).classList.remove('show'); }
  function closeAllDropdowns() {
    ['overlayProfileMenu', 'overlayNotif', 'overlaySubsection'].forEach(closeOverlay);
  }

  function scoreColor(score) {
    if (score < 1) return 'var(--score-0)';
    if (score < 2) return 'var(--score-1)';
    if (score < 3) return 'var(--score-2)';
    if (score < 4) return 'var(--score-3)';
    if (score < 4.5) return 'var(--score-4)';
    return 'var(--score-5)';
  }

  /* ------------------------------------------------------------------ *
   * Tab / subsection routing
   * ------------------------------------------------------------------ */

  function setTab(tab) {
    state.tab = tab;
    $$('.tab-view').forEach(v => v.classList.toggle('active', v.dataset.tab === tab));
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    setSub(tab, state.sub[tab]);
    $('#ctxNotifLabel').textContent = CTX_NOTIF_LABEL[tab];
  }

  function setSub(tab, sub) {
    state.sub[tab] = sub;
    const view = $(`.tab-view[data-tab="${tab}"]`);
    $$('.subview', view).forEach(v => v.classList.toggle('active', v.dataset.sub === sub));
    const def = SUBSECTIONS[tab].find(s => s.id === sub);
    $('#subsectionLabel').textContent = def ? def.label : sub;
  }

  function renderSubsectionDropdown() {
    const panel = $('#subsectionPanel');
    panel.innerHTML = SUBSECTIONS[state.tab].map(s => `
      <div class="dd-item ${state.sub[state.tab] === s.id ? 'active' : ''}" data-goto="${s.id}">
        <span>${s.icon}</span><span>${s.label}</span>
      </div>`).join('');
    $$('.dd-item', panel).forEach(el => el.addEventListener('click', () => {
      setSub(state.tab, el.dataset.goto);
      closeAllDropdowns();
    }));
  }

  /* ------------------------------------------------------------------ *
   * Toggles (shared across profile menu + settings screen)
   * ------------------------------------------------------------------ */

  function nsfwLocked() { return state.rank === 'Mutt'; }

  function syncToggleButtons() {
    $$('[data-toggle]').forEach(btn => {
      const key = btn.dataset.toggle;
      if (key === 'ctxNotif') {
        btn.classList.toggle('on', state.toggles.ctxNotif);
        return;
      }
      const val = key === 'stiPublic' ? state.toggles.stiPublic : state.toggles[key];
      btn.classList.toggle('on', !!val);
      if (key === 'nsfw') btn.classList.toggle('locked', nsfwLocked());
    });
    $('#presenceDot').classList.toggle('incog', state.toggles.incognito);
    $('#radiusValLabel').textContent = state.radius + ' mi';
    $('#radiusValLabel2').textContent = state.radius + ' mi';
    $('#radiusReadout').textContent = state.radius + ' mi';
    $('#radiusReadout2').textContent = state.radius + ' mi';
    $('#radiusSlider').value = state.radius;
    $('#radiusSlider2').value = state.radius;
    $('#switchEyesOnly').classList.toggle('on', state.toggles.nsfw);
  }

  function handleToggleClick(btn) {
    const key = btn.dataset.toggle;
    if (key === 'nsfw') {
      if (nsfwLocked()) {
        toast('🔒 Global NSFW is locked until you reach Pack Dawg rank.');
        return;
      }
      state.toggles.nsfw = !state.toggles.nsfw;
      toast(state.toggles.nsfw ? '🔥 Global NSFW is now ON' : 'Global NSFW is now OFF');
    } else if (key === 'stiPublic') {
      state.toggles.stiPublic = !state.toggles.stiPublic;
      toast(state.toggles.stiPublic ? 'STI/STD results are now visible on your profile' : 'STI/STD results are now private');
    } else if (key === 'ctxNotif') {
      state.toggles.ctxNotif = !state.toggles.ctxNotif;
    } else {
      state.toggles[key] = !state.toggles[key];
    }
    syncToggleButtons();
    renderMapPins();
  }

  /* ------------------------------------------------------------------ *
   * Community map + nearby lists
   * ------------------------------------------------------------------ */

  function renderMapPins() {
    $$('.map-pin[data-user]').forEach(pin => {
      const u = USERS[pin.dataset.user];
      const visible = state.mapFilter === 'people' && (!u.nsfw || state.toggles.nsfw);
      pin.style.display = visible ? '' : 'none';
    });
  }

  function nearbyCardHTML(id) {
    const u = USERS[id];
    return `
      <div class="card row" data-open-profile="${id}">
        <div class="avatar ring-cyan">${u.emoji}${u.nsfw ? '<span class="headspace">😈</span>' : '<span class="headspace">👼</span>'}</div>
        <div class="grow">
          <div class="row-between"><span class="name-line">${u.name}</span><span class="pill pill-cyan">${u.score.toFixed(2)}</span></div>
          <div class="meta-line">${u.handle} · ${u.dist} · ${u.rank}</div>
        </div>
      </div>`;
  }

  function renderNearby() {
    const visible = FILTER_MAP.people.filter(id => !USERS[id].nsfw || state.toggles.nsfw);
    $('#nearbyList').innerHTML = visible.slice(0, 3).map(nearbyCardHTML).join('') || emptyState('No one matches your current filters.');
    $('#nearbyListFull').innerHTML = visible.map(nearbyCardHTML).join('') || emptyState('No one matches your current filters.');
    $$('[data-open-profile]').forEach(el => el.addEventListener('click', () => openProfile(el.dataset.openProfile)));
  }

  function emptyState(msg) {
    return `<div class="empty-state"><span class="ic">🌙</span>${msg}</div>`;
  }

  /* ------------------------------------------------------------------ *
   * Pack: threads, wall, events, havens
   * ------------------------------------------------------------------ */

  function renderThreads() {
    $('#threadList').innerHTML = `<div class="thread-list">` + THREADS.map(t => {
      const u = USERS[t.id];
      return `
      <div class="thread-item row" data-open-profile="${t.id}">
        <div class="avatar sm ring-cyan">${u.emoji}</div>
        <div class="grow">
          <div class="row-between"><span class="name-line">${u.name} <span style="font-size:11px;">${u.nsfw ? '😈' : '👼'}</span></span><span class="meta-line">${t.time}</span></div>
          <div class="meta-line" style="color:${t.unread ? 'var(--ink)' : 'var(--ink-dim)'}">${t.last}</div>
        </div>
        ${t.unread ? '<span class="unread-dot"></span>' : ''}
      </div>`;
    }).join('') + `</div>`;
    $$('#threadList [data-open-profile]').forEach(el => el.addEventListener('click', () => openProfile(el.dataset.openProfile)));
  }

  function renderWall() {
    $('#wallList').innerHTML = WALL_POSTS.map(p => `
      <div class="card">
        <div class="row" style="margin-bottom:8px;">
          <div class="avatar sm">${p.emoji}</div>
          <div class="grow"><div class="name-line">${p.user}</div><div class="meta-line">${p.time}</div></div>
        </div>
        <p style="font-size:13px; line-height:1.5; margin:0 0 8px;">${p.text}</p>
        <div class="row" style="gap:16px; font-size:12px; color:var(--ink-dim);"><span>❤️ ${p.likes}</span><span>💬 Reply</span><span>↗️ Share</span></div>
      </div>`).join('');
  }

  function renderEvents() {
    $('#eventsList').innerHTML = EVENTS.map(e => `
      <div class="card" style="padding:0; overflow:hidden;">
        <div class="event-banner">${e.emoji}</div>
        <div class="event-body">
          <div class="row-between"><span class="name-line">${e.name}</span><span class="pill ${e.tag === 'NSFW' ? 'pill-purple' : 'pill-green'}">${e.tag}</span></div>
          <div class="meta-line" style="margin-top:4px;">${e.when} · ${e.where}</div>
          <div class="row-between" style="margin-top:10px;">
            <span class="meta-line">🐾 ${e.going} going</span>
            <button class="btn btn-primary btn-sm">RSVP</button>
          </div>
        </div>
      </div>`).join('');
  }

  function renderHavens() {
    $('#havensList').innerHTML = HAVENS.map(h => `
      <div class="card row">
        <div class="avatar" style="font-size:26px;">${h.emoji}</div>
        <div class="grow">
          <div class="name-line">${h.name}</div>
          <div class="meta-line">${h.desc}</div>
          <div class="meta-line" style="margin-top:2px;">🐾 ${h.members} members</div>
        </div>
      </div>`).join('');
  }

  /* ------------------------------------------------------------------ *
   * Chat + anti-spam cooldown
   * ------------------------------------------------------------------ */

  function sendChat() {
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) return;
    if (Date.now() < state.chatCooldownUntil) return;

    const log = $('#chatLog');
    const bubble = document.createElement('div');
    bubble.className = 'bubble out';
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    input.value = '';

    state.chatCount += 1;
    if (state.chatCount >= 3) {
      startCooldown(30);
      state.chatCount = 0;
    }
  }

  function startCooldown(seconds) {
    state.chatCooldownUntil = Date.now() + seconds * 1000;
    const banner = $('#cooldownBanner');
    const secSpan = $('#cooldownSeconds');
    const sendBtn = $('#chatSend');
    const input = $('#chatInput');
    banner.classList.remove('hidden');
    sendBtn.classList.add('disabled');
    input.placeholder = 'Cooldown active…';
    clearInterval(state.cooldownTimer);
    let remaining = seconds;
    secSpan.textContent = remaining;
    state.cooldownTimer = setInterval(() => {
      remaining -= 1;
      secSpan.textContent = Math.max(remaining, 0);
      if (remaining <= 0) {
        clearInterval(state.cooldownTimer);
        banner.classList.add('hidden');
        sendBtn.classList.remove('disabled');
        input.placeholder = 'Message the chapter…';
      }
    }, 1000);
  }

  /* ------------------------------------------------------------------ *
   * Profile sheet (self or other)
   * ------------------------------------------------------------------ */

  function integrityBarHTML(score) {
    const pct = Math.min(100, (score / 5) * 100);
    return `
      <div class="integrity-wrap">
        <div class="integrity-label-row">
          <span class="tag">Integrity Score</span>
          <span class="integrity-score" style="color:${scoreColor(score)}">${score.toFixed(2)}</span>
        </div>
        <div class="integrity-track"><div class="integrity-fill" style="width:${pct}%"></div></div>
        <div class="integrity-scale"><span>0.00</span><span>2.50</span><span>5.00</span></div>
      </div>`;
  }

  function statsMatrixHTML(u, bothNsfw) {
    const base = [
      { v: u.age, l: 'Age' }, { v: u.height, l: 'Height' }, { v: u.weight, l: 'Weight' },
    ];
    const adult = [{ v: u.position, l: 'Position' }, { v: u.size, l: 'Size' }];
    const rows = bothNsfw ? base.concat(adult) : base;
    return `<div class="stats-matrix ${bothNsfw ? '' : ''}" style="grid-template-columns:repeat(${bothNsfw ? 3 : 3},1fr);">` +
      rows.map(r => `<div class="stat-box"><div class="val">${r.v}</div><div class="lab">${r.l}</div></div>`).join('') +
      (bothNsfw ? '' : `<div class="stat-box locked"><div class="val">—</div><div class="lab">Position</div></div><div class="stat-box locked"><div class="val">—</div><div class="lab">Size</div></div>`) +
      `</div>`;
  }

  function galleryHTML(seed, isSelf) {
    const photos = ['🏔️', '🐕', '🍺', '🏋️', '🌅'];
    let tiles = photos.map((p, i) => `<div class="gallery-tile" data-photo="${seed}-${i}" data-emoji="${p}">${p}</div>`).join('');
    if (isSelf) tiles += `<div class="gallery-tile add" id="btnAddPhoto">+</div>`;
    return `<div class="gallery-grid">${tiles}</div>`;
  }

  function openProfile(userId) {
    closeAllDropdowns();
    const u = USERS[userId];
    const bothNsfw = state.toggles.nsfw && u.nsfw;
    const sheet = $('#profileSheet');
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="text-center" style="padding-top:4px;">
        <div class="avatar xl ring-cyan" style="margin:0 auto 10px;">${u.emoji}</div>
        <div class="screen-title mt-0" style="margin-bottom:2px;">${u.name} <span style="font-size:15px;">${u.nsfw ? '😈' : '👼'}</span></div>
        <div class="meta-line">${u.handle} · ${u.dist} · <span class="rank-badge">${u.rank}</span></div>
      </div>
      ${integrityBarHTML(u.score)}
      <div class="action-bar">
        <button data-act="chat"><span class="ic">💬</span>Chat</button>
        <button data-act="flirt"><span class="ic">😉</span>Flirt</button>
        <button data-act="note"><span class="ic">🗒️</span>Note</button>
        <button data-act="block" class="danger"><span class="ic">🚫</span>Block</button>
      </div>
      ${statsMatrixHTML(u, bothNsfw)}
      <div class="section-label">About</div>
      <div class="bio-box">${u.bio}</div>
      <div class="section-label">Health</div>
      <div class="card row-between card-tight">
        <div>
          <div class="setting-title">STI/STD status</div>
          <div class="setting-desc">${u.showSti ? u.sti : 'Not shared on this profile'}</div>
        </div>
        <span class="pill ${u.showSti ? 'pill-green' : 'pill-ghost'}">${u.showSti ? 'Shared' : 'Private'}</span>
      </div>
      <div class="section-label">Gallery</div>
      ${galleryHTML(userId, false)}
    `;
    $$('[data-act]', sheet).forEach(btn => btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'chat') { closeOverlay('overlayProfile'); setTab('pack'); setSub('pack', 'messages'); toast(`Opening chat with ${u.name}`); }
      if (act === 'flirt') openFlirt(userId);
      if (act === 'note') toast(`Private note saved for ${u.name}`);
      if (act === 'block') openBlock(userId);
    }));
    $$('.gallery-tile[data-photo]', sheet).forEach(t => t.addEventListener('click', () => openPhoto(t.dataset.emoji)));
    openOverlay('overlayProfile');
  }

  function openSelfProfile() {
    closeAllDropdowns();
    const sheet = $('#profileSheet');
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="text-center" style="padding-top:4px;">
        <div class="avatar xl ring-cyan" style="margin:0 auto 10px;">🐺</div>
        <div class="screen-title mt-0" style="margin-bottom:2px;">You</div>
        <div class="meta-line">@YourHandle · <span class="rank-badge">🐾 ${state.rank}</span> · ${state.packPoints.toFixed(2)} pts</div>
      </div>
      ${integrityBarHTML(state.integrityScore)}
      <div class="action-bar">
        <button id="btnEditBio"><span class="ic">✏️</span>Edit Bio</button>
        <button id="btnOpenCameraFromProfile"><span class="ic">📷</span>Add Photo</button>
        <button id="btnShareProfile"><span class="ic">↗️</span>Share</button>
        <button id="btnGoSettings"><span class="ic">⚙️</span>Settings</button>
      </div>
      ${statsMatrixHTML({ age: 31, height: "5'10\"", weight: '175 lb', position: 'Vers', size: '6 in' }, state.toggles.nsfw)}
      <div class="section-label">About</div>
      <div class="bio-box" id="selfBio" contenteditable="true">Building the Port Arthur chapter one cookout at a time. Gym rat, dog dad, always down for trivia night. Ask me about the Sunday Haven.</div>
      <div class="section-label">Health</div>
      <div class="card row-between card-tight">
        <div><div class="setting-title">STI/STD status</div><div class="setting-desc">Negative · tested 22 days ago</div></div>
        <button class="switch" data-toggle="stiPublic"></button>
      </div>
      <div class="section-label">Gallery</div>
      ${galleryHTML('self', true)}
    `;
    $('#btnEditBio', sheet)?.addEventListener('click', () => { $('#selfBio').focus(); toast('Tap the bio text to edit — 500 char max'); });
    $('#btnOpenCameraFromProfile', sheet)?.addEventListener('click', () => openOverlay('overlayCamera'));
    $('#btnShareProfile', sheet)?.addEventListener('click', () => toast('Profile link copied'));
    $('#btnGoSettings', sheet)?.addEventListener('click', () => { closeOverlay('overlayProfile'); openOverlay('overlaySettings'); });
    $('#btnAddPhoto', sheet)?.addEventListener('click', () => openOverlay('overlayCamera'));
    $$('.gallery-tile[data-photo]', sheet).forEach(t => t.addEventListener('click', () => openPhoto(t.dataset.emoji)));
    syncToggleButtons();
    openOverlay('overlayProfile');
  }

  /* ------------------------------------------------------------------ *
   * Flirt selector
   * ------------------------------------------------------------------ */

  function openFlirt(userId) {
    state.activeFlirtTarget = userId;
    const u = USERS[userId];
    const unlocked = state.toggles.nsfw && u.nsfw;
    $$('#flirtTier2 .flirt-emoji').forEach(b => b.classList.toggle('flirt-locked', !unlocked));
    $('#flirtLockedNote').classList.toggle('hidden', unlocked);
    openOverlay('overlayFlirt');
  }

  /* ------------------------------------------------------------------ *
   * Slide-to-confirm block
   * ------------------------------------------------------------------ */

  function openBlock(userId) {
    state.activeBlockTarget = userId;
    $('#blockUserName').textContent = USERS[userId] ? USERS[userId].handle : 'this user';
    resetSlide();
    openOverlay('overlayBlock');
  }

  function resetSlide() {
    $('#slideFill').style.width = '0%';
    $('#slideThumb').style.left = '3px';
    $('#slideThumb').classList.remove('confirmed');
    $('#slideThumb').textContent = '➜';
    $('#slideLabel').textContent = 'Slide to confirm block';
  }

  function initSlideToConfirm() {
    const track = $('#slideTrack');
    const thumb = $('#slideThumb');
    const fill = $('#slideFill');
    let dragging = false;
    let trackWidth = 0;
    let maxX = 0;

    function pointerX(e) { return (e.touches ? e.touches[0].clientX : e.clientX); }

    function start(e) {
      dragging = true;
      trackWidth = track.clientWidth;
      maxX = trackWidth - thumb.clientWidth - 6;
      thumb.style.cursor = 'grabbing';
    }
    function move(e) {
      if (!dragging) return;
      const rect = track.getBoundingClientRect();
      let x = pointerX(e) - rect.left - thumb.clientWidth / 2;
      x = Math.max(3, Math.min(x, maxX));
      thumb.style.left = x + 'px';
      fill.style.width = (x + thumb.clientWidth) + 'px';
      if (x >= maxX - 2) confirmBlock();
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      thumb.style.cursor = 'grab';
      const left = parseFloat(thumb.style.left || '3');
      if (left < maxX - 2) resetSlide();
    }

    thumb.addEventListener('mousedown', start);
    thumb.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  }

  function confirmBlock() {
    $('#slideThumb').classList.add('confirmed');
    $('#slideThumb').textContent = '✓';
    $('#slideLabel').textContent = 'Blocked';
    const u = USERS[state.activeBlockTarget];
    setTimeout(() => {
      closeOverlay('overlayBlock');
      closeOverlay('overlayProfile');
      toast(`${u ? u.handle : 'User'} has been blocked`);
    }, 500);
  }

  /* ------------------------------------------------------------------ *
   * Photo inspection + camera simulator
   * ------------------------------------------------------------------ */

  function openPhoto(emoji) {
    $('#photoViewEmoji').textContent = emoji;
    const days = Math.floor(Math.random() * 40) + 1;
    const d = new Date(Date.now() - days * 86400000);
    $('#photoTimestamp').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    openOverlay('overlayPhoto');
  }

  function takePhoto() {
    state.packPoints += 0.01;
    toast(`📸 Photo added — Pack Points +0.01 (now ${state.packPoints.toFixed(2)})`);
    closeOverlay('overlayCamera');
  }

  /* ------------------------------------------------------------------ *
   * Notifications
   * ------------------------------------------------------------------ */

  function renderNotifications() {
    $('#notifDrawerPanel').innerHTML = NOTIFICATIONS.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        <div class="t">${n.t}</div>
        <div class="d">${n.d}</div>
        <div class="time">${n.time}</div>
      </div>`).join('');
  }

  function markAllRead() {
    NOTIFICATIONS.forEach(n => n.unread = false);
    state.unreadNotifs = 0;
    $('#notifDot').style.display = 'none';
    renderNotifications();
  }

  /* ------------------------------------------------------------------ *
   * Blocked users (settings)
   * ------------------------------------------------------------------ */

  function renderBlockedUsers() {
    const card = $('#blockedUsersCard');
    if (!state.blocked.length) { card.innerHTML = emptyState('No blocked users.'); return; }
    card.innerHTML = state.blocked.map((b, i) => `
      <div class="row-between" style="padding:8px 0; ${i < state.blocked.length - 1 ? 'border-bottom:1px solid var(--hairline);' : ''}">
        <span style="color:var(--ink);">${b.handle}</span>
        <button class="pill pill-green" data-unblock="${i}" style="cursor:pointer;">Unblock</button>
      </div>`).join('');
    $$('[data-unblock]', card).forEach(btn => btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.unblock);
      const removed = state.blocked.splice(idx, 1)[0];
      renderBlockedUsers();
      toast(`${removed.handle} unblocked`);
    }));
  }

  /* ------------------------------------------------------------------ *
   * Secrets Vault (PIN lock)
   * ------------------------------------------------------------------ */

  const VAULT_PIN = '1234';

  function renderPinDots() {
    $$('#pinDots span').forEach((dot, i) => dot.classList.toggle('filled', i < state.vaultPinBuffer.length));
  }

  function handlePinPress(val) {
    if (val === 'del') { state.vaultPinBuffer = state.vaultPinBuffer.slice(0, -1); renderPinDots(); return; }
    if (val === 'ok') {
      if (state.vaultPinBuffer === VAULT_PIN) unlockVault();
      else { toast('Incorrect PIN'); state.vaultPinBuffer = ''; renderPinDots(); }
      return;
    }
    if (state.vaultPinBuffer.length < 4) state.vaultPinBuffer += val;
    renderPinDots();
    if (state.vaultPinBuffer.length === 4) {
      if (state.vaultPinBuffer === VAULT_PIN) unlockVault();
      else setTimeout(() => { toast('Incorrect PIN'); state.vaultPinBuffer = ''; renderPinDots(); }, 150);
    }
  }

  function unlockVault() {
    state.vaultUnlocked = true;
    state.vaultPinBuffer = '';
    $('#vaultLockScreen').classList.add('hidden');
    $('#vaultUnlocked').classList.remove('hidden');
    toast('🔓 Vault unlocked');
  }

  function lockVault() {
    state.vaultUnlocked = false;
    $('#vaultUnlocked').classList.add('hidden');
    $('#vaultLockScreen').classList.remove('hidden');
    renderPinDots();
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */

  function wireNav() {
    $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  }

  function wireHeader() {
    $('#btnProfileMenu').addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !$('#overlayProfileMenu').classList.contains('show');
      closeAllDropdowns();
      if (opening) openOverlay('overlayProfileMenu');
    });
    $('#btnBell').addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !$('#overlayNotif').classList.contains('show');
      closeAllDropdowns();
      if (opening) { openOverlay('overlayNotif'); markAllRead(); }
    });
    $('#btnShop').addEventListener('click', () => toast('🛍️ Shop coming soon'));
    $('#btnCreate').addEventListener('click', () => openOverlay('overlayCreate'));
    $('#btnSubsection').addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = !$('#overlaySubsection').classList.contains('show');
      closeAllDropdowns();
      if (opening) { renderSubsectionDropdown(); openOverlay('overlaySubsection'); }
    });
  }

  function wireOverlaysGeneric() {
    // click outside dropdown content closes it
    $$('.overlay').forEach(ov => ov.addEventListener('click', (e) => {
      if (e.target === ov) {
        ov.classList.remove('show');
      }
    }));
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeOverlay(btn.dataset.close)));
  }

  function wireMenus() {
    $('#menuMyProfile').addEventListener('click', () => { closeAllDropdowns(); openSelfProfile(); });
    $('#menuSettings').addEventListener('click', () => { closeAllDropdowns(); openOverlay('overlaySettings'); renderBlockedUsers(); syncToggleButtons(); });
    $('#btnGoSettings')?.addEventListener('click', () => openOverlay('overlaySettings'));
    $$('[data-toggle]').forEach(btn => btn.addEventListener('click', () => handleToggleClick(btn)));
    ['radiusSlider', 'radiusSlider2'].forEach(id => {
      $('#' + id).addEventListener('input', (e) => {
        state.radius = parseFloat(e.target.value);
        syncToggleButtons();
      });
    });
    $('#btnLogout').addEventListener('click', () => toast('This is a prototype — logout is simulated 🐾'));
  }

  function wireMapFilters() {
    $$('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
      $$('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.mapFilter = chip.dataset.filter;
      renderMapPins();
      if (state.mapFilter !== 'people') toast(`${chip.textContent.trim()} pins coming soon in the full build`);
    }));
    $$('.map-pin[data-user]').forEach(pin => pin.addEventListener('click', () => openProfile(pin.dataset.user)));
  }

  function wireCreate() {
    $('#createPost').addEventListener('click', () => { closeOverlay('overlayCreate'); setTab('pack'); setSub('pack', 'wall'); toast('Draft a new Wall post'); });
    $('#createEvent').addEventListener('click', () => { closeOverlay('overlayCreate'); setTab('pack'); setSub('pack', 'events'); toast('Draft a new Event'); });
    $('#createSecret').addEventListener('click', () => { closeOverlay('overlayCreate'); setTab('mind'); setSub('mind', 'secrets'); toast('Add to your Secrets Vault'); });
  }

  function wireFlirt() {
    $$('.flirt-emoji').forEach(btn => btn.addEventListener('click', () => {
      if (btn.classList.contains('flirt-locked')) { toast('🔒 Both of you need NSFW mode on to unlock Tier 2'); return; }
      const u = USERS[state.activeFlirtTarget];
      toast(`Sent ${btn.dataset.flirt} to ${u ? u.name : 'them'}`);
      closeOverlay('overlayFlirt');
    }));
  }

  function wireChecklist() {
    $$('.check-box').forEach(box => box.addEventListener('click', () => {
      box.classList.toggle('checked');
      box.textContent = box.classList.contains('checked') ? '✓' : '';
    }));
  }

  function wireSounds() {
    $$('[data-sound-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const wave = btn.previousElementSibling.previousElementSibling || btn.parentElement.querySelector('.wave');
      const item = btn.closest('.sound-item');
      const w = item.querySelector('.wave');
      const playing = !w.classList.contains('paused');
      if (playing) { w.classList.add('paused'); btn.textContent = '▶️'; }
      else {
        $$('.sound-item .wave').forEach(x => { x.classList.add('paused'); });
        $$('.sound-item [data-sound-toggle]').forEach(b => b.textContent = '▶️');
        w.classList.remove('paused');
        btn.textContent = '⏸️';
      }
    }));
  }

  function wireVault() {
    $$('#pinPad button').forEach(btn => btn.addEventListener('click', () => handlePinPress(btn.dataset.num)));
    $('#btnLockVault').addEventListener('click', lockVault);
    $('#btnVaultAdd').addEventListener('click', () => openOverlay('overlayCamera'));
  }

  function wireCamera() {
    $('#btnShutter').addEventListener('click', takePhoto);
  }

  function wireChat() {
    $('#chatSend').addEventListener('click', sendChat);
    $('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
  }

  function wireBodyButtons() {
    $('#btnAddMeal')?.addEventListener('click', () => toast('🥗 Meal logged'));
    $('#btnAddWorkout')?.addEventListener('click', () => toast('🏋️ Session logged'));
  }

  function tickClock() {
    const el = $('#clock');
    if (!el) return;
    const now = new Date();
    let h = now.getHours() % 12; if (h === 0) h = 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */

  function init() {
    wireNav();
    wireHeader();
    wireOverlaysGeneric();
    wireMenus();
    wireMapFilters();
    wireCreate();
    wireFlirt();
    wireChecklist();
    wireSounds();
    wireVault();
    wireCamera();
    wireChat();
    wireBodyButtons();
    initSlideToConfirm();

    setTab('community');
    renderNearby();
    renderThreads();
    renderWall();
    renderEvents();
    renderHavens();
    renderNotifications();
    renderBlockedUsers();
    renderPinDots();
    syncToggleButtons();
    renderMapPins();

    tickClock();
    setInterval(tickClock, 15000);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
