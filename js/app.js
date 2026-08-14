/* ============================================================
   TOPDAWGS — APP CORE
   Vanilla JS SPA. State lives in `STATE`, persisted to
   localStorage so a refresh keeps you logged in and keeps your
   toggles. Everything renders through renderApp().

   Navigation model: STATE.route = {section, subsection, overlay}
   with a real history stack (STATE.history) wired to the browser
   Back button via popstate, so hardware back works on Android
   once this is wrapped in Capacitor.
   ============================================================ */

const STORE_KEY = 'topdawgs_state_v2';

var STATE = {
  loggedIn: false,
  user: null,
  notifications: [],
  route: { section: 'community', subsection: null, overlay: null },
  history: [],
  mapFilters: { people: true, havens: true, events: true, restaurants: false, gyms: false, other: false },
  chatCooldownUntil: 0,
  chatStreak: 0,
  dropdownOpen: null,   // 'user' | 'filter' | 'subsection' | 'bell' | null
  shopTab: 'Themes',
  modal: null,          // {type, payload}
};

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      STATE = { ...STATE, ...saved, dropdownOpen: null, modal: null };
      if (!STATE.route) STATE.route = { section: 'community', subsection: null, overlay: null };
      if (!Array.isArray(STATE.history)) STATE.history = [];
    } catch (e) { /* corrupt state — fall back to defaults */ }
  }
}
function saveState() {
  const { dropdownOpen, modal, ...persist } = STATE;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(persist)); } catch (e) {}
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function findUser(id) { return MOCK_USERS.find(u => u.id === id); }
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ================================================================
   NAVIGATION — route + history stack
   ================================================================ */
function sameRoute(a, b) {
  return a.section === b.section && a.subsection === b.subsection &&
    JSON.stringify(a.overlay || null) === JSON.stringify(b.overlay || null);
}
function defaultSubsection(sectionId) {
  const sec = SECTIONS.find(s => s.id === sectionId);
  return sec && sec.hasSubsections ? sec.subsections[0].id : null;
}
function navigate(patch, opts) {
  opts = opts || {};
  const next = { ...STATE.route, ...patch };
  if (sameRoute(next, STATE.route)) { STATE.dropdownOpen = null; renderApp(); return; }
  if (!opts.replace) STATE.history.push({ ...STATE.route });
  if (STATE.history.length > 40) STATE.history.shift();
  STATE.route = next;
  STATE.dropdownOpen = null;
  saveState();
  renderApp();
}
function goBack() {
  if (STATE.modal) { closeModal(); return true; }
  if (STATE.dropdownOpen) { STATE.dropdownOpen = null; renderApp(); return true; }
  if (STATE.history.length) {
    STATE.route = STATE.history.pop();
    saveState();
    renderApp();
    return true;
  }
  return false;
}
function canGoBack() { return STATE.history.length > 0; }

function goSection(sectionId, subsectionId) {
  navigate({
    section: sectionId,
    subsection: subsectionId !== undefined ? subsectionId : defaultSubsection(sectionId),
    overlay: null,
  });
}
function goSubsection(id) { navigate({ subsection: id, overlay: null }); }
function viewProfile(userId) { navigate({ overlay: { type: 'profile', userId: userId || null } }); }
function openDM(userId) { navigate({ section: 'pack', subsection: 'messages', overlay: { type: 'dm', userId: userId } }); }
function closeOverlay() { if (!goBack()) navigate({ overlay: null }); }

/* ---------------- Login / Logout ---------------- */
function doLogin(asMutt) {
  const input = document.getElementById('login-username');
  const handle = (input && input.value.trim()) || 'AlphaDawg';
  STATE.loggedIn = true;
  if (!STATE.user) STATE.user = seedCurrentUser();
  STATE.user.handle = asMutt ? 'NewPup' : handle;
  if (asMutt) {
    STATE.user.mutt = true;
    STATE.user.rank = 'Mutt';
    STATE.user.nsfw = false;
    STATE.user.integrity = 0.8;
    STATE.user.integrityParts = { community: 0.8, pack: 0.9, body: 0.7, mind: 0.8 };
  }
  if (!STATE.notifications || !STATE.notifications.length) STATE.notifications = seedNotifications();
  STATE.route = { section: 'community', subsection: null, overlay: null };
  STATE.history = [];
  saveState();
  renderApp();
  toast(asMutt ? 'Signed in as an unverified Mutt.' : `Welcome back, ${STATE.user.handle}.`);
}
function doLogout() {
  STATE.loggedIn = false;
  STATE.dropdownOpen = null;
  STATE.modal = null;
  STATE.history = [];
  saveState();
  renderApp();
}
function doDeleteAccount() {
  closeModal();
  toast('Account deletion requested — 30-day purge window started.');
  setTimeout(() => {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    STATE.user = null;
    doLogout();
  }, 900);
}

/* ---------------- Modals ---------------- */
function openModal(type, payload) { STATE.modal = { type: type, payload: payload || {} }; STATE.dropdownOpen = null; renderApp(); }
function closeModal() { STATE.modal = null; renderApp(); }

/* ---------------- Notifications ---------------- */
function unreadFor(sectionId) { return STATE.notifications.filter(n => n.section === sectionId && !n.read); }
function sectionHasDot(sectionId) {
  if (STATE.user.notifMode === 'classic') return false;
  return unreadFor(sectionId).length > 0;
}
function jumpToNextNotification(sectionId) {
  const unread = unreadFor(sectionId);
  if (!unread.length) { goSection(sectionId); return; }
  const n = unread[0];
  n.read = true;
  goSection(sectionId, n.subsection || defaultSubsection(sectionId));
  toast(`Jumped to: ${n.text}`);
}
function readNotification(id) {
  const n = STATE.notifications.find(x => x.id === id);
  if (n) { n.read = true; goSection(n.section, n.subsection || defaultSubsection(n.section)); }
}

/* ---------------- Toggles ---------------- */
function toggleUserFlag(flag) {
  if (flag === 'nsfw' && STATE.user.mutt) { toast('Mutts are locked from enabling Global NSFW.'); return; }
  STATE.user[flag] = !STATE.user[flag];
  saveState();
  renderApp();
  if (flag === 'incognito') {
    toast(STATE.user.incognito ? 'Incognito on — your pin left the map.' : 'Incognito off — you\'re back on the map.');
  }
}
function setRadius(v) {
  STATE.user.radius = parseFloat(v);
  const label = document.getElementById('radius-label');
  if (label) label.textContent = STATE.user.radius.toFixed(1) + ' mi blur';
  saveState();
}
function setNotifMode(mode) {
  STATE.user.notifMode = mode;
  saveState();
  renderApp();
  toast(`Notifications set to ${mode[0].toUpperCase() + mode.slice(1)}.`);
}
function toggleMapFilter(id) { STATE.mapFilters[id] = !STATE.mapFilters[id]; saveState(); renderApp(); }
function togglePageNotifs() {
  STATE.user.pageNotifs = STATE.user.pageNotifs === false;
  saveState();
  renderApp();
  toast('Page notification preference saved.');
}

/* ================================================================
   RENDER: SHELL
   ================================================================ */
function renderApp() {
  saveState();
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  if (!STATE.loggedIn) {
    loginScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
    return;
  }
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  renderHeader();
  renderBottomNav();
  renderMain();
  renderDropdown();
  renderModal();
}

