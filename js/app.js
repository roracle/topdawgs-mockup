// TopDawgs — router + event delegation. Static, client-only, GitHub Pages-safe.

const root = document.getElementById('app');

function showToast(msg) {
  STATE.toast = msg;
  render();
  setTimeout(() => { STATE.toast = null; renderToastOnly(); }, 2200);
}

function renderToastOnly() {
  const el = document.querySelector('.toast');
  if (el) el.classList.remove('show');
}

function isOnboardingRoute(hash) {
  return hash.startsWith('#/welcome') || hash.startsWith('#/register') || hash.startsWith('#/verify') || hash === '' || hash === '#/' || hash === '#';
}

function resolveScreen(hash) {
  if (hash.startsWith('#/welcome')) return { html: screenWelcome(), bare: true };
  if (hash.startsWith('#/register')) return { html: screenRegister(), bare: true };
  if (hash.startsWith('#/verify')) return { html: screenVerify(), bare: true };

  if (hash.startsWith('#/community')) { STATE.activeTab = 'community'; return { html: topbarTransparent() + screenCommunity(), fab: true, topOverlay: true }; }
  if (hash.startsWith('#/pack/')) {
    STATE.activeTab = 'pack';
    STATE.packSub = hash.split('/')[2] || 'wall';
    const map = { wall: screenPackWall, contacts: screenPackContacts, events: screenPackEvents, havens: screenPackHavens, chat: screenPackChat };
    const fn = map[STATE.packSub] || screenPackWall;
    const isChat = STATE.packSub === 'chat';
    return { html: topbarSolid('Pack') + fn(), fab: !isChat, noBottomPad: isChat };
  }
  if (hash.startsWith('#/body/')) {
    STATE.activeTab = 'body';
    const sub = hash.split('/')[2] || 'diet';
    const fn = sub === 'exercise' ? screenBodyExercise : screenBodyDiet;
    return { html: topbarSolid('Body') + fn(), fab: true };
  }
  if (hash.startsWith('#/mind/')) {
    STATE.activeTab = 'mind';
    const sub = hash.split('/')[2] || 'checklist';
    const map = { videos: screenMindVideos, checklist: screenMindChecklist, soundscapes: screenMindSoundscapes, vault: screenMindVault };
    const fn = map[sub] || screenMindChecklist;
    return { html: topbarSolid('Mind') + fn(), fab: true };
  }
  if (hash.startsWith('#/dm/')) {
    const id = hash.split('/')[2];
    STATE.activeTab = null;
    return { html: screenDM(id), noTopPad: true, hideNav: true };
  }
  if (hash.startsWith('#/notifications')) { STATE.activeTab = null; return { html: screenNotifications() }; }
  if (hash.startsWith('#/profile')) { STATE.activeTab = null; return { html: screenProfile() }; }
  if (hash.startsWith('#/settings')) { STATE.activeTab = null; return { html: screenSettings() }; }
  if (hash.startsWith('#/blocked')) { STATE.activeTab = null; return { html: screenBlocked() }; }
  if (hash.startsWith('#/shop')) { STATE.activeTab = null; return { html: topbarSolid('Shop') + `<div class="screen-inner screen-fade"><div class="empty-state">${ICONS.shop}<div>Regional shop catalog — coming soon in this demo.</div></div></div>` }; }

  STATE.activeTab = 'community';
  return { html: topbarTransparent() + screenCommunity(), fab: true, topOverlay: true };
}

function render() {
  const hash = location.hash || '#/welcome';
  STATE.route = hash;

  if (!STATE.loggedIn && isOnboardingRoute(hash)) {
    root.innerHTML = `
      <div class="device">
        <div class="statusbar"><span>9:41</span><span>100%</span></div>
        <div class="app-shell">${resolveScreen(hash).html}</div>
      </div>`;
    return;
  }
  if (!STATE.loggedIn) { location.hash = '#/welcome'; return; }

  const s = resolveScreen(hash);
  const screenClasses = ['screen'];
  if (s.topOverlay) screenClasses.push('with-topbar');

  root.innerHTML = `
    <div class="device">
      <div class="statusbar"><span>9:41</span><span>100%</span></div>
      <div class="app-shell">
        <div class="${screenClasses.join(' ')}" id="scrollArea">${s.html}</div>
        ${s.fab ? fabPost() : ''}
        ${!s.hideNav ? bottomNav() : ''}
        ${STATE.modalOpen === 'quicksettings' ? quickSettingsPanel() : ''}
        ${STATE.modalOpen === 'post' ? postModal() : ''}
        ${STATE.toast ? `<div class="toast">${STATE.toast}</div>` : ''}
      </div>
    </div>`;

  if (STATE.toast) {
    requestAnimationFrame(() => { const t = document.querySelector('.toast'); if (t) t.classList.add('show'); });
  }
}

