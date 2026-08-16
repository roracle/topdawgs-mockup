/* ============================================================
   TOPDAWGS — APP CORE
   Vanilla JS SPA.

   Storage note: every localStorage call is wrapped. Reading it
   unguarded throws in iOS Safari private mode and with third-party
   cookies blocked, which killed boot and left a blank screen in
   the previous build.
   ============================================================ */

const STORE_KEY = 'topdawgs_state_v3';

/* ---------- Safe storage ---------- */
const Store = {
  available: (function () {
    try {
      const k = '__td_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })(),
  get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  remove: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} },
};

var STATE = {
  loggedIn: false,
  user: null,
  notifications: [],
  route: { section: 'community', subsection: null, overlay: null },
  history: [],
  mapFilters: { people: true, havens: true, events: true, restaurants: false, gyms: false, other: false },
  feedMode: 'all',        // all | following
  chatCooldownUntil: 0,
  chatStreak: 0,
  dropdownOpen: null,
  shopTab: 'Themes',
  profileTab: 'posts',
  modal: null,
  replyTo: null,          // {postId, commentId, handle}
  searchQuery: '',
};

function loadState() {
  const raw = Store.get(STORE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    STATE = Object.assign({}, STATE, saved, { dropdownOpen: null, modal: null, replyTo: null });
    if (!STATE.route) STATE.route = { section: 'community', subsection: null, overlay: null };
    if (!Array.isArray(STATE.history)) STATE.history = [];
  } catch (e) { /* corrupt payload — keep defaults */ }
}
function saveState() {
  const persist = Object.assign({}, STATE);
  delete persist.dropdownOpen; delete persist.modal; delete persist.replyTo;
  Store.set(STORE_KEY, JSON.stringify(persist));
}

/* ---------- Small helpers ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function attr(s) { return esc(s).replace(/\n/g, ' '); }
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.classList.remove('show'); }, 2300);
}
function haptic(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms || 8); } catch (e) {} } }

/* Renders post/comment text with tappable hashtags and mentions. */
function richText(text) {
  return esc(text)
    .replace(/#([a-z0-9_]+)/gi, function (m, tag) {
      return '<span class="tag-link" onclick="openTag(\'' + attr(tag) + '\')">#' + esc(tag) + '</span>';
    })
    .replace(/@([a-z0-9_]+)/gi, function (m, h) {
      return '<span class="mention-link" onclick="openHandle(\'' + attr(h) + '\')">@' + esc(h) + '</span>';
    });
}
function openTag(tag) { navigate({ overlay: { type: 'tag', tag: tag } }); }
function openHandle(handle) {
  const u = MOCK_USERS.find(function (x) { return x.handle.toLowerCase() === String(handle).toLowerCase(); });
  if (u) viewProfile(u.id);
  else if (STATE.user.handle.toLowerCase() === String(handle).toLowerCase()) viewProfile(null);
  else toast('No member named @' + handle + '.');
}

/* ================================================================
   NAVIGATION
   ================================================================ */
function sameRoute(a, b) {
  return a.section === b.section && a.subsection === b.subsection &&
    JSON.stringify(a.overlay || null) === JSON.stringify(b.overlay || null);
}
function defaultSubsection(sectionId) {
  const sec = SECTIONS.find(function (s) { return s.id === sectionId; });
  return sec && sec.hasSubsections ? sec.subsections[0].id : null;
}
function navigate(patch, opts) {
  opts = opts || {};
  const next = Object.assign({}, STATE.route, patch);
  if (sameRoute(next, STATE.route)) { STATE.dropdownOpen = null; renderApp(); return; }
  if (!opts.replace) STATE.history.push(Object.assign({}, STATE.route));
  if (STATE.history.length > 50) STATE.history.shift();
  STATE.route = next;
  STATE.dropdownOpen = null;
  STATE.replyTo = null;
  saveState();
  renderApp();
  const main = document.getElementById('app-main');
  if (main) main.scrollTop = 0;
}
function goBack() {
  if (STATE.modal) { closeModal(); return true; }
  if (STATE.dropdownOpen) { STATE.dropdownOpen = null; renderApp(); return true; }
  if (STATE.history.length) {
    STATE.route = STATE.history.pop();
    STATE.replyTo = null;
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
function viewProfile(userId) {
  STATE.profileTab = 'posts';
  navigate({ overlay: { type: 'profile', userId: userId || null } });
}
function openDM(userId) {
  navigate({ section: 'pack', subsection: 'messages', overlay: { type: 'dm', userId: userId } });
}
function openPost(postId) { navigate({ overlay: { type: 'post', postId: postId } }); }
function openSearch() { navigate({ overlay: { type: 'search' } }); }
function openNotifications() { navigate({ overlay: { type: 'notifications' } }); }
function closeOverlay() { if (!goBack()) navigate({ overlay: null }); }

/* ---------- Session ---------- */
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
    STATE.user.integrityParts = { community: .8, pack: .9, body: .7, mind: .8 };
  }
  if (!STATE.notifications || !STATE.notifications.length) STATE.notifications = seedNotifications();
  STATE.route = { section: 'community', subsection: null, overlay: null };
  STATE.history = [];
  saveState();
  renderApp();
  toast(asMutt ? 'Signed in as an unverified Mutt.' : 'Welcome back, ' + STATE.user.handle + '.');
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
  setTimeout(function () { Store.remove(STORE_KEY); STATE.user = null; doLogout(); }, 900);
}

/* ---------- Modals ---------- */
function openModal(type, payload) { STATE.modal = { type: type, payload: payload || {} }; STATE.dropdownOpen = null; renderApp(); }
function closeModal() { STATE.modal = null; renderApp(); }

/* ---------- Toggles ---------- */
function toggleUserFlag(flag) {
  if (flag === 'nsfw' && STATE.user.mutt) { toast('Mutts are locked from enabling Global NSFW.'); return; }
  STATE.user[flag] = !STATE.user[flag];
  saveState();
  renderApp();
  if (flag === 'incognito') {
    toast(STATE.user.incognito ? 'Incognito on — your pin left the map.' : 'Incognito off — you are back on the map.');
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
  toast('Notifications set to ' + mode.charAt(0).toUpperCase() + mode.slice(1) + '.');
}
function toggleMapFilter(id) { STATE.mapFilters[id] = !STATE.mapFilters[id]; saveState(); renderApp(); }
function togglePageNotifs() {
  STATE.user.pageNotifs = STATE.user.pageNotifs === false;
  saveState(); renderApp();
  toast('Page notification preference saved.');
}
function setFeedMode(mode) { STATE.feedMode = mode; saveState(); renderMain(); }

/* ---------- Notification helpers ---------- */
function sectionHasDot(sectionId) {
  if (STATE.user.notifMode === 'classic') return false;
  return unreadForSection(sectionId).length > 0;
}
function jumpToNextNotification(sectionId) {
  const unread = unreadForSection(sectionId);
  if (!unread.length) { goSection(sectionId); return; }
  const n = unread[0];
  n.read = true;
  goSection(sectionId, n.subsection || defaultSubsection(sectionId));
  toast('Jumped to: ' + n.text);
}
function openNotification(id) {
  const n = STATE.notifications.find(function (x) { return x.id === id; });
  if (!n) return;
  n.read = true;
  saveState();
  if (n.targetPostId) openPost(n.targetPostId);
  else if (n.kind === 'message' && n.actorId) openDM(n.actorId);
  else if (n.kind === 'follow' && n.actorId) viewProfile(n.actorId);
  else goSection(n.section, n.subsection || defaultSubsection(n.section));
}

/* ================================================================
   RENDER SHELL
   ================================================================ */
function renderApp() {
  saveState();
  const login = document.getElementById('login-screen');
  const shell = document.getElementById('app-shell');
  if (!STATE.loggedIn) {
    login.classList.remove('hidden');
    shell.classList.add('hidden');
    return;
  }
  login.classList.add('hidden');
  shell.classList.remove('hidden');
  renderHeader();
  renderBottomNav();
  renderMain();
  renderDropdown();
  renderModal();
}

function renderHeader() {
  const r = STATE.route;
  const sec = SECTIONS.find(function (s) { return s.id === r.section; });
  const showBell = STATE.user.notifMode !== 'modern';
  const showDots = STATE.user.notifMode !== 'classic';
  const unread = unreadNotifications().length;

  let pill = '';
  if (r.overlay) {
    const labels = { profile: 'Profile', dm: 'Messages', post: 'Post', search: 'Search', notifications: 'Alerts', tag: 'Tag' };
    pill = '<div class="pill" data-tip="Close" onclick="closeOverlay()">' +
      (labels[r.overlay.type] || 'Close') + ' ' + icon('close', 'chev') + '</div>';
  } else if (r.section === 'community') {
    const n = MAP_FILTERS.filter(function (f) { return STATE.mapFilters[f.id]; }).length;
    pill = '<div class="pill" id="sub-pill" data-tip="Open Filters" onclick="toggleDropdown(\'filter\')">' +
      icon('pin') + ' Filters <span class="pill-count">' + n + '</span> ' + icon('chevronDown', 'chev') + '</div>';
  } else if (sec.hasSubsections) {
    const cur = sec.subsections.find(function (s) { return s.id === r.subsection; }) || sec.subsections[0];
    const dot = showDots && unreadForSection(sec.id).some(function (n) { return n.subsection === r.subsection; });
    pill = '<div class="pill" id="sub-pill" data-tip="Switch Subsection" onclick="toggleDropdown(\'subsection\')">' +
      cur.label + (dot ? ' <span class="dot-red"></span>' : '') + ' ' + icon('chevronDown', 'chev') + '</div>';
  }

  document.getElementById('app-header').innerHTML =
    '<div class="header-left">' +
      (canGoBack() ? '<button class="header-icon-btn" data-tip="Go Back" aria-label="Go back" onclick="goBack()">' + icon('back') + '</button>' : '') +
      '<button class="avatar-btn" data-tip="Open User Menu" aria-label="User menu" onclick="toggleDropdown(\'user\')">' +
        '<span class="avatar-inner">' + icon('user') + '</span></button>' +
      '<button class="header-icon-btn" data-tip="Search" aria-label="Search" onclick="openSearch()">' + icon('search') + '</button>' +
      '<button class="header-icon-btn" data-tip="Open Shop" aria-label="Shop" onclick="openModal(\'shop\')">' + icon('shop') + '</button>' +
      (showBell ? '<button class="header-icon-btn" data-tip="Open Notifications" aria-label="Notifications" onclick="openNotifications()">' +
        icon('bell') + (unread ? '<span class="badge-count">' + (unread > 9 ? '9+' : unread) + '</span>' : '') + '</button>' : '') +
    '</div>' +
    '<div class="header-right">' +
      '<button class="plus-btn" data-tip="Host Event" aria-label="Host event" onclick="openModal(\'hostEvent\')">' + icon('plus') + '</button>' +
      pill +
    '</div>';

  attachPillSwipe();
}

/* Spec: swiping happens on the pill so body scrolling is never hijacked. */
function attachPillSwipe() {
  const pill = document.getElementById('sub-pill');
  if (!pill) return;
  const sec = SECTIONS.find(function (s) { return s.id === STATE.route.section; });
  if (!sec || !sec.hasSubsections) return;
  let startX = null;
  pill.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  pill.addEventListener('touchend', function (e) {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    const ids = sec.subsections.map(function (s) { return s.id; });
    let i = ids.indexOf(STATE.route.subsection);
    if (i < 0) i = 0;
    goSubsection(ids[(i + (dx < 0 ? 1 : ids.length - 1)) % ids.length]);
  });
}

function renderBottomNav() {
  /* Icons only — no text labels. Accessible names come from aria-label. */
  document.getElementById('bottom-nav').innerHTML = SECTIONS.map(function (s) {
    const dot = sectionHasDot(s.id);
    const active = STATE.route.section === s.id && !STATE.route.overlay;
    return '<button class="nav-item ' + (active ? 'active' : '') + '"' +
      ' data-tip="Open ' + s.label + '" aria-label="' + s.label + '"' +
      (active ? ' aria-current="page"' : '') +
      ' onclick="handleNavTap(\'' + s.id + '\')">' +
      icon(s.icon) + (dot ? '<span class="dot-red nav-dot"></span>' : '') + '</button>';
  }).join('');
}
function handleNavTap(sectionId) {
  haptic(8);
  if (STATE.user.notifMode !== 'classic' && unreadForSection(sectionId).length) {
    jumpToNextNotification(sectionId);
    return;
  }
  goSection(sectionId);
}

function toggleDropdown(which) {
  STATE.dropdownOpen = STATE.dropdownOpen === which ? null : which;
  renderApp();
}
function closeDropdownThen(fn) { STATE.dropdownOpen = null; fn(); }

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
    host.innerHTML =
      '<div class="dropdown-panel left" style="width:262px;">' +
        '<div class="dropdown-title">User menu</div>' +
        '<div class="menu-links">' +
          '<span onclick="closeDropdownThen(function(){viewProfile(null);})">My Profile</span>' +
          '<span onclick="closeDropdownThen(function(){openModal(\'settings\');})">Settings</span>' +
        '</div>' +
        toggleRow('Global NSFW (Hookup)', u.nsfw, "toggleUserFlag('nsfw')", u.mutt, u.mutt ? 'Locked for Mutts' : '') +
        toggleRow('Allow DMs', u.allowDMs, "toggleUserFlag('allowDMs')") +
        toggleRow('Allow Flirts', u.allowFlirts, "toggleUserFlag('allowFlirts')") +
        toggleRow('Incognito', u.incognito, "toggleUserFlag('incognito')") +
        '<div class="slider-wrap">' +
          '<div class="dropdown-title" style="padding-left:0;">Location blur radius</div>' +
          '<input type="range" min="0.1" max="5" step="0.1" value="' + u.radius + '" oninput="setRadius(this.value)">' +
          '<div class="slider-value" id="radius-label">' + u.radius.toFixed(1) + ' mi blur</div>' +
        '</div>' +
        '<div class="dropdown-title" style="border-top:1px solid var(--surface-2); padding-top:9px; margin-top:4px;">This page</div>' +
        toggleRow(pageNotifLabel(), u.pageNotifs !== false, 'togglePageNotifs()') +
      '</div>';
  } else if (open === 'filter') {
    host.innerHTML =
      '<div class="dropdown-panel"><div class="dropdown-title">Map filters</div>' +
      MAP_FILTERS.map(function (f) {
        return '<div class="check-row" onclick="toggleMapFilter(\'' + f.id + '\')">' +
          '<div class="checkbox ' + (STATE.mapFilters[f.id] ? 'checked' : '') + '">' + icon('check') + '</div>' +
          '<span>' + f.label + '</span></div>';
      }).join('') + '</div>';
  } else if (open === 'subsection') {
    const sec = SECTIONS.find(function (s) { return s.id === STATE.route.section; });
    host.innerHTML =
      '<div class="dropdown-panel"><div class="dropdown-title">' + sec.label + ' subsections</div>' +
      sec.subsections.map(function (s) {
        const dot = STATE.user.notifMode !== 'classic' &&
          unreadForSection(sec.id).some(function (n) { return n.subsection === s.id; });
        const active = STATE.route.subsection === s.id;
        return '<div class="check-row ' + (active ? 'active' : '') + '" onclick="goSubsection(\'' + s.id + '\')">' +
          '<span style="flex:1;">' + s.label + '</span>' + (dot ? '<span class="dot-red"></span>' : '') + '</div>';
      }).join('') +
      '<div class="dropdown-hint">Swipe the pill to move between subsections.</div></div>';
  }
}
function toggleRow(label, isOn, onclick, locked, note) {
  return '<div class="toggle-row"><span class="label">' + label +
    (note ? '<small>' + note + '</small>' : '') + '</span>' +
    '<div class="switch ' + (isOn ? 'on' : '') + ' ' + (locked ? 'locked' : '') + '"' +
    (locked ? '' : ' onclick="' + onclick + '"') + '><div class="knob"></div></div></div>';
}
function pageNotifLabel() {
  const r = STATE.route;
  if (r.section === 'community') return 'Community updates';
  const sec = SECTIONS.find(function (s) { return s.id === r.section; });
  const sub = sec.subsections && sec.subsections.find(function (s) { return s.id === r.subsection; });
  return sub ? sub.label + ' notifications' : sec.label + ' notifications';
}