/* ---------------- Header ---------------- */
function renderHeader() {
  const r = STATE.route;
  const sec = SECTIONS.find(s => s.id === r.section);
  const showBell = STATE.user.notifMode !== 'modern';
  const showDots = STATE.user.notifMode !== 'classic';
  const unreadCount = STATE.notifications.filter(n => !n.read).length;

  let rightPill = '';
  if (r.overlay) {
    const label = r.overlay.type === 'profile' ? 'Profile' : 'Messages';
    rightPill = `<div class="pill" data-tip="Close ${label}" onclick="closeOverlay()">${label} ${icon('close', 'chev')}</div>`;
  } else if (r.section === 'community') {
    const activeCount = MAP_FILTERS.filter(f => STATE.mapFilters[f.id]).length;
    rightPill = `<div class="pill" id="sub-pill" data-tip="Open Filters" onclick="toggleDropdown('filter')">${icon('pin')} Filters <span class="pill-count">${activeCount}</span> ${icon('chevronDown', 'chev')}</div>`;
  } else if (sec.hasSubsections) {
    const cur = sec.subsections.find(s => s.id === r.subsection) || sec.subsections[0];
    const dot = showDots && unreadFor(sec.id).some(n => n.subsection === r.subsection);
    rightPill = `<div class="pill" id="sub-pill" data-tip="Switch Subsection" onclick="toggleDropdown('subsection')">${cur.label} ${dot ? '<span class="dot-red"></span>' : ''} ${icon('chevronDown', 'chev')}</div>`;
  }

  document.getElementById('app-header').innerHTML = `
    <div class="header-left">
      ${canGoBack() ? `<button class="header-icon-btn" data-tip="Go Back" onclick="goBack()">${icon('back')}</button>` : ''}
      <button class="avatar-btn" data-tip="Open User Menu" onclick="toggleDropdown('user')">
        <span class="avatar-inner">${icon('user')}</span>
      </button>
      <button class="header-icon-btn" data-tip="Open Shop" onclick="openModal('shop')">${icon('shop')}</button>
      ${showBell ? `<button class="header-icon-btn" data-tip="Open Notifications" onclick="toggleDropdown('bell')">${icon('bell')}${unreadCount ? '<span class="dot-red badge-dot"></span>' : ''}</button>` : ''}
    </div>
    <div class="header-right">
      <button class="plus-btn" data-tip="Host Event" onclick="openModal('hostEvent')">${icon('plus')}</button>
      ${rightPill}
    </div>`;

  attachPillSwipe();
}

/* Spec: swiping happens on the pill, so body scrolling is never hijacked. */
function attachPillSwipe() {
  const pill = document.getElementById('sub-pill');
  if (!pill) return;
  const sec = SECTIONS.find(s => s.id === STATE.route.section);
  if (!sec || !sec.hasSubsections) return;
  let startX = null;
  pill.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  pill.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    const ids = sec.subsections.map(s => s.id);
    let i = ids.indexOf(STATE.route.subsection);
    if (i < 0) i = 0;
    goSubsection(ids[(i + (dx < 0 ? 1 : ids.length - 1)) % ids.length]);
  });
}

function toggleDropdown(which) {
  STATE.dropdownOpen = STATE.dropdownOpen === which ? null : which;
  renderApp();
}
function closeDropdownThen(fn) { STATE.dropdownOpen = null; fn(); }

/* ---------------- Dropdown panels ---------------- */
function renderDropdown() {
  let host = document.getElementById('dropdown-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'dropdown-host';
    document.getElementById('app-shell').appendChild(host);
  }
  const open = STATE.dropdownOpen;
  if (!open) { host.innerHTML = ''; return; }

  if (open === 'user') {
    const u = STATE.user;
    host.innerHTML = `
      <div class="dropdown-panel" style="width:266px;">
        <div class="dropdown-title">User menu</div>
        <div class="menu-links">
          <span onclick="closeDropdownThen(function(){viewProfile(null);})">My Profile</span>
          <span onclick="closeDropdownThen(function(){openModal('settings');})">Settings</span>
        </div>
        ${toggleRow('Global NSFW (Hookup)', u.nsfw, "toggleUserFlag('nsfw')", u.mutt, u.mutt ? 'Locked for Mutts' : '')}
        ${toggleRow('Allow DMs', u.allowDMs, "toggleUserFlag('allowDMs')")}
        ${toggleRow('Allow Flirts', u.allowFlirts, "toggleUserFlag('allowFlirts')")}
        ${toggleRow('Incognito', u.incognito, "toggleUserFlag('incognito')")}
        <div class="slider-wrap">
          <div class="dropdown-title" style="padding-left:0;">Location blur radius</div>
          <input type="range" min="0.1" max="5" step="0.1" value="${u.radius}" oninput="setRadius(this.value)">
          <div class="slider-value" id="radius-label">${u.radius.toFixed(1)} mi blur</div>
        </div>
        <div class="dropdown-title" style="border-top:1px solid var(--surface-2); padding-top:9px; margin-top:4px;">This page</div>
        ${toggleRow(pageNotifLabel(), STATE.user.pageNotifs !== false, 'togglePageNotifs()')}
      </div>`;
  } else if (open === 'filter') {
    host.innerHTML = `
      <div class="dropdown-panel">
        <div class="dropdown-title">Map filters</div>
        ${MAP_FILTERS.map(f => `
          <div class="check-row" onclick="toggleMapFilter('${f.id}')">
            <div class="checkbox ${STATE.mapFilters[f.id] ? 'checked' : ''}">${icon('check')}</div>
            <span>${f.label}</span>
          </div>`).join('')}
      </div>`;
  } else if (open === 'subsection') {
    const sec = SECTIONS.find(s => s.id === STATE.route.section);
    host.innerHTML = `
      <div class="dropdown-panel">
        <div class="dropdown-title">${sec.label} subsections</div>
        ${sec.subsections.map(s => {
          const dot = STATE.user.notifMode !== 'classic' && unreadFor(sec.id).some(n => n.subsection === s.id);
          const active = STATE.route.subsection === s.id;
          return `<div class="check-row ${active ? 'active' : ''}" onclick="goSubsection('${s.id}')">
            <span style="flex:1;">${s.label}</span>${dot ? '<span class="dot-red"></span>' : ''}
          </div>`;
        }).join('')}
        <div class="dropdown-hint">Swipe the pill to move between subsections.</div>
      </div>`;
  } else if (open === 'bell') {
    const items = STATE.notifications.slice().sort((a, b) => a.read - b.read);
    host.innerHTML = `
      <div class="dropdown-panel" style="width:284px;">
        <div class="dropdown-title">Notifications</div>
        ${items.length ? items.map(n => `
          <div class="check-row" style="align-items:flex-start;" onclick="readNotification('${n.id}')">
            <span class="dot-red" style="margin-top:6px; ${n.read ? 'visibility:hidden;' : ''}"></span>
            <span style="flex:1;">
              <div style="font-size:12.5px; font-weight:${n.read ? 400 : 700};">${esc(n.text)}</div>
              <div style="font-size:10.5px; color:var(--text-faint); margin-top:2px;">${esc(n.time)}</div>
            </span>
          </div>`).join('') : '<div class="empty-state">Nothing new.</div>'}
      </div>`;
  }
}
function toggleRow(label, isOn, onclick, locked, note) {
  return `<div class="toggle-row">
    <span class="label">${label}${note ? `<small>${note}</small>` : ''}</span>
    <div class="switch ${isOn ? 'on' : ''} ${locked ? 'locked' : ''}" onclick="${locked ? '' : onclick}"><div class="knob"></div></div>
  </div>`;
}
function pageNotifLabel() {
  const r = STATE.route;
  if (r.section === 'community') return 'Community updates';
  const sec = SECTIONS.find(s => s.id === r.section);
  const sub = sec.subsections && sec.subsections.find(s => s.id === r.subsection);
  return sub ? `${sub.label} notifications` : `${sec.label} notifications`;
}

/* ---------------- Bottom nav ---------------- */
function renderBottomNav() {
  document.getElementById('bottom-nav').innerHTML = SECTIONS.map(s => {
    const dot = sectionHasDot(s.id);
    const active = STATE.route.section === s.id && !STATE.route.overlay;
    return `<button class="nav-item ${active ? 'active' : ''}" data-tip="Open ${s.label}" onclick="handleNavTap('${s.id}')">
      ${icon(s.icon)}${dot ? '<span class="dot-red nav-dot"></span>' : ''}
      <span>${s.label}</span>
    </button>`;
  }).join('');
}
function handleNavTap(sectionId) {
  if (STATE.user.notifMode !== 'classic' && unreadFor(sectionId).length) { jumpToNextNotification(sectionId); return; }
  goSection(sectionId);
}