window.addEventListener('hashchange', render);

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  const doer = e.target.closest('[data-do]');
  const toast = e.target.closest('[data-toast]');
  const toggle = e.target.closest('[data-toggle]');

  // Overlay backdrops (quick-settings, post modal) carry a close action on
  // the outer div. Only fire it when the click target IS that backdrop —
  // never when it's a descendant — so buttons/toggles inside keep working,
  // and clicking empty padding inside the sheet doesn't close the modal.
  if (doer && doer.classList.contains('modal-overlay') && e.target !== doer) return;

  if (toggle && toggle.tagName === 'INPUT') return; // handled by change event
  if (toast && !doer) { showToast(toast.getAttribute('data-toast')); }

  if (go) {
    const setTab = go.getAttribute('data-set-tab');
    if (setTab) STATE.activeTab = setTab;
    location.hash = go.getAttribute('data-go').split('?')[0];
    if (go.getAttribute('data-go').includes('login=1')) showToast('Demo: log-in flow mirrors registration');
  }

  if (doer) {
    const action = doer.getAttribute('data-do');
    handleAction(action, doer, e);
  }
});

document.addEventListener('change', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const key = toggle.getAttribute('data-toggle');
    const labels = {
      nsfwEnabled: 'Global NSFW', allowDMs: 'Allow DMs', allowFlirts: 'Allow Flirts',
      showSTIOnProfile: 'Show STI status on profile',
    };
    if (key === 'nsfwEnabled' && STATE.user.rank === 'mutt') { e.target.checked = false; showToast('Reach Pack Dawg status to enable NSFW content'); return; }
    STATE.user[key] = e.target.checked;
    render();
    showToast(`${labels[key] || key} ${e.target.checked ? 'enabled' : 'disabled'}`);
  }
  const range = e.target.closest('[data-range]');
  if (range) {
    STATE.user[range.getAttribute('data-range')] = parseInt(e.target.value, 10);
    render();
  }
});

function handleAction(action, el, e) {
  switch (action) {
    case 'open-quicksettings': STATE.modalOpen = 'quicksettings'; render(); break;
    case 'close-quicksettings': STATE.modalOpen = null; render(); break;
    case 'upload-id': STATE.idUploaded = true; render(); break;
    case 'finish-onboarding':
      STATE.loggedIn = true;
      STATE.user.rank = 'mutt';
      STATE.user.idVerified = true;
      location.hash = '#/community';
      render();
      showToast('Welcome to TopDawgs — you\'re a Mutt for now');
      break;
    case 'cycle-community-filter': {
      const order = ['all','pins','posts','havens'];
      STATE.communityFilter = order[(order.indexOf(STATE.communityFilter)+1) % order.length];
      render();
      break;
    }
    case 'set-community-filter': STATE.communityFilter = el.getAttribute('data-filter'); STATE.communityDropdownOpen = false; render(); break;
    case 'toggle-community-dropdown': STATE.communityDropdownOpen = !STATE.communityDropdownOpen; render(); break;
    case 'read-notif': {
      const n = NOTIFICATIONS.find(x => x.id === el.getAttribute('data-id'));
      if (n) n.read = true;
      render(); // also covers the edge case where target === current route (no hashchange fires)
      break;
    }
    case 'open-pin': STATE.openPin = el.getAttribute('data-pin'); render(); break;
    case 'close-pin': STATE.openPin = null; render(); break;
    case 'toggle-checklist': {
      const id = el.getAttribute('data-id');
      const item = CHECKLIST.find(t => t.id === id);
      if (item) { item.done = !item.done; if (item.done) showToast('+0.1 logged'); }
      render();
      break;
    }
    case 'send-chat': {
      const now = Date.now();
      if (now < STATE.chatCooldownUntil) break;
      const input = document.getElementById('chatInput');
      if (input && input.value.trim()) { CHAPTER_CHAT.push({ name: STATE.user.name.split(' ')[0], text: input.value.trim() }); }
      STATE._chatStreak = (STATE._chatStreak || 0) + 1;
      if (STATE._chatStreak >= 3) { STATE.chatCooldownUntil = now + 30000; STATE._chatStreak = 0; setTimeout(render, 30000); }
      render();
      break;
    }
    case 'send-dm': {
      const input = document.getElementById('dmInput');
      if (input && input.value.trim()) { DM_THREAD.push({ from: 'me', text: input.value.trim() }); }
      render();
      break;
    }
    case 'play-sound': STATE.playingSound = el.getAttribute('data-sound'); render(); break;
    case 'stop-sound': STATE.playingSound = null; render(); break;
    case 'open-post-modal': STATE.modalOpen = 'post'; STATE.postMode = 'post'; render(); break;
    case 'close-post-modal': STATE.modalOpen = null; render(); break;
    case 'post-mode-post': STATE.postMode = 'post'; render(); break;
    case 'post-mode-event': STATE.postMode = 'event'; render(); break;
    case 'event-type-casual': STATE.eventType = 'casual'; render(); break;
    case 'event-type-adult': STATE.eventType = 'adult'; render(); break;
    case 'submit-post-modal':
      STATE.modalOpen = null;
      showToast(STATE.postMode === 'event' ? 'Event created' : 'Posted to Wall Feed');
      render();
      break;
    case 'event-scope-local': STATE.eventScope = 'local'; render(); break;
    case 'event-scope-ongoing': STATE.eventScope = 'ongoing'; render(); break;
    case 'event-scope-all': STATE.eventScope = 'all'; render(); break;
  }
}

render();