/* ================================================================
   MAIN ROUTER
   ================================================================ */
function renderMain() {
  const main = document.getElementById('app-main');
  const r = STATE.route;
  const o = r.overlay;

  if (o) {
    if (o.type === 'profile') { main.innerHTML = renderProfileView(o.userId); return; }
    if (o.type === 'dm') { main.innerHTML = renderDMThread(o.userId); afterDMRender(o.userId); return; }
    if (o.type === 'post') { main.innerHTML = renderPostDetail(o.postId); return; }
    if (o.type === 'search') { main.innerHTML = renderSearch(); afterSearchRender(); return; }
    if (o.type === 'notifications') { main.innerHTML = renderNotificationsPage(); return; }
    if (o.type === 'tag') { main.innerHTML = renderTagPage(o.tag); return; }
  }

  let html = '';
  if (r.section === 'community') html = renderCommunity();
  else if (r.section === 'pack') html = renderPack();
  else if (r.section === 'body') html = renderBody();
  else if (r.section === 'mind') html = renderMind();
  main.innerHTML = html;
  if (r.section === 'pack' && r.subsection === 'chat') scrollThreadToBottom();
}
function scrollThreadToBottom() {
  requestAnimationFrame(function () {
    const t = document.querySelector('.thread');
    if (t) t.scrollTop = t.scrollHeight;
  });
}

/* ---------- Shared partials ---------- */
function avatarFor(userId, size) {
  const u = userById(userId);
  const letter = u ? u.handle.charAt(0).toUpperCase() : '?';
  const online = u && !isMe(userId) && u.online && !u.incognito;
  return '<div class="mini-avatar ' + (size === 'sm' ? 'sm' : '') + '">' + letter +
    '<span class="integrity-emblem" style="background:' + integrityColor(u ? u.integrity : 0) + ';"></span>' +
    (online ? '<span class="online-dot"></span>' : '') + '</div>';
}
function rankBadge(userId) {
  const u = userById(userId);
  if (!u) return '';
  if (u.mutt) return '<span class="badge badge-amber">Mutt</span>';
  if (u.rank === 'TopDawg') return '<span class="badge badge-purple">TopDawg</span>';
  return '';
}

/* ================================================================
   COMMUNITY
   ================================================================ */