/* ================================================================
   RENDER: MAIN
   ================================================================ */
function renderMain() {
  const main = document.getElementById('app-main');
  const r = STATE.route;

  if (r.overlay && r.overlay.type === 'profile') { main.innerHTML = renderProfileView(r.overlay.userId); return; }
  if (r.overlay && r.overlay.type === 'dm') { main.innerHTML = renderDMThread(r.overlay.userId); scrollThreadToBottom(); return; }

  let html = '';
  if (r.section === 'community') html = renderCommunity();
  else if (r.section === 'pack') html = renderPack();
  else if (r.section === 'body') html = renderBody();
  else if (r.section === 'mind') html = renderMind();
  main.innerHTML = html;
  if (r.section === 'pack' && r.subsection === 'chat') scrollThreadToBottom();
}
function scrollThreadToBottom() {
  requestAnimationFrame(() => {
    const t = document.querySelector('.thread');
    if (t) t.scrollTop = t.scrollHeight;
  });
}
function sectionHero(id, label) {
  return `<div class="hero-banner"><img src="assets/hero-${id}.svg" alt="${label}"><div class="hero-label">${label}</div></div>`;
}

/* ---------------- Community (map only) ---------------- */
function renderCommunity() {
  const hookup = STATE.user.nsfw && !STATE.user.mutt;
  const f = STATE.mapFilters;

  let people = [];
  if (f.people) {
    people = MOCK_USERS.filter(u => {
      if (!u.online) return false;              // offline members leave the map
      if (u.incognito) return false;            // incognito members leave the map
      if ((STATE.user.blockedUsers || []).indexOf(u.handle) >= 0) return false;
      if ((STATE.user.pausedUsers || []).some(p => p.handle === u.handle)) return false;
      if (hookup && !u.nsfw) return false;      // eyes-only filter
      if (hookup && u.mutt) return false;       // Mutts can never be in NSFW mode
      return true;
    });
  }

  const statics = [];
  if (f.havens) statics.push({ label: 'Cedar Cabin Haven', x: 74, y: 14 });
  if (f.events) statics.push({ label: 'Trail Run Meetup', x: 66, y: 76 });
  if (f.restaurants) statics.push({ label: 'Pack-Friendly Diner', x: 22, y: 84 });
  if (f.gyms) statics.push({ label: 'Iron Yard Gym', x: 10, y: 62 });
  if (f.other) statics.push({ label: 'Free Health Clinic', x: 44, y: 10 });

  const meVisible = f.people && !STATE.user.incognito;
  const nothing = !people.length && !statics.length && !meVisible;

  return `
    ${sectionHero('community', 'Community')}
    <div class="map-wrap ${hookup ? 'hookup' : ''}">
      <div class="map-radius" style="width:${34 + STATE.user.radius * 13}%; height:${34 + STATE.user.radius * 13}%;"></div>
      ${meVisible ? `
        <div class="map-pin me" style="left:50%; top:50%;" data-tip="Open My Profile" onclick="viewProfile(null)">
          <div class="pin-avatar">${icon('paw')}
            <span class="integrity-emblem" style="background:${integrityColor(STATE.user.integrity)};"></span>
          </div>
          <span class="pin-label">You</span>
        </div>` : ''}
      ${people.map(u => {
        const showDm = u.unreadDMs > 0;
        return `<div class="map-pin ${hookup && u.nsfw ? 'hookup' : ''}" style="left:${u.x}%; top:${u.y}%;"
            data-tip="${showDm ? 'Open Messages' : 'Open Profile'}"
            onclick="${showDm ? `openDM('${u.id}')` : `viewProfile('${u.id}')`}">
          <div class="pin-avatar">
            ${icon(hookup && u.nsfw ? 'devil' : 'user')}
            <span class="integrity-emblem" style="background:${integrityColor(u.integrity)};"></span>
            ${showDm ? `<span class="dm-bubble">${icon('chat')}${u.unreadDMs}</span>` : ''}
          </div>
          <span class="pin-label">${esc(u.handle)}</span>
        </div>`;
      }).join('')}
      ${statics.map(s => `<div class="map-static-pin" style="left:${s.x}%; top:${s.y}%;">${icon('pin')} ${s.label}</div>`).join('')}
      ${nothing ? `<div class="map-empty">${icon('pin')}<div>Nothing selected. Open the Filters pill to choose what shows on the map.</div></div>` : ''}
    </div>
    <div class="card map-legend">
      ${hookup
        ? `<div class="legend-line purple">${icon('flame')} <b>Hookup mode is on</b></div>
           <p>Eyes-only filter: members without NSFW on are hidden from your view, and the rest switch to NSFW avatars. Messages stay open in both directions no matter whose NSFW is on.</p>`
        : `<div class="legend-line">${icon('eye')} <b>Standard map</b></div>
           <p>Pins sit inside a ${STATE.user.radius.toFixed(1)}-mile ghost zone, never an exact address. The color chip on the lower left of each icon is that member's Integrity Rating. A chat bubble means unread messages — tapping it opens the thread instead of the profile.</p>`}
    </div>`;
}

/* ---------------- Pack ---------------- */
function renderPack() {
  const sub = STATE.route.subsection || 'messages';
  return `
    ${sectionHero('pack', 'Pack')}
    ${sub === 'messages' ? renderMessagesList() :
      sub === 'chat' ? renderChat() :
      sub === 'wall' ? renderWall() :
      sub === 'events' ? renderEvents() :
      renderHavens()}`;
}

function renderMessagesList() {
  if (!STATE.user.allowDMs) {
    return `<div class="empty-state">${icon('chat')}<div>Direct messages are off. Turn Allow DMs back on in the user menu.</div></div>`;
  }
  const blocked = STATE.user.blockedUsers || [];
  const list = MOCK_USERS.filter(u => blocked.indexOf(u.handle) < 0);
  return `<div class="stack">
    ${list.map(u => `
      <div class="card card-row tappable" data-tip="Open Messages" onclick="openDM('${u.id}')">
        <div style="display:flex; align-items:center; gap:11px;">
          <div class="mini-avatar">${icon('user')}<span class="integrity-emblem" style="background:${integrityColor(u.integrity)};"></span></div>
          <div>
            <div class="row-title">${icon(u.nsfw ? 'devil' : 'angel')} @${esc(u.handle)}</div>
            <div class="row-sub">${u.mutt ? 'Mutt · unverified' : u.rank}${u.online ? '' : ' · offline'}</div>
          </div>
        </div>
        ${u.unreadDMs ? `<span class="badge badge-cyan">${u.unreadDMs} new</span>` : ''}
      </div>`).join('')}
  </div>`;
}

function renderDMThread(userId) {
  const u = findUser(userId);
  if (!u) return `<div class="empty-state">Conversation not found.</div>`;
  u.unreadDMs = 0;
  const thread = MOCK_DM_THREADS[userId] || [];
  return `
    <div class="dm-header">
      <div class="headspace-chip ${u.nsfw ? 'devil' : 'angel'}" data-tip="Recipient Headspace">
        ${icon(u.nsfw ? 'devil' : 'angel')}
        <span>@${esc(u.handle)} — NSFW ${u.nsfw ? 'on' : 'off'}</span>
      </div>
      <div style="display:flex; gap:4px;">
        <button class="icon-btn" data-tip="Open Profile" onclick="viewProfile('${u.id}')">${icon('user')}</button>
        <button class="icon-btn" data-tip="Report Conversation" onclick="openModal('report',{what:'this conversation'})">${icon('flag')}</button>
      </div>
    </div>
    <div class="thread" id="dm-thread">
      ${thread.length ? thread.map(m => `<div class="bubble ${m.me ? 'bubble-me' : 'bubble-them'}">${esc(m.text)}</div>`).join('')
        : `<div class="empty-state">${icon('chat')}<div>No messages yet. Say something.</div></div>`}
    </div>
    ${(STATE.user.mutt || u.mutt) ? `<div class="notice">${icon('shield')} Mutt protection is active here — explicit media and Tier 2 flirts are blocked in both directions.</div>` : ''}
    <div class="chat-input-bar">
      <button data-tip="Share Image" onclick="handleDMImage('${u.id}')">${icon('image')}</button>
      <input id="dm-input" placeholder="Message @${esc(u.handle)}..." onkeydown="if(event.key==='Enter')sendDM('${u.id}')">
      <button data-tip="Send Message" onclick="sendDM('${u.id}')">${icon('send')}</button>
    </div>`;
}
function sendDM(userId) {
  const input = document.getElementById('dm-input');
  if (!input || !input.value.trim()) return;
  if (!MOCK_DM_THREADS[userId]) MOCK_DM_THREADS[userId] = [];
  MOCK_DM_THREADS[userId].push({ me: true, text: input.value.trim() });
  input.value = '';
  renderMain();
}
function handleDMImage(userId) {
  const u = findUser(userId);
  if (STATE.user.mutt || u.mutt) { toast('Blocked: explicit media can\'t be sent to or from a Mutt.'); return; }
  toast('Gallery image attached.');
}

function renderChat() {
  const cooldown = Date.now() < STATE.chatCooldownUntil;
  const secsLeft = Math.max(0, Math.ceil((STATE.chatCooldownUntil - Date.now()) / 1000));
  return `
    <div class="card chat-card">
      <div class="eyebrow">Chapter chat · Port Arthur</div>
      <div class="notice subtle">${icon('shield')} Chat is strictly zero-NSFW. Explicit images are never allowed here.</div>
      <div class="thread" id="chat-thread">
        ${MOCK_CHAT.map(m => `
          <div class="chat-line">
            <div class="bubble ${m.user === STATE.user.handle ? 'bubble-me' : 'bubble-them'}"><b>${esc(m.user)}:</b> ${esc(m.text)}</div>
            <button class="icon-btn tiny" data-tip="Report Message" onclick="openModal('report',{what:'a chat message'})">${icon('flag')}</button>
          </div>`).join('')}
      </div>
    </div>
    ${cooldown ? `<div class="cooldown-banner">${icon('clock')} Spam filter active — wait <span id="cool-secs">${secsLeft}</span>s</div>` : ''}
    <div class="chat-input-bar">
      <button data-tip="Share Image" ${cooldown ? 'disabled' : ''} onclick="toast('Image shared to chapter chat.')">${icon('image')}</button>
      <input id="chat-input" placeholder="${cooldown ? 'Cooldown active…' : 'Message the chapter...'}" ${cooldown ? 'disabled' : ''} onkeydown="if(event.key==='Enter')sendChat()">
      <button data-tip="Send Message" onclick="sendChat()" ${cooldown ? 'disabled' : ''}>${icon('send')}</button>
    </div>`;
}
function sendChat() {
  if (Date.now() < STATE.chatCooldownUntil) return;
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;
  MOCK_CHAT.push({ user: STATE.user.handle, text: input.value.trim() });
  input.value = '';
  STATE.chatStreak += 1;
  if (STATE.chatStreak >= 3) {
    STATE.chatCooldownUntil = Date.now() + 30000;
    STATE.chatStreak = 0;
    saveState();
    renderMain();
    startCooldownTicker();
    return;
  }
  saveState();
  renderMain();
  // A reply from another member clears the consecutive-message streak.
  clearTimeout(sendChat._reply);
  sendChat._reply = setTimeout(() => {
    if (STATE.route.section !== 'pack' || STATE.route.subsection !== 'chat') return;
    if (STATE.chatStreak > 0 && Math.random() < 0.55) {
      MOCK_CHAT.push({ user: 'RustyTrail', text: 'Same. See you there.' });
      STATE.chatStreak = 0;
      saveState();
      renderMain();
    }
  }, 2800);
}
function startCooldownTicker() {
  clearInterval(startCooldownTicker._t);
  startCooldownTicker._t = setInterval(() => {
    const left = Math.max(0, Math.ceil((STATE.chatCooldownUntil - Date.now()) / 1000));
    const el = document.getElementById('cool-secs');
    if (el) el.textContent = left;
    if (left <= 0) {
      clearInterval(startCooldownTicker._t);
      if (STATE.route.section === 'pack' && STATE.route.subsection === 'chat') renderMain();
    }
  }, 500);
}

function renderWall() {
  return `<div class="stack">
    ${MOCK_WALL.map(p => `
      <div class="card">
        <button class="card-flag" data-tip="Report Post" onclick="openModal('report',{what:'this post'})">${icon('flag')}</button>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:9px;">
          <div class="mini-avatar">${icon('user')}</div>
          <div>
            <div class="row-title">@${esc(p.user)}</div>
            <div class="row-sub">${p.rank} · ${p.time}</div>
          </div>
        </div>
        <p class="post-body">${esc(p.text)}</p>
        <div class="post-actions">
          <button class="icon-btn ${p.liked ? 'on' : ''}" data-tip="Like Post" onclick="likePost('${p.id}')">${icon('heart')}<span>${p.likes}</span></button>
          <button class="icon-btn" data-tip="View Comments" onclick="toast('Comment threads land in the next build.')">${icon('chat')}<span>${p.comments}</span></button>
        </div>
      </div>`).join('')}
  </div>`;
}
function likePost(id) {
  const p = MOCK_WALL.find(x => x.id === id);
  p.liked = !p.liked;
  p.likes += p.liked ? 1 : -1;
  renderMain();
}

function renderEvents() {
  const pending = MOCK_EVENTS.filter(e => e.needsReview);
  const upcoming = MOCK_EVENTS.filter(e => !e.needsReview);
  return `<div class="stack">
    ${pending.map(e => `
      <div class="card card-highlight">
        <div class="eyebrow">Post-meetup review</div>
        <p class="post-body" style="margin-top:7px;">${esc(e.title)} has wrapped. Your rating stays sealed until they submit theirs.</p>
        <button class="btn btn-primary btn-block" style="margin-top:11px;" onclick="openModal('review',{id:'${e.id}'})">Leave blind review</button>
      </div>`).join('')}
    ${upcoming.map(e => `
      <div class="card card-row">
        <div>
          <div class="row-title">${esc(e.title)}</div>
          <div class="row-sub">Hosted by @${esc(e.host)} · ${esc(e.date)}</div>
          <div class="row-sub">${e.rsvps} going</div>
        </div>
        <button class="btn ${e.going ? 'btn-ghost' : 'btn-primary'} btn-sm" data-tip="${e.going ? 'Cancel RSVP' : 'RSVP to Event'}" onclick="toggleRSVP('${e.id}')">${e.going ? 'Going' : 'RSVP'}</button>
      </div>`).join('')}
  </div>`;
}
function toggleRSVP(id) {
  const e = MOCK_EVENTS.find(x => x.id === id);
  e.going = !e.going;
  e.rsvps += e.going ? 1 : -1;
  renderMain();
  toast(e.going ? 'You\'re in.' : 'RSVP removed.');
}

function renderHavens() {
  return `<div class="stack">
    ${MOCK_HAVENS.map(h => `
      <div class="card">
        <div class="card-row">
          <div>
            <div class="row-title">${esc(h.name)}</div>
            <div class="row-sub">Hosted by @${esc(h.host)} · ${h.distance}</div>
          </div>
          <span class="badge badge-cyan">${icon('spark')} ${h.rating}</span>
        </div>
        <div class="row-sub" style="margin-top:9px;">${h.passes}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:11px;" data-tip="Book Stay" onclick="openModal('haven',{id:'${h.id}'})">Book stay</button>
      </div>`).join('')}
  </div>`;
}

/* ---------------- Body ---------------- */
function renderBody() {
  const sub = STATE.route.subsection || 'nutrition';
  return `${sectionHero('body', 'Body')}${sub === 'nutrition' ? renderNutrition() : renderExercise()}`;
}
function meter(label, cur, goal, unit) {
  unit = unit || '';
  const pct = Math.min(100, (cur / goal) * 100);
  return `<div class="card">
    <div class="card-row"><span class="eyebrow">${label}</span><span class="row-sub">${cur}${unit} / ${goal}${unit}</span></div>
    <div class="progress-bar-track" style="margin-top:10px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
  </div>`;
}
function renderNutrition() {
  const n = MOCK_NUTRITION;
  return `
    ${meter('Calories', n.calories.current, n.calories.goal)}
    ${meter('Hydration', n.water.current, n.water.goal, ' cups')}
    <div class="card">
      <div class="eyebrow" style="margin-bottom:6px;">Meals logged today</div>
      ${n.meals.map(m => `<div class="list-row"><span>${esc(m.name)}</span><span class="row-sub">${m.cal} cal</span></div>`).join('')}
      <button class="btn btn-primary btn-block" style="margin-top:13px;" onclick="logMeal()">Log a meal</button>
    </div>`;
}
function logMeal() {
  MOCK_NUTRITION.meals.push({ name: 'Snack', cal: 180 });
  MOCK_NUTRITION.calories.current += 180;
  renderMain();
  toast('Meal logged.');
}
function renderExercise() {
  const e = MOCK_EXERCISE;
  return `
    ${meter('Pushups', e.pushups.current, e.pushups.goal)}
    ${meter('Situps', e.situps.current, e.situps.goal)}
    ${meter('Cardio', e.cardio.current, e.cardio.goal, ' min')}
    <button class="btn btn-primary btn-block" onclick="logSet()">Log a set</button>`;
}
function logSet() {
  MOCK_EXERCISE.pushups.current = Math.min(MOCK_EXERCISE.pushups.goal, MOCK_EXERCISE.pushups.current + 20);
  MOCK_EXERCISE.situps.current = Math.min(MOCK_EXERCISE.situps.goal, MOCK_EXERCISE.situps.current + 20);
  MOCK_EXERCISE.cardio.current = Math.min(MOCK_EXERCISE.cardio.goal, MOCK_EXERCISE.cardio.current + 6);
  renderMain();
  toast('Set logged.');
}

/* ---------------- Mind ---------------- */
function renderMind() {
  const sub = STATE.route.subsection || 'checklist';
  return `${sectionHero('mind', 'Mind')}${
    sub === 'checklist' ? renderChecklist() :
    sub === 'modules' ? renderModules() :
    sub === 'sounds' ? renderSounds() : renderSecrets()}`;
}
function renderChecklist() {
  return `<div class="stack">
    ${MOCK_CHECKLIST.map(c => `
      <div class="checklist-item ${c.urgent && !c.done ? 'urgent' : ''}">
        <div class="checkbox ${c.done ? 'checked' : ''}" onclick="toggleCheck('${c.id}')">${icon('check')}</div>
        <div style="flex:1;">
          <div class="check-text ${c.done ? 'done' : ''}" ${c.urgent && !c.done ? 'style="color:#f87171;"' : ''}>${esc(c.text)}</div>
          <div class="row-sub">${esc(c.due)}</div>
          ${c.cta && !c.done ? `<button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="toast('Looking up nearby clinics…')">${esc(c.cta)}</button>` : ''}
        </div>
      </div>`).join('')}
  </div>`;
}
function toggleCheck(id) {
  const c = MOCK_CHECKLIST.find(x => x.id === id);
  c.done = !c.done;
  renderMain();
}
function renderModules() {
  return `<div class="stack">
    ${MOCK_MODULES.map(m => `<div class="card card-row tappable" onclick="toast('Playing ${esc(m.title)}')">
      <div><div class="row-title">${esc(m.title)}</div><div class="row-sub">${m.length}</div></div>
      <span class="badge badge-cyan">Play</span>
    </div>`).join('')}
  </div>`;
}
function renderSounds() {
  return `<div class="stack">
    ${MOCK_SOUNDS.map(s => `<div class="card card-row">
      <div><div class="row-title">${esc(s.title)}</div><div class="row-sub">${s.length}</div></div>
      ${s.premium
        ? `<button class="btn btn-ghost btn-sm" onclick="openModal('shop')">${icon('lock')} Unlock</button>`
        : `<button class="btn btn-primary btn-sm" onclick="toast('Playing ambient track…')">Play</button>`}
    </div>`).join('')}
  </div>`;
}
function renderSecrets() {
  return `<div class="stack">
    <div class="notice subtle">${icon('lock')} Encrypted locker. A screenshot blurs the media instantly, alerts the owner, and logs a device strike.</div>
    ${MOCK_SECRETS.map(s => `<div class="secret-card">
      <div style="display:flex; align-items:center; gap:12px;">${icon('lock')}
        <div><div class="row-title">${esc(s.title)}</div><div class="row-sub">Unlocks in ${s.releaseIn}</div></div>
      </div>
      <span class="badge badge-purple">Sealed</span>
    </div>`).join('')}
  </div>`;
}

/* ================================================================
   PROFILE — one layout for your own and everyone else's
   ================================================================ */
function renderProfileView(userId) {
  const own = !userId;
  const u = own ? STATE.user : findUser(userId);
  if (!u) return `<div class="empty-state">Profile not found.</div>`;

  // NSFW content is mutual; Mutts never see it on either side.
  const nsfwActive = own
    ? (STATE.user.nsfw && !STATE.user.mutt)
    : (STATE.user.nsfw && u.nsfw && !STATE.user.mutt && !u.mutt);
  const starPct = Math.min(100, (u.integrity / 5) * 100);
  const starColor = integrityColor(u.integrity);
  const images = own ? (STATE.user.images || []) : u.images;
  const parts = u.integrityParts;
  const showSTI = own ? STATE.user.showSTI : u.showSTI !== false;

  return `
    <div class="profile-header">
      <div class="profile-avatar ${nsfwActive ? 'nsfw' : ''}">${esc(u.handle[0].toUpperCase())}</div>
      <div class="profile-handle ${nsfwActive ? 'nsfw' : ''}">@${esc(u.handle)}</div>
      <div class="profile-rank">${u.rank}${u.mutt ? ' · unverified' : ''}</div>
      <div class="integrity-track">
        <div class="integrity-fill"></div>
        <div class="integrity-star ${u.integrity >= 4.75 ? 'sparkle' : ''}" style="left:${starPct}%; color:${starColor};">${icon('spark')}</div>
      </div>
      <div class="row-sub">Integrity Rating ${u.integrity.toFixed(2)} / 5.00</div>
      ${parts ? `<div class="integrity-parts">Community ${parts.community.toFixed(1)} · Pack ${parts.pack.toFixed(1)} · Body ${parts.body.toFixed(1)} · Mind ${parts.mind.toFixed(1)}</div>` : ''}
    </div>

    ${own ? '' : `
    <div class="action-bar">
      <button class="action-chip cyan" data-tip="Open Messages" onclick="openDM('${userId}')">${icon('chat')} Chat</button>
      <button class="action-chip purple" data-tip="Send Flirt" onclick="openModal('flirt',{id:'${userId}'})">${icon('flirt')} Flirt</button>
      <button class="action-chip amber" data-tip="Edit Note" onclick="openModal('note',{id:'${userId}'})">${icon('note')} Note</button>
      <button class="action-chip amber" data-tip="Pause User" onclick="openModal('pauseBlock',{id:'${userId}'})">${icon('pause')} Pause</button>
      <button class="action-chip red" data-tip="Report User" onclick="openModal('report',{what:'this profile'})">${icon('flag')} Report</button>
    </div>`}

    <div class="card">
      <div class="eyebrow" style="margin-bottom:10px;">${nsfwActive ? 'Stats · NSFW' : 'Stats'}</div>
      <div class="stats-grid">
        <div class="stat-box"><div class="k">Age</div><div class="v">${esc(u.age)}</div></div>
        <div class="stat-box"><div class="k">Height</div><div class="v">${esc(u.height)}</div></div>
        <div class="stat-box"><div class="k">Weight</div><div class="v">${esc(u.weight)}</div></div>
        ${nsfwActive ? `
        <div class="stat-box"><div class="k">Position</div><div class="v">${esc(u.position)}</div></div>
        <div class="stat-box" style="grid-column:span 2;"><div class="k">Size</div><div class="v">${esc(u.size)}</div></div>` : ''}
      </div>
    </div>

    <div class="card">
      <div class="eyebrow">About</div>
      <p class="bio-text" ${own ? 'contenteditable="true" onblur="saveBio(this,\'bio\')"' : ''}>${esc(u.bio) || 'Nothing here yet.'}</p>
      <div class="row-sub" style="margin-top:6px;">Max 500 characters${own ? ' · tap to edit' : ''}</div>
    </div>

    ${nsfwActive ? `
    <div class="card nsfw-card">
      <div class="eyebrow" style="color:var(--purple-text);">NSFW description</div>
      <p class="bio-text" ${own ? 'contenteditable="true" onblur="saveBio(this,\'nsfwBio\')"' : ''}>${esc(u.nsfwBio) || 'Nothing here yet.'}</p>
      <div class="row-sub" style="margin-top:6px;">Visible only when both members have NSFW on.</div>
    </div>` : ''}

    <div class="card">
      <div class="eyebrow" style="margin-bottom:8px;">Health</div>
      <div class="list-row">
        ${showSTI
          ? `<span class="health-line ${u.sti.status === 'clear' ? 'ok' : 'stale'}">${icon('shield')} ${
              u.sti.status === 'clear' ? `STI tested · expires in ${u.sti.expiresInDays}d`
              : u.sti.status === 'expired' ? 'Verification expired' : 'Not tested'}</span>`
          : `<span class="row-sub">STI results hidden</span>`}
      </div>
      <div class="list-row">
        <span class="health-line ${u.safeSexOnly ? 'ok' : ''}">${icon('lock')} Safe Sex Only${u.safeSexOnly ? '' : ' — off'}</span>
      </div>
      ${own ? `
        ${toggleRow('Show STD/STI results on my profile', STATE.user.showSTI, "STATE.user.showSTI=!STATE.user.showSTI; saveState(); renderApp();")}
        ${toggleRow('Safe Sex Only', STATE.user.safeSexOnly, "STATE.user.safeSexOnly=!STATE.user.safeSexOnly; saveState(); renderApp();")}` : ''}
    </div>

    <div class="card">
      <div class="eyebrow" style="margin-bottom:10px;">Gallery</div>
      <div class="gallery-grid">
        ${own ? `<button class="add-image-btn" data-tip="Add Image" onclick="openModal('camera')">${icon('camera')}<span>Add image</span></button>` : ''}
        ${images.map(img => {
          const blur = img.nsfw && !nsfwActive;
          return `<div class="gallery-thumb ${img.nsfw ? 'is-nsfw' : ''} ${blur ? 'blurred' : ''}"
            data-tip="${blur ? 'Locked' : 'View Image'}"
            onclick="${blur ? "toast('NSFW media stays hidden unless both members have NSFW on.')" : `openModal('imagePreview',{uploaded:'${esc(img.uploaded)}'})`}">
            ${icon(blur ? 'lock' : 'image')}
          </div>`;
        }).join('')}
        ${(!images.length && !own) ? `<div class="row-sub" style="grid-column:span 3;">No public photos yet.</div>` : ''}
      </div>
    </div>`;
}
function saveBio(el, field) {
  const text = el.textContent.trim().slice(0, 500);
  el.textContent = text;
  STATE.user[field] = text;
  saveState();
  toast('Saved.');
}

/* ================================================================
   MODALS
   ================================================================ */
function renderModal() {
  let host = document.getElementById('modal-host');
  if (!host) { host = document.createElement('div'); host.id = 'modal-host'; document.getElementById('app-shell').appendChild(host); }
  if (!STATE.modal) { host.innerHTML = ''; return; }
  const type = STATE.modal.type, payload = STATE.modal.payload || {};
  const builders = {
    settings: modalSettings, shop: modalShop, hostEvent: modalHostEvent,
    camera: modalCamera, blockedList: modalBlockedList, deleteConfirm: modalDeleteConfirm,
    password: modalPassword, displayName: modalDisplayName,
    report: () => modalReport(payload),
    flirt: () => modalFlirt(payload.id),
    note: () => modalNote(payload.id),
    pauseBlock: () => modalPauseBlock(payload.id),
    imagePreview: () => modalImagePreview(payload.uploaded),
    haven: () => modalHaven(payload.id),
    review: () => modalReview(payload.id),
  };
  const inner = builders[type] ? builders[type]() : '';
  host.innerHTML = `<div class="modal-backdrop" onclick="if(event.target===this) closeModal()"><div class="modal-sheet">${inner}</div></div>`;
  if (type === 'pauseBlock') initSlideToConfirm();
}
function modalHeader(title) {
  return `<div class="modal-header"><h3>${title}</h3><button class="modal-close" data-tip="Close" onclick="closeModal()">${icon('close')}</button></div>`;
}

function modalSettings() {
  const u = STATE.user;
  return `
    ${modalHeader('Settings')}
    <div class="settings-link" onclick="openModal('password')">${icon('key')}<span>Password &amp; credentials</span></div>
    <div class="settings-link" onclick="openModal('displayName')">${icon('user')}<span>Display name — @${esc(u.handle)}</span></div>
    <div style="padding:15px 2px 4px;">
      <div class="eyebrow" style="margin-bottom:10px;">Notification mode</div>
      <div class="seg-tabs">
        ${['classic', 'modern', 'both'].map(m => `<div class="seg-tab ${u.notifMode === m ? 'active' : ''}" onclick="setNotifMode('${m}')">${m[0].toUpperCase() + m.slice(1)}</div>`).join('')}
      </div>
      <p class="row-sub" style="margin-top:10px; line-height:1.55;">Classic shows only the bell. Modern shows red dots with auto-jump and removes the bell. Both runs them together.</p>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="openModal('blockedList')">${icon('shield')} Blocked &amp; paused users</button>
    <div class="modal-footer-actions">
      <button class="btn btn-amber" onclick="doLogout()">${icon('logout')} Log out</button>
      <button class="btn btn-danger" onclick="openModal('deleteConfirm')">${icon('trash')} Delete account</button>
    </div>`;
}
function modalPassword() {
  return `${modalHeader('Password')}
    <div class="field"><label>Current password</label><input type="password" placeholder="••••••••"></div>
    <div class="field" style="margin-top:11px;"><label>New password</label><input type="password" placeholder="••••••••"></div>
    <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="closeModal(); toast('Password updated.')">Update password</button>`;
}
function modalDisplayName() {
  return `${modalHeader('Display name')}
    <div class="field"><label>Public handle</label><input id="dn-input" value="${esc(STATE.user.handle)}"></div>
    <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="saveDisplayName()">Save name</button>`;
}
function saveDisplayName() {
  const v = document.getElementById('dn-input').value.trim();
  if (v) STATE.user.handle = v;
  saveState();
  closeModal();
  toast('Display name updated.');
}
function modalDeleteConfirm() {
  return `${modalHeader('Delete account')}
    <p class="modal-copy">This starts a 30-day soft-delete grace period. After that, every profile record, media upload, and personal log is purged from primary and backup databases.</p>
    <div class="modal-footer-actions">
      <button class="btn btn-ghost" onclick="openModal('settings')">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteAccount()">Confirm deletion</button>
    </div>`;
}
function modalBlockedList() {
  const b = STATE.user.blockedUsers || [];
  const p = STATE.user.pausedUsers || [];
  return `${modalHeader('Blocked & paused')}
    ${(!b.length && !p.length) ? `<div class="empty-state">${icon('shield')}<div>Nobody is blocked or paused.</div></div>` : ''}
    ${b.map(h => `<div class="list-row"><span class="health-line">${icon('block')} @${esc(h)}</span><button class="btn btn-ghost btn-sm" onclick="unblock('${esc(h)}')">Unblock</button></div>`).join('')}
    ${p.map(x => `<div class="list-row"><span class="health-line amber">${icon('pause')} @${esc(x.handle)} — ${x.days}d left</span><button class="btn btn-ghost btn-sm" onclick="unblock('${esc(x.handle)}')">Unblock</button></div>`).join('')}`;
}
function unblock(handle) {
  STATE.user.blockedUsers = (STATE.user.blockedUsers || []).filter(h => h !== handle);
  STATE.user.pausedUsers = (STATE.user.pausedUsers || []).filter(x => x.handle !== handle);
  saveState();
  renderModal();
  toast(`@${handle} restored.`);
}

function modalShop() {
  const tab = STATE.shopTab;
  return `${modalHeader('Shop')}
    <div class="points-row">
      <div class="points-card"><div class="k">Lifetime Pack Points</div><div class="v">${STATE.user.lifetimePoints}</div><div class="k">reputation only</div></div>
      <div class="points-card"><div class="k">Spendable</div><div class="v">${STATE.user.spendablePoints.toFixed(2)}</div><div class="k">usable here</div></div>
    </div>
    <div class="seg-tabs" style="margin:15px 0;">
      ${SHOP_TABS.map(t => `<div class="seg-tab ${tab === t ? 'active' : ''}" onclick="STATE.shopTab='${t}'; renderModal();">${t}</div>`).join('')}
    </div>
    <div class="stack">
      ${SHOP_ITEMS[tab].map((i, idx) => `<div class="shop-item">
        <span class="name">${esc(i.name)}</span>
        <div style="display:flex; align-items:center; gap:11px;">
          <span class="price">${i.price} pts</span>
          <button class="btn btn-primary btn-sm" onclick="purchaseItem('${tab}',${idx})">Buy</button>
        </div>
      </div>`).join('')}
    </div>`;
}
function purchaseItem(tab, idx) {
  const item = SHOP_ITEMS[tab][idx];
  if (STATE.user.spendablePoints < item.price) { toast('Not enough spendable Pack Points.'); return; }
  STATE.user.spendablePoints = +(STATE.user.spendablePoints - item.price).toFixed(2);
  saveState();
  renderModal();
  toast(`${item.name} unlocked.`);
}

function modalHostEvent() {
  return `${modalHeader('Host an event')}
    <div class="field"><label>Event name</label><input id="ev-title" placeholder="Saturday trail run"></div>
    <div class="field" style="margin-top:11px;"><label>When</label><input id="ev-date" placeholder="Aug 23, 6:00 PM"></div>
    <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="hostEvent()">Create event</button>`;
}
function hostEvent() {
  const title = document.getElementById('ev-title').value.trim() || 'Untitled meetup';
  const date = document.getElementById('ev-date').value.trim() || 'Date TBD';
  MOCK_EVENTS.unshift({ id: 'e' + Date.now(), title: title, host: STATE.user.handle, date: date, rsvps: 1, going: true });
  closeModal();
  goSection('pack', 'events');
  toast('Event created.');
}

function modalFlirt(userId) {
  const u = findUser(userId);
  const bothNsfw = STATE.user.nsfw && u.nsfw && !STATE.user.mutt && !u.mutt;
  const tier1 = [['smile', 'Hey'], ['wink', 'Wink'], ['heart', 'Into you']];
  const tier2 = [['flame', 'Heat'], ['devil', 'Trouble'], ['spark', 'Tonight']];
  return `${modalHeader(`Flirt with @${esc(u.handle)}`)}
    <div class="flirt-tier-label">Tier 1 — anyone</div>
    <div class="flirt-row">${tier1.map(p => `<button class="flirt-opt" data-tip="Send ${p[1]}" onclick="sendFlirt('${p[1]}')">${icon(p[0])}<span>${p[1]}</span></button>`).join('')}</div>
    <div class="flirt-tier-label ${bothNsfw ? '' : 'locked'}">Tier 2 — both members in NSFW mode${bothNsfw ? '' : ' · locked'}</div>
    <div class="flirt-row">${tier2.map(p => `<button class="flirt-opt purple ${bothNsfw ? '' : 'locked'}" ${bothNsfw ? `onclick="sendFlirt('${p[1]}')"` : ''}>${icon(bothNsfw ? p[0] : 'lock')}<span>${p[1]}</span></button>`).join('')}</div>
    ${bothNsfw ? '' : `<p class="row-sub" style="margin-top:13px;">${u.mutt ? 'Tier 2 flirts can never be sent to a Mutt.' : 'Tier 2 unlocks when you and they both have NSFW on.'}</p>`}`;
}
function sendFlirt(label) { closeModal(); toast(`Flirt sent: ${label}.`); }

function modalNote(userId) {
  const u = findUser(userId);
  const existing = (STATE.user.notesOnUsers || {})[userId] || '';
  return `${modalHeader(`Private note · @${esc(u.handle)}`)}
    <textarea id="note-text" rows="5" class="text-area" placeholder="Only you can see this.">${esc(existing)}</textarea>
    <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="saveNote('${userId}')">Save note</button>`;
}
function saveNote(userId) {
  if (!STATE.user.notesOnUsers) STATE.user.notesOnUsers = {};
  STATE.user.notesOnUsers[userId] = document.getElementById('note-text').value;
  saveState();
  closeModal();
  toast('Note saved.');
}

function modalPauseBlock(userId) {
  const u = findUser(userId);
  return `${modalHeader(`Pause or block @${esc(u.handle)}`)}
    <div class="mode-switch-row">
      <span id="pb-mode-label" class="mode-label pause">Mode: Pause</span>
      <div class="switch" id="pb-mode-toggle" onclick="togglePauseBlockMode()"><div class="knob"></div></div>
    </div>
    <div id="pb-body" data-user="${userId}">${pauseBody()}</div>`;
}
function pauseBody() {
  return `<p class="row-sub" style="margin-bottom:11px;">Pause hides them for a set time, then lifts on its own. No permanent record.</p>
    <input type="range" min="1" max="14" value="1" id="pb-slider" class="pause-slider" oninput="updatePauseDays(this.value)">
    <div class="pause-days"><span id="pb-days">1</span> day pause</div>
    <div class="slide-track yellow" id="slide-track">
      <div class="slide-label yellow">Slide to confirm pause</div>
      <div class="slide-thumb yellow" id="slide-thumb"><span id="pb-days-thumb">1d</span></div>
    </div>`;
}
function blockBody() {
  return `<p class="row-sub" style="margin-bottom:11px;">Block is permanent across every view until you undo it in Settings.</p>
    <div class="slide-track" id="slide-track">
      <div class="slide-label">Slide to confirm permanent block</div>
      <div class="slide-thumb" id="slide-thumb">${icon('block')}</div>
    </div>`;
}
function togglePauseBlockMode() {
  const toggle = document.getElementById('pb-mode-toggle');
  const label = document.getElementById('pb-mode-label');
  const body = document.getElementById('pb-body');
  const isBlock = toggle.classList.toggle('on');
  label.textContent = isBlock ? 'Mode: Block' : 'Mode: Pause';
  label.className = 'mode-label ' + (isBlock ? 'block' : 'pause');
  body.innerHTML = isBlock ? blockBody() : pauseBody();
  initSlideToConfirm();
}
function updatePauseDays(v) {
  const a = document.getElementById('pb-days'), b = document.getElementById('pb-days-thumb');
  if (a) a.textContent = v;
  if (b) b.textContent = v + 'd';
}
function initSlideToConfirm() {
  const track = document.getElementById('slide-track');
  const thumb = document.getElementById('slide-thumb');
  if (!track || !thumb) return;
  if (initSlideToConfirm._cleanup) initSlideToConfirm._cleanup();
  let dragging = false, maxX = 0, fired = false;

  function clamp(clientX) {
    const rect = track.getBoundingClientRect();
    maxX = track.clientWidth - thumb.offsetWidth - 8;
    return Math.max(0, Math.min(maxX, clientX - rect.left - thumb.offsetWidth / 2));
  }
  function down(e) { dragging = true; fired = false; thumb.style.transition = 'none'; if (e.cancelable) e.preventDefault(); }
  function move(clientX) {
    if (!dragging || fired) return;
    const nx = clamp(clientX);
    thumb.style.transform = `translateX(${nx}px)`;
    if (nx >= maxX - 3) { fired = true; dragging = false; confirmSlide(); }
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    if (!fired) { thumb.style.transition = 'transform .18s ease'; thumb.style.transform = 'translateX(0px)'; }
  }
  const mm = e => move(e.clientX);
  const tm = e => move(e.touches[0].clientX);
  thumb.addEventListener('mousedown', down);
  thumb.addEventListener('touchstart', down, { passive: false });
  window.addEventListener('mousemove', mm);
  window.addEventListener('touchmove', tm, { passive: true });
  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up);
  initSlideToConfirm._cleanup = function () {
    window.removeEventListener('mousemove', mm);
    window.removeEventListener('touchmove', tm);
    window.removeEventListener('mouseup', up);
    window.removeEventListener('touchend', up);
    initSlideToConfirm._cleanup = null;
  };
}
function confirmSlide() {
  const isBlock = document.getElementById('pb-mode-toggle').classList.contains('on');
  const userId = document.getElementById('pb-body').getAttribute('data-user');
  const u = findUser(userId);
  const slider = document.getElementById('pb-slider');
  if (initSlideToConfirm._cleanup) initSlideToConfirm._cleanup();
  if (isBlock) {
    STATE.user.blockedUsers = STATE.user.blockedUsers || [];
    if (STATE.user.blockedUsers.indexOf(u.handle) < 0) STATE.user.blockedUsers.push(u.handle);
    toast(`@${u.handle} blocked.`);
  } else {
    const days = slider ? parseInt(slider.value, 10) : 1;
    STATE.user.pausedUsers = (STATE.user.pausedUsers || []).filter(x => x.handle !== u.handle);
    STATE.user.pausedUsers.push({ handle: u.handle, days: days });
    toast(`@${u.handle} paused for ${days} day${days > 1 ? 's' : ''}.`);
  }
  saveState();
  closeModal();
  if (STATE.route.overlay) goBack();
}

function modalReport(payload) {
  const what = (payload && payload.what) || 'this content';
  return `${modalHeader('Report')}
    <p class="modal-copy">Reports on ${esc(what)} go into The Pound with a 24-hour review commitment. Filing one never interrupts what you were doing.</p>
    <textarea rows="4" class="text-area" style="margin-top:12px;" placeholder="Add context (optional)"></textarea>
    <button class="btn btn-danger btn-block" style="margin-top:12px;" onclick="closeModal(); toast('Report filed with The Pound.')">Submit report</button>`;
}

function modalCamera() {
  const today = new Date().toDateString();
  const claimed = STATE.user.lastPhotoRewardDate === today;
  return `${modalHeader('Camera')}
    <div class="camera-frame">${icon('camera')}</div>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="snapPhoto()">Take and upload photo</button>
    <p class="row-sub" style="margin-top:11px;">${claimed ? 'Today\'s +0.01 reward is already claimed.' : 'The first upload each day earns +0.01 Pack Points.'}</p>`;
}
function snapPhoto() {
  const today = new Date().toDateString();
  STATE.user.images = STATE.user.images || [];
  STATE.user.images.unshift({ id: 'own' + Date.now(), uploaded: new Date().toLocaleString(), nsfw: false });
  if (STATE.user.lastPhotoRewardDate !== today) {
    STATE.user.spendablePoints = +(STATE.user.spendablePoints + 0.01).toFixed(2);
    STATE.user.lastPhotoRewardDate = today;
    toast('Photo uploaded — +0.01 Pack Points.');
  } else {
    toast('Photo uploaded.');
  }
  saveState();
  closeModal();
}

function modalImagePreview(uploaded) {
  return `${modalHeader('Photo')}
    <div class="image-preview">${icon('image')}</div>
    <div class="row-sub image-stamp">${icon('clock')} Uploaded ${esc(uploaded)}</div>`;
}

function modalHaven(id) {
  const h = MOCK_HAVENS.find(x => x.id === id);
  return `${modalHeader(esc(h.name))}
    <p class="modal-copy">Hosted by @${esc(h.host)} · ${h.distance} · ${h.passes}</p>
    <div class="notice subtle" style="margin-top:12px;">${icon('shield')} You'll get an automated check-in ping every 12 hours. Miss two inside a 30-minute window and your emergency contact is alerted. Havens are peer sanctuaries — the host sets the ground rules and can end a stay at any time. No tenancy rights attach.</div>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="requestHavenStay('${esc(h.host)}')">Request stay</button>`;
}
function requestHavenStay(host) { closeModal(); toast(`Stay request sent to @${host}.`); }

function modalReview(eventId) {
  const e = MOCK_EVENTS.find(x => x.id === eventId);
  return `${modalHeader('Blind review')}
    <p class="modal-copy">${esc(e.title)} — your rating stays sealed until both sides submit. It feeds the Community quarter of their Integrity Rating.</p>
    <div class="review-row" id="review-stars">
      ${[1, 2, 3, 4, 5].map(n => `<button class="star-btn" data-n="${n}" onclick="pickStars(${n})">${icon('spark')}</button>`).join('')}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="submitReview('${eventId}')">Submit sealed review</button>`;
}
function pickStars(n) {
  const btns = document.querySelectorAll('#review-stars .star-btn');
  btns.forEach(b => b.classList.toggle('on', parseInt(b.getAttribute('data-n'), 10) <= n));
  pickStars._v = n;
}
function submitReview(eventId) {
  const e = MOCK_EVENTS.find(x => x.id === eventId);
  e.needsReview = false;
  closeModal();
  renderMain();
  toast('Review sealed until they submit theirs.');
}

/* ================================================================
   TOOLTIPS — touch and hold, action-only phrasing
   ================================================================ */
function initTooltips() {
  let timer = null, bubble = null;
  function show(target) {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    hide();
    bubble = document.createElement('div');
    bubble.className = 'tooltip-bubble';
    bubble.textContent = text;
    document.body.appendChild(bubble);
    const r = target.getBoundingClientRect();
    const left = r.left + r.width / 2 - bubble.offsetWidth / 2;
    bubble.style.left = Math.max(8, Math.min(window.innerWidth - bubble.offsetWidth - 8, left)) + 'px';
    bubble.style.top = Math.max(8, r.top - bubble.offsetHeight - 8) + 'px';
    bubble.classList.add('show');
  }
  function hide() { if (bubble) { bubble.remove(); bubble = null; } }
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(t), 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'scroll'].forEach(ev =>
    document.addEventListener(ev, () => { clearTimeout(timer); hide(); }, true));
}

/* ================================================================
   BOOT
   ================================================================ */
window.addEventListener('DOMContentLoaded', function () {
  loadState();
  const input = document.getElementById('login-username');
  if (input) input.value = (STATE.user && STATE.user.handle) || 'AlphaDawg';
  renderApp();
  initTooltips();

  // Tap outside an open dropdown to dismiss it.
  document.addEventListener('click', function (e) {
    if (!STATE.dropdownOpen) return;
    if (!e.target.closest) return;
    if (e.target.closest('.dropdown-panel') || e.target.closest('.avatar-btn, .pill, .header-icon-btn')) return;
    STATE.dropdownOpen = null;
    renderApp();
  });

  // Escape closes the topmost layer.
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') goBack(); });

  // Wire the browser / Android hardware Back button into our own stack.
  if (window.history && window.history.pushState) {
    history.pushState({ td: true }, '');
    window.addEventListener('popstate', function () {
      goBack();
      history.pushState({ td: true }, '');
    });
  }
});