function renderCommunity() {
  const hookup = STATE.user.nsfw && !STATE.user.mutt;
  const f = STATE.mapFilters;

  let people = [];
  if (f.people) {
    people = MOCK_USERS.filter(function (u) {
      if (!u.online || u.incognito) return false;     // offline and incognito members leave the map
      if (isBlocked(u.id) || isPaused(u.id)) return false;
      if (hookup && !u.nsfw) return false;            // eyes-only filter
      if (hookup && u.mutt) return false;             // Mutts can never be in NSFW mode
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

  return '' +
    '<div class="map-wrap ' + (hookup ? 'hookup' : '') + '">' +
      '<div class="map-radius" style="width:' + (34 + STATE.user.radius * 13) + '%; height:' + (34 + STATE.user.radius * 13) + '%;"></div>' +
      (meVisible ?
        '<div class="map-pin me" style="left:50%; top:50%;" data-tip="Open My Profile" onclick="viewProfile(null)">' +
          '<div class="pin-avatar">' + icon('paw') +
          '<span class="integrity-emblem" style="background:' + integrityColor(STATE.user.integrity) + ';"></span></div>' +
          '<span class="pin-label">You</span></div>' : '') +
      people.map(function (u) {
        const unread = unreadDMCount(u.id);
        return '<div class="map-pin ' + (hookup && u.nsfw ? 'hookup' : '') + '" style="left:' + u.x + '%; top:' + u.y + '%;"' +
          ' data-tip="' + (unread ? 'Open Messages' : 'Open Profile') + '"' +
          ' onclick="' + (unread ? "openDM('" + u.id + "')" : "viewProfile('" + u.id + "')") + '">' +
          '<div class="pin-avatar">' + icon(hookup && u.nsfw ? 'devil' : 'user') +
          '<span class="integrity-emblem" style="background:' + integrityColor(u.integrity) + ';"></span>' +
          (unread ? '<span class="dm-bubble">' + icon('chat') + unread + '</span>' : '') +
          '</div><span class="pin-label">' + esc(u.handle) + '</span></div>';
      }).join('') +
      statics.map(function (s) {
        return '<div class="map-static-pin" style="left:' + s.x + '%; top:' + s.y + '%;">' + icon('pin') + ' ' + s.label + '</div>';
      }).join('') +
      (nothing ? '<div class="map-empty">' + icon('pin') +
        '<div>Nothing selected. Open the Filters pill to choose what shows on the map.</div></div>' : '') +
    '</div>' +
    '<div class="card map-legend">' +
      (hookup
        ? '<div class="legend-line purple">' + icon('flame') + ' Hookup mode is on</div>' +
          '<p>Eyes-only filter: members without NSFW on are hidden from your view, and the rest switch to NSFW avatars. Messages stay open in both directions no matter whose NSFW is on.</p>'
        : '<div class="legend-line">' + icon('eye') + ' Standard map</div>' +
          '<p>Pins sit inside a ' + STATE.user.radius.toFixed(1) + '-mile ghost zone, never an exact address. The colour chip on the lower left of each icon is that member\u2019s Integrity Rating. A chat bubble means unread messages, and tapping it opens the thread instead of the profile.</p>') +
    '</div>';
}

/* ================================================================
   PACK
   ================================================================ */
function renderPack() {
  const sub = STATE.route.subsection || 'messages';
  if (sub === 'messages') return renderConversations();
  if (sub === 'chat') return renderChat();
  if (sub === 'wall') return renderWall();
  if (sub === 'events') return renderEvents();
  return renderHavens();
}

/* ---------- Messages ---------- */
function renderConversations() {
  if (!STATE.user.allowDMs) {
    return '<div class="empty-state">' + icon('chat') +
      '<div>Direct messages are off. Turn Allow DMs back on in the user menu.</div></div>';
  }
  const convos = conversations();
  return '<div class="stack">' + convos.map(function (c) {
    const preview = c.last ? (c.last.me ? 'You: ' : '') + c.last.text : 'No messages yet';
    return '<div class="card card-row tappable" data-tip="Open Messages" onclick="openDM(\'' + c.user.id + '\')">' +
      '<div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">' +
        avatarFor(c.user.id) +
        '<div style="min-width:0; flex:1;">' +
          '<div class="row-title">' + icon(c.user.nsfw ? 'devil' : 'angel') + ' @' + esc(c.user.handle) + '</div>' +
          '<div class="row-sub" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + esc(preview) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right; flex:none;">' +
        '<div class="row-sub" style="margin:0;">' + (c.last ? timeAgo(c.last.ts) : '') + '</div>' +
        (c.unread ? '<span class="badge badge-cyan" style="margin-top:4px;">' + c.unread + '</span>' : '') +
      '</div></div>';
  }).join('') + '</div>';
}

function renderDMThread(userId) {
  const u = userById(userId);
  if (!u) return '<div class="empty-state">Conversation not found.</div>';
  const msgs = threadFor(userId);
  const lastMine = msgs.filter(function (m) { return m.me; }).slice(-1)[0];

  return '<div class="fill-column">' +
    '<div class="dm-header">' +
      '<div class="headspace-chip ' + (u.nsfw ? 'devil' : 'angel') + '" data-tip="Recipient Headspace">' +
        icon(u.nsfw ? 'devil' : 'angel') +
        '<span>@' + esc(u.handle) + ' \u2014 NSFW ' + (u.nsfw ? 'on' : 'off') + '</span></div>' +
      '<div style="display:flex; gap:2px;">' +
        '<button class="act-btn" data-tip="Open Profile" onclick="viewProfile(\'' + u.id + '\')">' + icon('user') + '</button>' +
        '<button class="act-btn" data-tip="Report Conversation" onclick="openModal(\'report\',{what:\'this conversation\'})">' + icon('flag') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="thread" id="dm-thread">' +
      (msgs.length ? msgs.map(function (m) {
        return '<div class="msg-wrap ' + (m.me ? 'me' : 'them') + '">' +
          '<div class="bubble ' + (m.me ? 'bubble-me' : 'bubble-them') + '">' + esc(m.text) + '</div>' +
          '<div class="bubble-meta">' + timeAgo(m.ts) +
            (m.me && m === lastMine ? (m.read
              ? ' <span class="read">' + icon('checkDouble') + '</span> Read'
              : ' ' + icon('check') + ' Sent') : '') +
          '</div></div>';
      }).join('') : '<div class="empty-state">' + icon('chat') + '<div>No messages yet. Say something.</div></div>') +
      '<div id="typing-slot"></div>' +
    '</div>' +
    ((STATE.user.mutt || u.mutt) ? '<div class="notice">' + icon('shield') +
      ' Mutt protection is active here \u2014 explicit media and Tier 2 flirts are blocked in both directions.</div>' : '') +
    '<div class="chat-input-bar">' +
      '<button data-tip="Share Image" onclick="handleDMImage(\'' + u.id + '\')">' + icon('image') + '</button>' +
      '<input id="dm-input" placeholder="Message @' + attr(u.handle) + '" onkeydown="if(event.key===\'Enter\')sendDM(\'' + u.id + '\')">' +
      '<button data-tip="Send Message" onclick="sendDM(\'' + u.id + '\')">' + icon('send') + '</button>' +
    '</div></div>';
}
function afterDMRender(userId) {
  markThreadRead(userId);
  scrollThreadToBottom();
}
function sendDM(userId) {
  const input = document.getElementById('dm-input');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  sendMessage(userId, text);
  renderMain();
  haptic(8);

  // The other side reads it, then replies — mirrors a real thread.
  clearTimeout(sendDM._read);
  sendDM._read = setTimeout(function () {
    const t = threadFor(userId);
    const mine = t.filter(function (m) { return m.me; }).slice(-1)[0];
    if (mine) mine.read = true;
    saveState();
    if (isDMOpen(userId)) {
      renderMain();
      showTyping(userId);
    }
  }, 1400);
}
function isDMOpen(userId) {
  const o = STATE.route.overlay;
  return o && o.type === 'dm' && o.userId === userId;
}
function showTyping(userId) {
  const slot = document.getElementById('typing-slot');
  if (!slot) return;
  slot.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  scrollThreadToBottom();
  clearTimeout(showTyping._t);
  showTyping._t = setTimeout(function () {
    const replies = ['Sounds good.', 'On my way.', 'Ha, fair enough.', 'Works for me.', 'See you then.'];
    threadFor(userId).push({
      id: 'd' + Date.now(), me: false,
      text: replies[Math.floor(Math.random() * replies.length)],
      ts: Date.now(), read: true,
    });
    saveState();
    if (isDMOpen(userId)) renderMain();
  }, 1800);
}
function handleDMImage(userId) {
  const u = userById(userId);
  if (STATE.user.mutt || u.mutt) { toast('Blocked: explicit media cannot be sent to or from a Mutt.'); return; }
  toast('Gallery image attached.');
}

/* ---------- Regional chat ---------- */
function renderChat() {
  const cooling = Date.now() < STATE.chatCooldownUntil;
  const secs = Math.max(0, Math.ceil((STATE.chatCooldownUntil - Date.now()) / 1000));
  return '<div class="fill-column">' +
    '<div class="notice subtle">' + icon('shield') + ' Chapter chat, Port Arthur. Strictly zero-NSFW \u2014 explicit images are never allowed here.</div>' +
    '<div class="thread" id="chat-thread">' +
      MOCK_CHAT.filter(function (m) { return !isHidden(m.userId); }).map(function (m) {
        const mine = m.userId === 'me';
        return '<div class="chat-line">' +
          avatarFor(m.userId, 'sm') +
          '<div class="who">' +
            '<div class="comment-name">@' + esc(handleOf(m.userId)) + ' ' + rankBadge(m.userId) +
              '<span class="row-sub" style="margin:0 0 0 2px;">' + timeAgo(m.ts) + '</span></div>' +
            '<div class="bubble ' + (mine ? 'bubble-me' : 'bubble-them') + '" style="max-width:100%; margin-top:3px;">' + esc(m.text) + '</div>' +
          '</div>' +
          '<button class="act-btn" data-tip="Report Message" onclick="openModal(\'report\',{what:\'a chat message\'})">' + icon('flag') + '</button>' +
        '</div>';
      }).join('') +
    '</div>' +
    (cooling ? '<div class="cooldown-banner">' + icon('clock') +
      ' Spam filter active \u2014 wait <span id="cool-secs">' + secs + '</span>s</div>' : '') +
    '<div class="chat-input-bar">' +
      '<button data-tip="Share Image" ' + (cooling ? 'disabled' : '') + ' onclick="toast(\'Image shared to chapter chat.\')">' + icon('image') + '</button>' +
      '<input id="chat-input" placeholder="' + (cooling ? 'Cooldown active' : 'Message the chapter') + '" ' +
        (cooling ? 'disabled' : '') + ' onkeydown="if(event.key===\'Enter\')sendChat()">' +
      '<button data-tip="Send Message" onclick="sendChat()" ' + (cooling ? 'disabled' : '') + '>' + icon('send') + '</button>' +
    '</div></div>';
}
function sendChat() {
  if (Date.now() < STATE.chatCooldownUntil) return;
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;
  MOCK_CHAT.push({ id: 'ch' + Date.now(), userId: 'me', text: input.value.trim(), ts: Date.now() });
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
  sendChat._reply = setTimeout(function () {
    if (STATE.route.section !== 'pack' || STATE.route.subsection !== 'chat') return;
    if (STATE.chatStreak > 0 && Math.random() < 0.55) {
      MOCK_CHAT.push({ id: 'ch' + Date.now(), userId: 'u2', text: 'Same. See you there.', ts: Date.now() });
      STATE.chatStreak = 0;
      saveState();
      renderMain();
    }
  }, 2800);
}
function startCooldownTicker() {
  clearInterval(startCooldownTicker._t);
  startCooldownTicker._t = setInterval(function () {
    const left = Math.max(0, Math.ceil((STATE.chatCooldownUntil - Date.now()) / 1000));
    const el = document.getElementById('cool-secs');
    if (el) el.textContent = left;
    if (left <= 0) {
      clearInterval(startCooldownTicker._t);
      if (STATE.route.section === 'pack' && STATE.route.subsection === 'chat') renderMain();
    }
  }, 500);
}

/* ---------- Wall ---------- */
function renderWall() {
  const posts = visiblePosts();
  return '' +
    '<div class="feed-tabs">' +
      '<div class="feed-tab ' + (STATE.feedMode === 'all' ? 'active' : '') + '" onclick="setFeedMode(\'all\')">All</div>' +
      '<div class="feed-tab ' + (STATE.feedMode === 'following' ? 'active' : '') + '" onclick="setFeedMode(\'following\')">Following</div>' +
    '</div>' +
    composerCard() +
    (posts.length ? '<div class="stack">' + posts.map(function (p) { return postCard(p, false); }).join('') + '</div>'
      : '<div class="empty-state">' + icon('users') +
        '<div>' + (STATE.feedMode === 'following'
          ? 'Nothing from people you follow yet. Switch to All, or follow a few members.'
          : 'No posts yet. Write the first one.') + '</div></div>');
}

function composerCard() {
  return '<div class="card">' +
    '<div class="composer">' +
      avatarFor('me') +
      '<textarea id="composer-input" rows="2" maxlength="600" placeholder="Share something with the pack" oninput="updateComposer()"></textarea>' +
    '</div>' +
    '<div class="composer-actions">' +
      '<div class="composer-tools">' +
        '<button class="act-btn" data-tip="Attach Image" onclick="attachComposerImage()">' + icon('image') + '</button>' +
        '<button class="act-btn" data-tip="Add Hashtag" onclick="insertHash()">' + icon('hash') + '</button>' +
      '</div>' +
      '<div style="display:flex; align-items:center; gap:10px;">' +
        '<span class="char-count" id="char-count">600</span>' +
        '<button class="btn btn-primary btn-sm" id="post-btn" onclick="submitPost()" disabled>Post</button>' +
      '</div>' +
    '</div>' +
    '<div id="composer-preview"></div>' +
  '</div>';
}
var composerImage = null;
function updateComposer() {
  const ta = document.getElementById('composer-input');
  const count = document.getElementById('char-count');
  const btn = document.getElementById('post-btn');
  if (!ta) return;
  const left = 600 - ta.value.length;
  count.textContent = left;
  count.className = 'char-count' + (left < 40 ? ' over' : '');
  btn.disabled = !ta.value.trim() && !composerImage;
  ta.style.height = 'auto';
  ta.style.height = Math.min(160, ta.scrollHeight) + 'px';
}
function attachComposerImage() {
  const pool = ['assets/photos/trail.svg', 'assets/photos/gym.svg', 'assets/photos/diner.svg',
                'assets/photos/cabin.svg', 'assets/photos/night.svg', 'assets/photos/pier.svg'];
  composerImage = pool[Math.floor(Math.random() * pool.length)];
  const prev = document.getElementById('composer-preview');
  if (prev) {
    prev.innerHTML = '<div style="position:relative; margin-top:10px;">' +
      '<img class="post-image" src="' + composerImage + '" alt="">' +
      '<button class="act-btn" style="position:absolute; top:6px; right:6px; background:rgba(9,17,30,.8);"' +
      ' onclick="clearComposerImage()">' + icon('close') + '</button></div>';
  }
  updateComposer();
  toast('Photo attached.');
}
function clearComposerImage() {
  composerImage = null;
  const prev = document.getElementById('composer-preview');
  if (prev) prev.innerHTML = '';
  updateComposer();
}
function insertHash() {
  const ta = document.getElementById('composer-input');
  if (!ta) return;
  ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + '#';
  ta.focus();
  updateComposer();
}
function submitPost() {
  const ta = document.getElementById('composer-input');
  if (!ta) return;
  const text = ta.value.trim();
  if (!text && !composerImage) return;
  createPost(text, composerImage);
  composerImage = null;
  renderMain();
  haptic(12);
  toast('Posted.');
}

function postCard(p, detail) {
  const liked = isPostLiked(p.id);
  const saved = isSaved(p.id);
  const mine = p.authorId === 'me';
  const comments = commentCount(p);
  return '<div class="card">' +
    '<div class="post-head">' +
      '<span onclick="viewProfile(' + (mine ? 'null' : "'" + p.authorId + "'") + ')" style="cursor:pointer;">' + avatarFor(p.authorId) + '</span>' +
      '<div class="who">' +
        '<div class="post-name"><span style="cursor:pointer;" onclick="viewProfile(' + (mine ? 'null' : "'" + p.authorId + "'") + ')">@' +
          esc(handleOf(p.authorId)) + '</span> ' + rankBadge(p.authorId) + '</div>' +
        '<div class="post-meta">' + timeAgo(p.ts) + (p.edited ? ' \u00b7 edited' : '') + '</div>' +
      '</div>' +
      '<button class="act-btn" data-tip="More Options" onclick="openModal(\'postMenu\',{id:\'' + p.id + '\'})">' + icon('more') + '</button>' +
    '</div>' +
    (p.text ? '<div class="post-body">' + richText(p.text) + '</div>' : '') +
    (p.image ? '<img class="post-image" src="' + attr(p.image) + '" alt="" loading="lazy">' : '') +
    ((p.likedBy.length || comments || p.shares) ?
      '<div class="post-stats">' +
        (p.likedBy.length ? '<span>' + p.likedBy.length + ' like' + (p.likedBy.length === 1 ? '' : 's') + '</span>' : '') +
        (comments ? '<span>' + comments + ' comment' + (comments === 1 ? '' : 's') + '</span>' : '') +
        (p.shares ? '<span>' + p.shares + ' share' + (p.shares === 1 ? '' : 's') + '</span>' : '') +
      '</div>' : '') +
    '<div class="post-actions">' +
      '<button class="act-btn ' + (liked ? 'liked' : '') + '" data-tip="Like Post" onclick="onLike(\'' + p.id + '\')">' +
        icon(liked ? 'heartFill' : 'heart') + '<span>' + p.likedBy.length + '</span></button>' +
      '<button class="act-btn" data-tip="View Comments" onclick="openPost(\'' + p.id + '\')">' +
        icon('chat') + '<span>' + comments + '</span></button>' +
      '<button class="act-btn" data-tip="Share Post" onclick="onShare(\'' + p.id + '\')">' + icon('share') + '</button>' +
      '<button class="act-btn ' + (saved ? 'saved' : '') + '" data-tip="Save Post" onclick="onSave(\'' + p.id + '\')">' +
        icon(saved ? 'bookmarkFill' : 'bookmark') + '</button>' +
    '</div>' +
    (detail ? '' : '') +
  '</div>';
}
function onLike(id) {
  const now = togglePostLike(id);
  haptic(8);
  renderMain();
  if (now) {
    const p = postById(id);
    if (p.authorId !== 'me') { /* only self-directed notifications are seeded */ }
  }
}
function onSave(id) { const now = toggleSave(id); renderMain(); toast(now ? 'Saved.' : 'Removed from saved.'); }
function onShare(id) {
  const p = postById(id);
  const url = location.href.split('#')[0] + '#post/' + id;
  if (navigator.share) {
    navigator.share({ title: 'TopDawgs', text: p.text.slice(0, 120), url: url })
      .then(function () { sharePost(id); renderMain(); })
      .catch(function () {});
  } else {
    sharePost(id);
    renderMain();
    toast('Share link copied.');
  }
}

/* ---------- Post detail with threaded comments ---------- */
function renderPostDetail(postId) {
  const p = postById(postId);
  if (!p) return '<div class="empty-state">' + icon('chat') + '<div>This post is no longer available.</div></div>';
  const threads = threadComments(p);

  return '<div class="fill-column">' +
    '<div style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">' +
      postCard(p, true) +
      '<div class="card comment-sheet">' +
        '<div class="eyebrow">' + (threads.length ? commentCount(p) + ' comments' : 'No comments yet') + '</div>' +
        (threads.length ? threads.map(function (t) { return commentBlock(p, t); }).join('')
          : '<div class="row-sub">Be the first to reply.</div>') +
      '</div>' +
    '</div>' +
    (STATE.replyTo && STATE.replyTo.postId === p.id ?
      '<div class="reply-context"><span>Replying to @' + esc(STATE.replyTo.handle) + '</span>' +
      '<button onclick="cancelReply()" aria-label="Cancel reply">' + icon('close') + '</button></div>' : '') +
    '<div class="chat-input-bar">' +
      '<input id="comment-input" placeholder="' +
        (STATE.replyTo && STATE.replyTo.postId === p.id ? 'Write a reply' : 'Write a comment') +
        '" onkeydown="if(event.key===\'Enter\')submitComment(\'' + p.id + '\')">' +
      '<button data-tip="Post Comment" onclick="submitComment(\'' + p.id + '\')">' + icon('send') + '</button>' +
    '</div></div>';
}
function commentBlock(post, t) {
  return '<div class="comment">' +
    '<span style="cursor:pointer;" onclick="viewProfile(' + (t.comment.authorId === 'me' ? 'null' : "'" + t.comment.authorId + "'") + ')">' +
      avatarFor(t.comment.authorId, 'sm') + '</span>' +
    '<div class="comment-body">' +
      commentBubble(post, t.comment) +
      (t.replies.length ? '<div class="replies">' + t.replies.map(function (r) {
        return '<div class="comment">' + avatarFor(r.authorId, 'sm') +
          '<div class="comment-body">' + commentBubble(post, r) + '</div></div>';
      }).join('') + '</div>' : '') +
    '</div></div>';
}
function commentBubble(post, c) {
  const liked = c.likedBy.indexOf('me') >= 0;
  const mine = c.authorId === 'me';
  return '<div class="comment-bubble">' +
      '<div class="comment-name">@' + esc(handleOf(c.authorId)) + ' ' + rankBadge(c.authorId) +
        '<span class="row-sub" style="margin:0 0 0 2px;">' + timeAgo(c.ts) + '</span></div>' +
      '<div class="comment-text">' + richText(c.text) + '</div>' +
    '</div>' +
    '<div class="comment-tools">' +
      '<button class="' + (liked ? 'liked' : '') + '" onclick="onCommentLike(\'' + post.id + '\',\'' + c.id + '\')">' +
        (liked ? 'Liked' : 'Like') + (c.likedBy.length ? ' ' + c.likedBy.length : '') + '</button>' +
      (c.parentId ? '' : '<button onclick="startReply(\'' + post.id + '\',\'' + c.id + '\',\'' + attr(handleOf(c.authorId)) + '\')">Reply</button>') +
      (mine ? '<button onclick="onDeleteComment(\'' + post.id + '\',\'' + c.id + '\')">Delete</button>'
            : '<button onclick="openModal(\'report\',{what:\'this comment\'})">Report</button>') +
    '</div>';
}
function onCommentLike(postId, commentId) { toggleCommentLike(postId, commentId); haptic(6); renderMain(); }
function startReply(postId, commentId, handle) {
  STATE.replyTo = { postId: postId, commentId: commentId, handle: handle };
  renderMain();
  const el = document.getElementById('comment-input');
  if (el) el.focus();
}
function cancelReply() { STATE.replyTo = null; renderMain(); }
function submitComment(postId) {
  const input = document.getElementById('comment-input');
  if (!input || !input.value.trim()) return;
  const parentId = (STATE.replyTo && STATE.replyTo.postId === postId) ? STATE.replyTo.commentId : null;
  addComment(postId, input.value.trim(), parentId);
  STATE.replyTo = null;
  input.value = '';
  renderMain();
  haptic(10);
}
function onDeleteComment(postId, commentId) {
  if (deleteComment(postId, commentId)) { renderMain(); toast('Comment deleted.'); }
}

/* ---------- Tag page ---------- */
function renderTagPage(tag) {
  const posts = postsWithTag(tag);
  return '<div class="card card-row">' +
      '<div><div class="section-title">#' + esc(tag) + '</div>' +
      '<div class="row-sub">' + posts.length + ' post' + (posts.length === 1 ? '' : 's') + '</div></div>' +
      icon('hash') +
    '</div>' +
    (posts.length ? '<div class="stack">' + posts.map(function (p) { return postCard(p, false); }).join('') + '</div>'
      : '<div class="empty-state">' + icon('hash') + '<div>Nothing tagged #' + esc(tag) + ' yet.</div></div>');
}

/* ---------- Events ---------- */
function renderEvents() {
  const pending = MOCK_EVENTS.filter(function (e) { return e.needsReview; });
  const upcoming = MOCK_EVENTS.filter(function (e) { return !e.needsReview; })
                              .sort(function (a, b) { return a.ts - b.ts; });
  return '<div class="stack">' +
    pending.map(function (e) {
      return '<div class="card card-highlight">' +
        '<div class="eyebrow">Post-meetup review</div>' +
        '<p class="post-body" style="margin-top:7px;">' + esc(e.title) +
        ' has wrapped. Your rating stays sealed until they submit theirs.</p>' +
        '<button class="btn btn-primary btn-block" style="margin-top:11px;" onclick="openModal(\'review\',{id:\'' + e.id + '\'})">Leave blind review</button>' +
      '</div>';
    }).join('') +
    upcoming.map(function (e) {
      const going = e.going;
      return '<div class="card">' +
        '<div class="card-row">' +
          '<div style="min-width:0;">' +
            '<div class="row-title">' + esc(e.title) + '</div>' +
            '<div class="row-sub">' + icon('calendar') + ' ' + esc(e.dateLabel) + ' \u00b7 ' + esc(e.location) + '</div>' +
            '<div class="row-sub">Hosted by @' + esc(handleOf(e.hostId)) + '</div>' +
          '</div>' +
          '<button class="btn ' + (going ? 'btn-ghost' : 'btn-primary') + ' btn-sm" data-tip="' +
            (going ? 'Cancel RSVP' : 'RSVP to Event') + '" onclick="toggleRSVP(\'' + e.id + '\')">' +
            (going ? 'Going' : 'RSVP') + '</button>' +
        '</div>' +
        '<div class="row-sub" style="margin-top:9px; display:flex; align-items:center; gap:6px;">' +
          icon('users') + ' ' + (e.rsvps.length + (going ? 1 : 0)) + ' attending</div>' +
      '</div>';
    }).join('') + '</div>';
}
function toggleRSVP(id) {
  const e = MOCK_EVENTS.find(function (x) { return x.id === id; });
  e.going = !e.going;
  saveState();
  renderMain();
  haptic(10);
  toast(e.going ? 'You are in.' : 'RSVP removed.');
}

/* ---------- Havens ---------- */
function renderHavens() {
  return '<div class="stack">' + MOCK_HAVENS.map(function (h) {
    return '<div class="card">' +
      '<img class="post-image" style="margin-top:0;" src="' + attr(h.image) + '" alt="" loading="lazy">' +
      '<div class="card-row" style="margin-top:10px;">' +
        '<div><div class="row-title">' + esc(h.name) + '</div>' +
        '<div class="row-sub">Hosted by @' + esc(handleOf(h.hostId)) + ' \u00b7 ' + h.distance + '</div></div>' +
        '<span class="badge badge-cyan">' + icon('spark') + ' ' + h.rating + '</span>' +
      '</div>' +
      '<div class="row-sub" style="margin-top:7px;">' + h.passes + '</div>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:11px;" data-tip="Book Stay" onclick="openModal(\'haven\',{id:\'' + h.id + '\'})">Book stay</button>' +
    '</div>';
  }).join('') + '</div>';
}

/* ================================================================
   BODY
   ================================================================ */
function renderBody() {
  return (STATE.route.subsection || 'nutrition') === 'nutrition' ? renderNutrition() : renderExercise();
}
function meter(label, cur, goal, unit) {
  unit = unit || '';
  return '<div class="card">' +
    '<div class="card-row"><span class="eyebrow">' + label + '</span>' +
    '<span class="row-sub">' + cur + unit + ' / ' + goal + unit + '</span></div>' +
    '<div class="progress-bar-track" style="margin-top:10px;">' +
    '<div class="progress-bar-fill" style="width:' + Math.min(100, (cur / goal) * 100) + '%"></div></div></div>';
}
function renderNutrition() {
  const n = MOCK_NUTRITION;
  return meter('Calories', n.calories.current, n.calories.goal) +
    meter('Hydration', n.water.current, n.water.goal, ' cups') +
    '<div class="card"><div class="eyebrow" style="margin-bottom:6px;">Meals logged today</div>' +
    n.meals.map(function (m) {
      return '<div class="list-row"><span>' + esc(m.name) + '<div class="row-sub">' + timeAgo(m.ts) + '</div></span>' +
        '<span class="row-sub">' + m.cal + ' cal</span></div>';
    }).join('') +
    '<button class="btn btn-primary btn-block" style="margin-top:13px;" onclick="logMeal()">Log a meal</button></div>';
}
function logMeal() {
  MOCK_NUTRITION.meals.push({ name: 'Snack', cal: 180, ts: Date.now() });
  MOCK_NUTRITION.calories.current += 180;
  saveState(); renderMain(); toast('Meal logged.');
}
function renderExercise() {
  const e = MOCK_EXERCISE;
  return meter('Pushups', e.pushups.current, e.pushups.goal) +
    meter('Situps', e.situps.current, e.situps.goal) +
    meter('Cardio', e.cardio.current, e.cardio.goal, ' min') +
    '<button class="btn btn-primary btn-block" onclick="logSet()">Log a set</button>';
}
function logSet() {
  MOCK_EXERCISE.pushups.current = Math.min(MOCK_EXERCISE.pushups.goal, MOCK_EXERCISE.pushups.current + 20);
  MOCK_EXERCISE.situps.current = Math.min(MOCK_EXERCISE.situps.goal, MOCK_EXERCISE.situps.current + 20);
  MOCK_EXERCISE.cardio.current = Math.min(MOCK_EXERCISE.cardio.goal, MOCK_EXERCISE.cardio.current + 6);
  saveState(); renderMain(); toast('Set logged.');
}

/* ================================================================
   MIND
   ================================================================ */
function renderMind() {
  const sub = STATE.route.subsection || 'checklist';
  if (sub === 'checklist') return renderChecklist();
  if (sub === 'modules') return renderModules();
  if (sub === 'sounds') return renderSounds();
  return renderSecrets();
}
function renderChecklist() {
  return '<div class="stack">' + MOCK_CHECKLIST.map(function (c) {
    return '<div class="checklist-item ' + (c.urgent && !c.done ? 'urgent' : '') + '">' +
      '<div class="checkbox ' + (c.done ? 'checked' : '') + '" onclick="toggleCheck(\'' + c.id + '\')">' + icon('check') + '</div>' +
      '<div style="flex:1;">' +
        '<div class="check-text ' + (c.done ? 'done' : '') + '"' + (c.urgent && !c.done ? ' style="color:var(--red-text);"' : '') + '>' + esc(c.text) + '</div>' +
        '<div class="row-sub">' + esc(c.due) + '</div>' +
        (c.cta && !c.done ? '<button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="toast(\'Looking up nearby clinics\')">' + esc(c.cta) + '</button>' : '') +
      '</div></div>';
  }).join('') + '</div>';
}
function toggleCheck(id) {
  const c = MOCK_CHECKLIST.find(function (x) { return x.id === id; });
  c.done = !c.done;
  saveState(); renderMain(); haptic(8);
}
function renderModules() {
  return '<div class="stack">' + MOCK_MODULES.map(function (m) {
    return '<div class="card tappable" onclick="toast(\'Playing ' + attr(m.title) + '\')">' +
      '<div class="card-row"><div><div class="row-title">' + esc(m.title) + '</div>' +
      '<div class="row-sub">' + m.length + (m.progress ? ' \u00b7 ' + m.progress + '% complete' : '') + '</div></div>' +
      '<span class="badge badge-cyan">' + icon('play') + '</span></div>' +
      (m.progress ? '<div class="progress-bar-track" style="margin-top:9px; height:5px;">' +
        '<div class="progress-bar-fill" style="width:' + m.progress + '%"></div></div>' : '') +
    '</div>';
  }).join('') + '</div>';
}
function renderSounds() {
  return '<div class="stack">' + MOCK_SOUNDS.map(function (s) {
    return '<div class="card card-row">' +
      '<div><div class="row-title">' + esc(s.title) + '</div><div class="row-sub">' + s.length + '</div></div>' +
      (s.premium
        ? '<button class="btn btn-ghost btn-sm" onclick="openModal(\'shop\')">' + icon('lock') + ' Unlock</button>'
        : '<button class="btn btn-primary btn-sm" onclick="toast(\'Playing ambient track\')">' + icon('play') + ' Play</button>') +
    '</div>';
  }).join('') + '</div>';
}
function renderSecrets() {
  return '<div class="stack">' +
    '<div class="notice subtle">' + icon('lock') +
    ' Encrypted locker. A screenshot blurs the media instantly, alerts the owner, and logs a device strike.</div>' +
    MOCK_SECRETS.map(function (s) {
      return '<div class="secret-card">' +
        '<div style="display:flex; align-items:center; gap:12px;">' + icon('lock') +
        '<div><div class="row-title">' + esc(s.title) + '</div>' +
        '<div class="row-sub">Unlocks in ' + s.releaseIn + '</div></div></div>' +
        '<span class="badge badge-purple">Sealed</span></div>';
    }).join('') + '</div>';
}

/* ================================================================
   SEARCH
   ================================================================ */
function renderSearch() {
  const q = STATE.searchQuery;
  const res = searchAll(q);
  const trending = trendingTags(8);
  return '<div class="search-bar">' + icon('search') +
      '<input id="search-input" value="' + attr(q) + '" placeholder="Search people, posts, tags" oninput="onSearchInput(this.value)">' +
      (q ? '<button class="act-btn" onclick="onSearchInput(\'\')" aria-label="Clear">' + icon('close') + '</button>' : '') +
    '</div>' +
    (!q ?
      '<div class="card"><div class="eyebrow" style="margin-bottom:10px;">Trending tags</div>' +
        '<div class="chip-wrap">' + trending.map(function (t) {
          return '<span class="tag-chip" onclick="openTag(\'' + attr(t.tag) + '\')">' + icon('hash') + esc(t.tag) +
            ' <span style="opacity:.7;">' + t.count + '</span></span>';
        }).join('') + '</div></div>'
      :
      (res.people.length ? '<div class="card"><div class="eyebrow" style="margin-bottom:10px;">People</div>' +
        res.people.map(function (u) {
          return '<div class="list-row tappable" onclick="viewProfile(\'' + u.id + '\')">' +
            '<div style="display:flex; align-items:center; gap:10px; min-width:0;">' + avatarFor(u.id) +
            '<div style="min-width:0;"><div class="row-title">@' + esc(u.handle) + ' ' + rankBadge(u.id) + '</div>' +
            '<div class="row-sub">' + followerCount(u.id) + ' followers</div></div></div>' +
            followButton(u.id, true) + '</div>';
        }).join('') + '</div>' : '') +
      (res.tags.length ? '<div class="card"><div class="eyebrow" style="margin-bottom:10px;">Tags</div>' +
        '<div class="chip-wrap">' + res.tags.map(function (t) {
          return '<span class="tag-chip" onclick="openTag(\'' + attr(t.tag) + '\')">' + icon('hash') + esc(t.tag) + '</span>';
        }).join('') + '</div></div>' : '') +
      (res.posts.length ? '<div class="eyebrow" style="padding:4px 2px;">Posts</div>' +
        '<div class="stack">' + res.posts.map(function (p) { return postCard(p, false); }).join('') + '</div>' : '') +
      ((!res.people.length && !res.posts.length && !res.tags.length)
        ? '<div class="empty-state">' + icon('search') + '<div>Nothing matches \u201c' + esc(q) + '\u201d.</div></div>' : '')
    );
}
function onSearchInput(v) {
  STATE.searchQuery = v;
  const el = document.getElementById('search-input');
  const pos = el ? el.selectionStart : 0;
  renderMain();
  const el2 = document.getElementById('search-input');
  if (el2) { el2.focus(); try { el2.setSelectionRange(pos, pos); } catch (e) {} }
}
function afterSearchRender() {
  const el = document.getElementById('search-input');
  if (el && !STATE.searchQuery) el.focus();
}
function followButton(userId, small) {
  const f = isFollowing(userId);
  return '<button class="action-chip ' + (f ? 'cyan' : 'filled') + '"' +
    (small ? ' style="padding:6px 11px; font-size:11.5px;"' : '') +
    ' data-tip="' + (f ? 'Unfollow' : 'Follow') + '" onclick="event.stopPropagation(); onFollow(\'' + userId + '\')">' +
    icon(f ? 'userCheck' : 'userPlus') + (f ? 'Following' : 'Follow') + '</button>';
}
function onFollow(userId) {
  const now = toggleFollow(userId);
  haptic(10);
  renderMain();
  toast(now ? 'Following @' + handleOf(userId) + '.' : 'Unfollowed @' + handleOf(userId) + '.');
}

/* ================================================================
   NOTIFICATIONS PAGE
   ================================================================ */
function renderNotificationsPage() {
  const list = STATE.notifications.slice().sort(function (a, b) { return b.ts - a.ts; });
  const unread = unreadNotifications().length;
  return '<div class="card-row" style="padding:2px 2px 6px;">' +
      '<div class="section-title">Notifications</div>' +
      (unread ? '<button class="btn btn-ghost btn-sm" onclick="onMarkAllRead()">Mark all read</button>' : '') +
    '</div>' +
    (list.length ? '<div class="stack">' + list.map(function (n) {
      const who = n.actorId ? '@' + esc(handleOf(n.actorId)) + ' ' : '';
      return '<div class="notif-row ' + (n.read ? '' : 'unread') + '" onclick="openNotification(\'' + n.id + '\')">' +
        (n.actorId ? avatarFor(n.actorId) :
          '<div class="mini-avatar">' + icon(n.kind === 'checklist' ? 'mind' : 'bell') + '</div>') +
        '<div class="notif-text"><b>' + who + '</b>' + esc(n.text) +
        '<div class="notif-time">' + timeAgo(n.ts) + '</div></div>' +
        (n.read ? '' : '<span class="dot-red" style="margin-top:6px;"></span>') +
      '</div>';
    }).join('') + '</div>'
    : '<div class="empty-state">' + icon('bell') + '<div>Nothing new. You are all caught up.</div></div>');
}
function onMarkAllRead() { markAllNotificationsRead(); renderApp(); toast('All caught up.'); }

/* ================================================================
   PROFILE
   ================================================================ */
function renderProfileView(userId) {
  const own = !userId;
  const u = own ? STATE.user : userById(userId);
  if (!u) return '<div class="empty-state">Profile not found.</div>';
  const uid = own ? 'me' : userId;

  const nsfwActive = own
    ? (STATE.user.nsfw && !STATE.user.mutt)
    : (STATE.user.nsfw && u.nsfw && !STATE.user.mutt && !u.mutt);
  const images = u.images || [];
  const parts = u.integrityParts;
  const showSTI = own ? STATE.user.showSTI : u.showSTI !== false;
  const tab = STATE.profileTab;
  const authored = postsByAuthor(uid);

  return '<div class="profile-header">' +
      '<div class="profile-avatar ' + (nsfwActive ? 'nsfw' : '') + '">' + esc(u.handle.charAt(0).toUpperCase()) + '</div>' +
      '<div class="profile-handle ' + (nsfwActive ? 'nsfw' : '') + '">@' + esc(u.handle) + '</div>' +
      '<div class="profile-rank">' + u.rank + (u.mutt ? ' \u00b7 unverified' : '') + '</div>' +
      '<div class="follow-stats">' +
        '<div class="follow-stat"><b>' + authored.length + '</b><span>Posts</span></div>' +
        '<div class="follow-stat" onclick="toast(\'' + followerCount(uid) + ' followers\')"><b>' + followerCount(uid) + '</b><span>Followers</span></div>' +
        '<div class="follow-stat" onclick="toast(\'' + followingCount(uid) + ' following\')"><b>' + followingCount(uid) + '</b><span>Following</span></div>' +
      '</div>' +
      '<div class="integrity-track">' +
        '<div class="integrity-fill"></div>' +
        '<div class="integrity-star ' + (u.integrity >= 4.75 ? 'sparkle' : '') + '" style="left:' +
          Math.min(100, (u.integrity / 5) * 100) + '%; color:' + integrityColor(u.integrity) + ';">' + icon('spark') + '</div>' +
      '</div>' +
      '<div class="row-sub">Integrity Rating ' + u.integrity.toFixed(2) + ' / 5.00</div>' +
      (parts ? '<div class="integrity-parts">Community ' + parts.community.toFixed(1) + ' \u00b7 Pack ' + parts.pack.toFixed(1) +
        ' \u00b7 Body ' + parts.body.toFixed(1) + ' \u00b7 Mind ' + parts.mind.toFixed(1) + '</div>' : '') +
    '</div>' +

    (own ? '' :
    '<div class="action-bar">' +
      followButton(userId) +
      '<button class="action-chip cyan" data-tip="Open Messages" onclick="openDM(\'' + userId + '\')">' + icon('chat') + 'Chat</button>' +
      '<button class="action-chip purple" data-tip="Send Flirt" onclick="openModal(\'flirt\',{id:\'' + userId + '\'})">' + icon('flirt') + 'Flirt</button>' +
      '<button class="action-chip amber" data-tip="Edit Note" onclick="openModal(\'note\',{id:\'' + userId + '\'})">' + icon('note') + 'Note</button>' +
      '<button class="action-chip amber" data-tip="Pause User" onclick="openModal(\'pauseBlock\',{id:\'' + userId + '\'})">' + icon('pause') + 'Pause</button>' +
      '<button class="action-chip red" data-tip="More Options" onclick="openModal(\'userMenu\',{id:\'' + userId + '\'})">' + icon('more') + '</button>' +
    '</div>') +

    '<div class="card">' +
      '<div class="eyebrow" style="margin-bottom:10px;">' + (nsfwActive ? 'Stats \u00b7 NSFW' : 'Stats') + '</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-box"><div class="k">Age</div><div class="v">' + esc(u.age) + '</div></div>' +
        '<div class="stat-box"><div class="k">Height</div><div class="v">' + esc(u.height) + '</div></div>' +
        '<div class="stat-box"><div class="k">Weight</div><div class="v">' + esc(u.weight) + '</div></div>' +
        (nsfwActive ?
          '<div class="stat-box"><div class="k">Position</div><div class="v">' + esc(u.position) + '</div></div>' +
          '<div class="stat-box" style="grid-column:span 2;"><div class="k">Size</div><div class="v">' + esc(u.size) + '</div></div>' : '') +
      '</div>' +
    '</div>' +

    '<div class="card"><div class="eyebrow">About</div>' +
      '<p class="bio-text"' + (own ? ' contenteditable="true" onblur="saveBio(this,\'bio\')"' : '') + '>' +
        (u.bio ? richText(u.bio) : 'Nothing here yet.') + '</p>' +
      '<div class="row-sub" style="margin-top:6px;">Max 500 characters' + (own ? ' \u00b7 tap to edit' : '') + '</div>' +
    '</div>' +

    (nsfwActive ?
    '<div class="card nsfw-card"><div class="eyebrow" style="color:var(--purple-text);">NSFW description</div>' +
      '<p class="bio-text"' + (own ? ' contenteditable="true" onblur="saveBio(this,\'nsfwBio\')"' : '') + '>' +
        esc(u.nsfwBio || 'Nothing here yet.') + '</p>' +
      '<div class="row-sub" style="margin-top:6px;">Visible only when both members have NSFW on.</div></div>' : '') +

    '<div class="card"><div class="eyebrow" style="margin-bottom:8px;">Health</div>' +
      '<div class="list-row">' +
        (showSTI
          ? '<span class="health-line ' + (u.sti.status === 'clear' ? 'ok' : 'stale') + '">' + icon('shield') + ' ' +
            (u.sti.status === 'clear' ? 'STI tested \u00b7 expires in ' + u.sti.expiresInDays + 'd'
              : u.sti.status === 'expired' ? 'Verification expired' : 'Not tested') + '</span>'
          : '<span class="row-sub">STI results hidden</span>') +
      '</div>' +
      '<div class="list-row"><span class="health-line ' + (u.safeSexOnly ? 'ok' : '') + '">' + icon('lock') +
        ' Safe Sex Only' + (u.safeSexOnly ? '' : ' \u2014 off') + '</span></div>' +
      (own ?
        toggleRow('Show STD/STI results on my profile', STATE.user.showSTI, "STATE.user.showSTI=!STATE.user.showSTI; saveState(); renderApp();") +
        toggleRow('Safe Sex Only', STATE.user.safeSexOnly, "STATE.user.safeSexOnly=!STATE.user.safeSexOnly; saveState(); renderApp();") : '') +
    '</div>' +

    '<div class="profile-tabs">' +
      '<div class="feed-tab ' + (tab === 'posts' ? 'active' : '') + '" onclick="setProfileTab(\'posts\')">Posts</div>' +
      '<div class="feed-tab ' + (tab === 'gallery' ? 'active' : '') + '" onclick="setProfileTab(\'gallery\')">Gallery</div>' +
      (own ? '<div class="feed-tab ' + (tab === 'saved' ? 'active' : '') + '" onclick="setProfileTab(\'saved\')">Saved</div>' : '') +
    '</div>' +

    (tab === 'posts'
      ? (authored.length ? '<div class="stack">' + authored.map(function (p) { return postCard(p, false); }).join('') + '</div>'
        : '<div class="empty-state">' + icon('chat') + '<div>No posts yet.</div></div>')
      : tab === 'saved'
      ? (savedPosts().length ? '<div class="stack">' + savedPosts().map(function (p) { return postCard(p, false); }).join('') + '</div>'
        : '<div class="empty-state">' + icon('bookmark') + '<div>Nothing saved yet. Tap the bookmark on any post.</div></div>')
      : '<div class="card"><div class="gallery-grid">' +
          (own ? '<button class="add-image-btn" data-tip="Add Image" onclick="openModal(\'camera\')">' +
            icon('camera') + '<span>Add</span></button>' : '') +
          images.map(function (img) {
            const blur = img.nsfw && !nsfwActive;
            return '<div class="gallery-thumb ' + (blur ? 'blurred' : '') + '" data-tip="' + (blur ? 'Locked' : 'View Image') + '"' +
              ' onclick="' + (blur ? "toast('NSFW media stays hidden unless both members have NSFW on.')"
                : "openModal('imagePreview',{src:'" + attr(img.src) + "',uploaded:" + img.uploaded + "})") + '">' +
              '<img src="' + attr(img.src) + '" alt="" loading="lazy">' +
              (blur ? '<span class="lock-overlay">' + icon('lock') + '</span>' : '') + '</div>';
          }).join('') +
          (!images.length && !own ? '<div class="row-sub" style="grid-column:span 3;">No public photos yet.</div>' : '') +
        '</div></div>');
}
function setProfileTab(t) { STATE.profileTab = t; saveState(); renderMain(); }
function saveBio(el, field) {
  const text = el.textContent.trim().slice(0, 500);
  STATE.user[field] = text;
  saveState();
  renderMain();
  toast('Saved.');
}

/* ================================================================
   MODALS
   ================================================================ */
function renderModal() {
  let host = document.getElementById('modal-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'modal-host';
    document.getElementById('app-shell').appendChild(host);
  }
  if (!STATE.modal) { host.innerHTML = ''; return; }
  const type = STATE.modal.type, p = STATE.modal.payload || {};
  const builders = {
    settings: modalSettings, shop: modalShop, hostEvent: modalHostEvent, camera: modalCamera,
    blockedList: modalBlockedList, deleteConfirm: modalDeleteConfirm, password: modalPassword,
    displayName: modalDisplayName,
    report: function () { return modalReport(p); },
    flirt: function () { return modalFlirt(p.id); },
    note: function () { return modalNote(p.id); },
    pauseBlock: function () { return modalPauseBlock(p.id); },
    imagePreview: function () { return modalImagePreview(p.src, p.uploaded); },
    haven: function () { return modalHaven(p.id); },
    review: function () { return modalReview(p.id); },
    postMenu: function () { return modalPostMenu(p.id); },
    editPost: function () { return modalEditPost(p.id); },
    userMenu: function () { return modalUserMenu(p.id); },
  };
  host.innerHTML = '<div class="modal-backdrop" onclick="if(event.target===this) closeModal()">' +
    '<div class="modal-sheet">' + (builders[type] ? builders[type]() : '') + '</div></div>';
  if (type === 'pauseBlock') initSlideToConfirm();
}
function modalHeader(title) {
  return '<div class="modal-header"><h3>' + title + '</h3>' +
    '<button class="modal-close" data-tip="Close" aria-label="Close" onclick="closeModal()">' + icon('close') + '</button></div>';
}

function modalPostMenu(id) {
  const p = postById(id);
  const mine = p.authorId === 'me';
  return modalHeader('Post options') +
    (mine
      ? '<div class="settings-link" onclick="openModal(\'editPost\',{id:\'' + id + '\'})">' + icon('edit') + '<span>Edit post</span></div>' +
        '<div class="settings-link" onclick="onDeletePost(\'' + id + '\')">' + icon('trash') + '<span>Delete post</span></div>'
      : '<div class="settings-link" onclick="closeModal(); onFollow(\'' + p.authorId + '\')">' +
          icon(isFollowing(p.authorId) ? 'userCheck' : 'userPlus') +
          '<span>' + (isFollowing(p.authorId) ? 'Unfollow' : 'Follow') + ' @' + esc(handleOf(p.authorId)) + '</span></div>' +
        '<div class="settings-link" onclick="closeModal(); onMute(\'' + p.authorId + '\')">' + icon('muted') +
          '<span>' + (isMuted(p.authorId) ? 'Unmute' : 'Mute') + ' @' + esc(handleOf(p.authorId)) + '</span></div>' +
        '<div class="settings-link" onclick="openModal(\'report\',{what:\'this post\'})">' + icon('flag') + '<span>Report post</span></div>') +
    '<div class="settings-link" onclick="closeModal(); onSave(\'' + id + '\')">' +
      icon(isSaved(id) ? 'bookmarkFill' : 'bookmark') + '<span>' + (isSaved(id) ? 'Remove from saved' : 'Save post') + '</span></div>';
}
function onDeletePost(id) {
  if (deletePost(id)) {
    closeModal();
    if (STATE.route.overlay && STATE.route.overlay.type === 'post') goBack(); else renderMain();
    toast('Post deleted.');
  }
}
function modalEditPost(id) {
  const p = postById(id);
  return modalHeader('Edit post') +
    '<textarea id="edit-post-text" class="text-area" rows="5">' + esc(p.text) + '</textarea>' +
    '<button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="submitEditPost(\'' + id + '\')">Save changes</button>';
}
function submitEditPost(id) {
  const v = document.getElementById('edit-post-text').value.trim();
  if (v) editPost(id, v);
  closeModal();
  renderMain();
  toast('Post updated.');
}
function onMute(userId) {
  const now = toggleMute(userId);
  renderMain();
  toast(now ? 'Muted @' + handleOf(userId) + '.' : 'Unmuted @' + handleOf(userId) + '.');
}
function modalUserMenu(userId) {
  return modalHeader('@' + esc(handleOf(userId))) +
    '<div class="settings-link" onclick="closeModal(); onMute(\'' + userId + '\')">' + icon('muted') +
      '<span>' + (isMuted(userId) ? 'Unmute' : 'Mute') + ' their posts</span></div>' +
    '<div class="settings-link" onclick="openModal(\'report\',{what:\'this profile\'})">' + icon('flag') + '<span>Report profile</span></div>' +
    '<div class="settings-link" onclick="openModal(\'pauseBlock\',{id:\'' + userId + '\'})">' + icon('block') + '<span>Pause or block</span></div>';
}

function modalSettings() {
  const u = STATE.user;
  return modalHeader('Settings') +
    '<div class="settings-link" onclick="openModal(\'password\')">' + icon('key') + '<span>Password and credentials</span></div>' +
    '<div class="settings-link" onclick="openModal(\'displayName\')">' + icon('user') + '<span>Display name \u2014 @' + esc(u.handle) + '</span></div>' +
    '<div style="padding:15px 2px 4px;">' +
      '<div class="eyebrow" style="margin-bottom:10px;">Notification mode</div>' +
      '<div class="seg-tabs">' + ['classic', 'modern', 'both'].map(function (m) {
        return '<div class="seg-tab ' + (u.notifMode === m ? 'active' : '') + '" onclick="setNotifMode(\'' + m + '\')">' +
          m.charAt(0).toUpperCase() + m.slice(1) + '</div>';
      }).join('') + '</div>' +
      '<p class="row-sub" style="margin-top:10px; line-height:1.55;">Classic shows only the bell. Modern shows red dots with auto-jump and removes the bell. Both runs them together.</p>' +
    '</div>' +
    '<button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="openModal(\'blockedList\')">' +
      icon('shield') + ' Blocked, paused and muted</button>' +
    (Store.available ? '' : '<div class="notice" style="margin-top:12px;">' + icon('shield') +
      ' Storage is blocked in this browser, so settings will reset when you close the tab.</div>') +
    '<div class="modal-footer-actions">' +
      '<button class="btn btn-amber" onclick="doLogout()">' + icon('logout') + ' Log out</button>' +
      '<button class="btn btn-danger" onclick="openModal(\'deleteConfirm\')">' + icon('trash') + ' Delete account</button>' +
    '</div>';
}
function modalPassword() {
  return modalHeader('Password') +
    '<div class="field"><label>Current password</label><input type="password" placeholder="Current password"></div>' +
    '<div class="field" style="margin-top:11px;"><label>New password</label><input type="password" placeholder="New password"></div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="closeModal(); toast(\'Password updated.\')">Update password</button>';
}
function modalDisplayName() {
  return modalHeader('Display name') +
    '<div class="field"><label>Public handle</label><input id="dn-input" value="' + attr(STATE.user.handle) + '"></div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="saveDisplayName()">Save name</button>';
}
function saveDisplayName() {
  const v = document.getElementById('dn-input').value.trim();
  if (v) STATE.user.handle = v;
  saveState(); closeModal(); renderApp(); toast('Display name updated.');
}
function modalDeleteConfirm() {
  return modalHeader('Delete account') +
    '<p class="modal-copy">This starts a 30-day soft-delete grace period. After that, every profile record, media upload, and personal log is purged from primary and backup databases.</p>' +
    '<div class="modal-footer-actions">' +
      '<button class="btn btn-ghost" onclick="openModal(\'settings\')">Cancel</button>' +
      '<button class="btn btn-danger" onclick="doDeleteAccount()">Confirm deletion</button></div>';
}
function modalBlockedList() {
  const b = STATE.user.blockedUsers || [], p = STATE.user.pausedUsers || [], m = STATE.user.mutedUsers || [];
  return modalHeader('Blocked, paused and muted') +
    ((!b.length && !p.length && !m.length) ? '<div class="empty-state">' + icon('shield') + '<div>Nobody is restricted.</div></div>' : '') +
    b.map(function (h) {
      return '<div class="list-row"><span class="health-line">' + icon('block') + ' @' + esc(h) + '</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="unrestrict(\'' + attr(h) + '\')">Unblock</button></div>';
    }).join('') +
    p.map(function (x) {
      return '<div class="list-row"><span class="health-line amber">' + icon('pause') + ' @' + esc(x.handle) + ' \u2014 ' + x.days + 'd left</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="unrestrict(\'' + attr(x.handle) + '\')">Unpause</button></div>';
    }).join('') +
    m.map(function (h) {
      return '<div class="list-row"><span class="health-line">' + icon('muted') + ' @' + esc(h) + '</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="unrestrict(\'' + attr(h) + '\')">Unmute</button></div>';
    }).join('');
}
function unrestrict(handle) {
  STATE.user.blockedUsers = (STATE.user.blockedUsers || []).filter(function (h) { return h !== handle; });
  STATE.user.pausedUsers = (STATE.user.pausedUsers || []).filter(function (x) { return x.handle !== handle; });
  STATE.user.mutedUsers = (STATE.user.mutedUsers || []).filter(function (h) { return h !== handle; });
  saveState(); renderModal(); toast('@' + handle + ' restored.');
}

function modalShop() {
  const tab = STATE.shopTab;
  return modalHeader('Shop') +
    '<div class="points-row">' +
      '<div class="points-card"><div class="k">Lifetime Pack Points</div><div class="v">' + STATE.user.lifetimePoints + '</div><div class="k">reputation only</div></div>' +
      '<div class="points-card"><div class="k">Spendable</div><div class="v">' + STATE.user.spendablePoints.toFixed(2) + '</div><div class="k">usable here</div></div>' +
    '</div>' +
    '<div class="seg-tabs" style="margin:15px 0;">' + SHOP_TABS.map(function (t) {
      return '<div class="seg-tab ' + (tab === t ? 'active' : '') + '" onclick="STATE.shopTab=\'' + t + '\'; renderModal();">' + t + '</div>';
    }).join('') + '</div>' +
    '<div class="stack">' + SHOP_ITEMS[tab].map(function (i, idx) {
      return '<div class="shop-item"><span class="name">' + esc(i.name) + '</span>' +
        '<div style="display:flex; align-items:center; gap:11px;">' +
        '<span class="price">' + i.price + ' pts</span>' +
        '<button class="btn btn-primary btn-sm" onclick="purchaseItem(\'' + tab + '\',' + idx + ')">Buy</button></div></div>';
    }).join('') + '</div>';
}
function purchaseItem(tab, idx) {
  const item = SHOP_ITEMS[tab][idx];
  if (STATE.user.spendablePoints < item.price) { toast('Not enough spendable Pack Points.'); return; }
  STATE.user.spendablePoints = Number((STATE.user.spendablePoints - item.price).toFixed(2));
  saveState(); renderModal(); toast(item.name + ' unlocked.');
}

function modalHostEvent() {
  return modalHeader('Host an event') +
    '<div class="field"><label>Event name</label><input id="ev-title" placeholder="Saturday trail run"></div>' +
    '<div class="field" style="margin-top:11px;"><label>When</label><input id="ev-date" placeholder="Sat 8:00 AM"></div>' +
    '<div class="field" style="margin-top:11px;"><label>Where</label><input id="ev-loc" placeholder="Riverside Park"></div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="hostEvent()">Create event</button>';
}
function hostEvent() {
  const title = document.getElementById('ev-title').value.trim() || 'Untitled meetup';
  const date = document.getElementById('ev-date').value.trim() || 'Date to be set';
  const loc = document.getElementById('ev-loc').value.trim() || 'Location to be set';
  MOCK_EVENTS.push({ id: 'e' + Date.now(), title: title, hostId: 'me', ts: Date.now() + 3 * DAY,
    dateLabel: date, location: loc, rsvps: [], going: true });
  saveState();
  closeModal();
  goSection('pack', 'events');
  toast('Event created.');
}

function modalFlirt(userId) {
  const u = userById(userId);
  const both = STATE.user.nsfw && u.nsfw && !STATE.user.mutt && !u.mutt;
  const t1 = [['smile', 'Hey'], ['wink', 'Wink'], ['heartFill', 'Into you']];
  const t2 = [['flame', 'Heat'], ['devil', 'Trouble'], ['spark', 'Tonight']];
  return modalHeader('Flirt with @' + esc(u.handle)) +
    '<div class="flirt-tier-label">Tier 1 \u2014 anyone</div>' +
    '<div class="flirt-row">' + t1.map(function (p) {
      return '<button class="flirt-opt" data-tip="Send ' + p[1] + '" onclick="sendFlirt(\'' + p[1] + '\')">' +
        icon(p[0]) + '<span>' + p[1] + '</span></button>';
    }).join('') + '</div>' +
    '<div class="flirt-tier-label ' + (both ? '' : 'locked') + '">Tier 2 \u2014 both members in NSFW mode' + (both ? '' : ' \u00b7 locked') + '</div>' +
    '<div class="flirt-row">' + t2.map(function (p) {
      return '<button class="flirt-opt purple ' + (both ? '' : 'locked') + '"' +
        (both ? ' onclick="sendFlirt(\'' + p[1] + '\')"' : '') + '>' +
        icon(both ? p[0] : 'lock') + '<span>' + p[1] + '</span></button>';
    }).join('') + '</div>' +
    (both ? '' : '<p class="row-sub" style="margin-top:13px;">' +
      (u.mutt ? 'Tier 2 flirts can never be sent to a Mutt.' : 'Tier 2 unlocks when you and they both have NSFW on.') + '</p>');
}
function sendFlirt(label) { closeModal(); haptic(12); toast('Flirt sent: ' + label + '.'); }

function modalNote(userId) {
  const existing = (STATE.user.notesOnUsers || {})[userId] || '';
  return modalHeader('Private note \u00b7 @' + esc(handleOf(userId))) +
    '<textarea id="note-text" rows="5" class="text-area" placeholder="Only you can see this.">' + esc(existing) + '</textarea>' +
    '<button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="saveNote(\'' + userId + '\')">Save note</button>';
}
function saveNote(userId) {
  if (!STATE.user.notesOnUsers) STATE.user.notesOnUsers = {};
  STATE.user.notesOnUsers[userId] = document.getElementById('note-text').value;
  saveState(); closeModal(); toast('Note saved.');
}

function modalPauseBlock(userId) {
  return modalHeader('Pause or block @' + esc(handleOf(userId))) +
    '<div class="mode-switch-row">' +
      '<span id="pb-mode-label" class="mode-label pause">Mode: Pause</span>' +
      '<div class="switch" id="pb-mode-toggle" onclick="togglePauseBlockMode()"><div class="knob"></div></div>' +
    '</div><div id="pb-body" data-user="' + userId + '">' + pauseBody() + '</div>';
}
function pauseBody() {
  return '<p class="row-sub" style="margin-bottom:11px;">Pause hides them for a set time, then lifts on its own. No permanent record.</p>' +
    '<input type="range" min="1" max="14" value="1" id="pb-slider" class="pause-slider" oninput="updatePauseDays(this.value)">' +
    '<div class="pause-days"><span id="pb-days">1</span> day pause</div>' +
    '<div class="slide-track yellow" id="slide-track">' +
      '<div class="slide-label yellow">Slide to confirm pause</div>' +
      '<div class="slide-thumb yellow" id="slide-thumb"><span id="pb-days-thumb">1d</span></div></div>';
}
function blockBody() {
  return '<p class="row-sub" style="margin-bottom:11px;">Block is permanent across every view until you undo it in Settings.</p>' +
    '<div class="slide-track" id="slide-track">' +
      '<div class="slide-label">Slide to confirm permanent block</div>' +
      '<div class="slide-thumb" id="slide-thumb">' + icon('block') + '</div></div>';
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
    thumb.style.transform = 'translateX(' + nx + 'px)';
    if (nx >= maxX - 3) { fired = true; dragging = false; confirmSlide(); }
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    if (!fired) { thumb.style.transition = 'transform .18s ease'; thumb.style.transform = 'translateX(0px)'; }
  }
  const mm = function (e) { move(e.clientX); };
  const tm = function (e) { move(e.touches[0].clientX); };
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
  const u = userById(userId);
  const slider = document.getElementById('pb-slider');
  if (initSlideToConfirm._cleanup) initSlideToConfirm._cleanup();
  if (isBlock) {
    STATE.user.blockedUsers = STATE.user.blockedUsers || [];
    if (STATE.user.blockedUsers.indexOf(u.handle) < 0) STATE.user.blockedUsers.push(u.handle);
    toast('@' + u.handle + ' blocked.');
  } else {
    const days = slider ? parseInt(slider.value, 10) : 1;
    STATE.user.pausedUsers = (STATE.user.pausedUsers || []).filter(function (x) { return x.handle !== u.handle; });
    STATE.user.pausedUsers.push({ handle: u.handle, days: days });
    toast('@' + u.handle + ' paused for ' + days + ' day' + (days > 1 ? 's' : '') + '.');
  }
  saveState();
  closeModal();
  if (STATE.route.overlay) goBack();
}

function modalReport(p) {
  const what = (p && p.what) || 'this content';
  return modalHeader('Report') +
    '<p class="modal-copy">Reports on ' + esc(what) + ' go into The Pound with a 24-hour review commitment. Filing one never interrupts what you were doing.</p>' +
    '<textarea rows="4" class="text-area" style="margin-top:12px;" placeholder="Add context (optional)"></textarea>' +
    '<button class="btn btn-danger btn-block" style="margin-top:12px;" onclick="closeModal(); toast(\'Report filed with The Pound.\')">Submit report</button>';
}

function modalCamera() {
  const today = new Date().toDateString();
  const claimed = STATE.user.lastPhotoRewardDate === today;
  return modalHeader('Camera') +
    '<div class="camera-frame">' + icon('camera') + '</div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="snapPhoto()">Take and upload photo</button>' +
    '<p class="row-sub" style="margin-top:11px;">' +
    (claimed ? 'Today\u2019s +0.01 reward is already claimed.' : 'The first upload each day earns +0.01 Pack Points.') + '</p>';
}
function snapPhoto() {
  const today = new Date().toDateString();
  const pool = ['assets/photos/pier.svg', 'assets/photos/gym.svg', 'assets/photos/trail.svg'];
  STATE.user.images = STATE.user.images || [];
  STATE.user.images.unshift({
    id: 'o' + Date.now(),
    src: pool[Math.floor(Math.random() * pool.length)],
    uploaded: Date.now(), nsfw: false,
  });
  if (STATE.user.lastPhotoRewardDate !== today) {
    STATE.user.spendablePoints = Number((STATE.user.spendablePoints + 0.01).toFixed(2));
    STATE.user.lastPhotoRewardDate = today;
    toast('Photo uploaded \u2014 +0.01 Pack Points.');
  } else {
    toast('Photo uploaded.');
  }
  saveState(); closeModal(); renderMain();
}

function modalImagePreview(src, uploaded) {
  return modalHeader('Photo') +
    '<div class="image-preview"><img src="' + attr(src) + '" alt=""></div>' +
    '<div class="image-stamp">' + icon('clock') + ' Uploaded ' + esc(timeFull(uploaded)) + '</div>';
}

function modalHaven(id) {
  const h = MOCK_HAVENS.find(function (x) { return x.id === id; });
  return modalHeader(esc(h.name)) +
    '<p class="modal-copy">Hosted by @' + esc(handleOf(h.hostId)) + ' \u00b7 ' + h.distance + ' \u00b7 ' + h.passes + '</p>' +
    '<div class="notice subtle" style="margin-top:12px;">' + icon('shield') +
    ' You get an automated check-in ping every 12 hours. Miss two inside a 30-minute window and your emergency contact is alerted. Havens are peer sanctuaries \u2014 the host sets the ground rules and can end a stay at any time. No tenancy rights attach.</div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="requestHavenStay(\'' + attr(handleOf(h.hostId)) + '\')">Request stay</button>';
}
function requestHavenStay(host) { closeModal(); toast('Stay request sent to @' + host + '.'); }

function modalReview(eventId) {
  const e = MOCK_EVENTS.find(function (x) { return x.id === eventId; });
  return modalHeader('Blind review') +
    '<p class="modal-copy">' + esc(e.title) + ' \u2014 your rating stays sealed until both sides submit. It feeds the Community quarter of their Integrity Rating.</p>' +
    '<div class="review-row" id="review-stars">' + [1, 2, 3, 4, 5].map(function (n) {
      return '<button class="star-btn" data-n="' + n + '" onclick="pickStars(' + n + ')" aria-label="' + n + ' stars">' + icon('spark') + '</button>';
    }).join('') + '</div>' +
    '<button class="btn btn-primary btn-block" style="margin-top:14px;" onclick="submitReview(\'' + eventId + '\')">Submit sealed review</button>';
}
function pickStars(n) {
  const btns = document.querySelectorAll('#review-stars .star-btn');
  Array.prototype.forEach.call(btns, function (b) {
    b.classList.toggle('on', parseInt(b.getAttribute('data-n'), 10) <= n);
  });
  pickStars._v = n;
}
function submitReview(eventId) {
  const e = MOCK_EVENTS.find(function (x) { return x.id === eventId; });
  e.needsReview = false;
  saveState(); closeModal(); renderMain();
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
    bubble.style.left = Math.max(8, Math.min(window.innerWidth - bubble.offsetWidth - 8,
      r.left + r.width / 2 - bubble.offsetWidth / 2)) + 'px';
    bubble.style.top = Math.max(8, r.top - bubble.offsetHeight - 8) + 'px';
    bubble.classList.add('show');
    haptic(5);
  }
  function hide() { if (bubble) { bubble.remove(); bubble = null; } }
  document.addEventListener('pointerdown', function (e) {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) return;
    clearTimeout(timer);
    timer = setTimeout(function () { show(t); }, 450);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'scroll'].forEach(function (ev) {
    document.addEventListener(ev, function () { clearTimeout(timer); hide(); }, true);
  });
}

/* ================================================================
   BOOT
   ================================================================ */
function boot() {
  loadState();
  const input = document.getElementById('login-username');
  if (input) input.value = (STATE.user && STATE.user.handle) || 'AlphaDawg';
  renderApp();
  initTooltips();

  if (!Store.available) {
    const hint = document.getElementById('install-hint');
    if (hint) hint.textContent = 'Storage is blocked in this browser, so your session will not persist. Everything else works.';
  }

  document.addEventListener('click', function (e) {
    if (!STATE.dropdownOpen || !e.target.closest) return;
    if (e.target.closest('.dropdown-panel') || e.target.closest('.avatar-btn, .pill, .header-icon-btn')) return;
    STATE.dropdownOpen = null;
    renderApp();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') goBack(); });

  if (window.history && window.history.pushState) {
    history.pushState({ td: true }, '');
    window.addEventListener('popstate', function () {
      goBack();
      history.pushState({ td: true }, '');
    });
  }

  // Deep links: #pack/wall, #post/p1
  const hash = location.hash.replace('#', '');
  if (hash && STATE.loggedIn) {
    const parts = hash.split('/');
    if (parts[0] === 'post') openPost(parts[1]);
    else if (SECTIONS.some(function (s) { return s.id === parts[0]; })) goSection(parts[0], parts[1]);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
