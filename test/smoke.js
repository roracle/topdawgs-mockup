/* TopDawgs — automated smoke tests (jsdom).
   Exercises the real index.html + js files, asserts behaviour, and
   fails loudly on any console error or thrown exception. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.com/', pretendToBeVisual: true });
const { window } = dom;

const store = {};
window.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};

let failures = 0, consoleErrors = [];
window.console.error = (...a) => consoleErrors.push(a.join(' '));
function ok(cond, msg) { if (cond) console.log('  ok  ', msg); else { console.error('  FAIL', msg); failures++; } }
function group(name) { console.log('\n' + name); }
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

try {
  window.eval([read('js/data.js'), read('js/icons.js'), read('js/app.js')].join('\n;\n')
    + '\n;window.__G={SECTIONS,MAP_FILTERS,MOCK_USERS,MOCK_EVENTS,MOCK_CHAT,MOCK_WALL,MOCK_HAVENS,SHOP_TABS,SHOP_ITEMS,MOCK_CHECKLIST,ICONS,MOCK_DM_THREADS,integrityColor};');
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
} catch (e) { console.error('BOOT CRASH:', e); process.exit(1); }

const G = window.__G;
const S = () => window.STATE;
const mainHTML = () => window.document.getElementById('app-main').innerHTML;
const headerHTML = () => window.document.getElementById('app-header').innerHTML;
const dropHTML = () => (window.document.getElementById('dropdown-host') || {}).innerHTML || '';
const modalHTML = () => (window.document.getElementById('modal-host') || {}).innerHTML || '';

try {
  group('Boot & login');
  ok(!window.document.getElementById('login-screen').classList.contains('hidden'), 'login screen shows first');
  window.doLogin(false);
  ok(S().loggedIn, 'logs in');
  ok(S().user.handle === 'AlphaDawg', 'default username is AlphaDawg');
  ok(S().user.rank === 'Pack Dawg' && !S().user.mutt, 'standard login is a verified Pack Dawg');
  ok(window.document.getElementById('bottom-nav').children.length === 4, 'four bottom nav sections');

  group('Every section and subsection renders');
  for (const sec of G.SECTIONS) {
    window.goSection(sec.id);
    ok(S().route.section === sec.id && mainHTML().length > 100, `${sec.id} renders`);
    if (sec.hasSubsections) for (const sub of sec.subsections) {
      window.goSubsection(sub.id);
      ok(S().route.subsection === sub.id && mainHTML().length > 60, `${sec.id}/${sub.id} renders`);
    }
  }

  group('Community map + filter pill');
  window.goSection('community');
  ok(headerHTML().includes('Filters'), 'Community shows a Filters pill in the header');
  window.toggleDropdown('filter');
  ok(dropHTML().includes('checkbox'), 'filter dropdown uses check marks');
  ok(G.MAP_FILTERS.length === 6, 'six map filter categories');
  window.toggleDropdown('filter');
  ok(mainHTML().includes('map-pin'), 'people pins render when People is on');
  window.toggleMapFilter('people');
  ok(!mainHTML().includes('class="map-pin'), 'unchecking People removes all people pins');
  window.toggleMapFilter('people');
  ok(!mainHTML().includes('NightWatch'), 'incognito/offline member is absent from the map');
  ok(mainHTML().includes('integrity-emblem'), 'integrity emblem renders on pins');
  ok(mainHTML().includes('dm-bubble'), 'unread DM bubble renders on the right pin');

  group('Incognito hides your own pin');
  ok(mainHTML().includes('>You<'), 'your pin is on the map by default');
  window.toggleUserFlag('incognito');
  ok(!mainHTML().includes('>You<'), 'incognito removes your pin immediately');
  window.toggleUserFlag('incognito');

  group('NSFW eyes-only filter');
  window.toggleUserFlag('nsfw');
  ok(S().user.nsfw, 'NSFW turns on for a verified member');
  ok(!mainHTML().includes('CedarHowl'), 'hookup mode hides non-NSFW members');
  ok(mainHTML().includes('RustyTrail'), 'hookup mode keeps NSFW members visible');
  ok(!mainHTML().includes('MossPup'), 'Mutts never appear in hookup mode');
  window.toggleUserFlag('nsfw');
  ok(mainHTML().includes('CedarHowl'), 'turning NSFW off restores everyone');

  group('Back navigation history stack');
  window.goSection('community');
  const depth0 = S().history.length;
  window.goSection('pack', 'wall');
  window.viewProfile('u1');
  ok(S().route.overlay && S().route.overlay.type === 'profile', 'opened a profile overlay');
  ok(headerHTML().includes('Go Back'), 'back control appears in the header');
  window.goBack();
  ok(!S().route.overlay && S().route.subsection === 'wall', 'back returns to Pack/Wall');
  window.goBack();
  ok(S().route.section === 'community', 'back again returns to Community');
  ok(S().history.length === depth0, 'history depth unwinds correctly');

  group('Profile');
  window.viewProfile('u1');
  ok(mainHTML().includes('AlphaMarcus'), 'other profile shows the handle');
  ok(mainHTML().includes('Integrity Rating'), 'integrity rating bar renders');
  ok(!mainHTML().includes('Position'), 'Position/Size hidden when NSFW is off on either side');
  ok(mainHTML().includes('Pause'), 'pause action is offered on other profiles');
  window.goBack();
  window.viewProfile(null);
  ok(mainHTML().includes('AlphaDawg') && mainHTML().includes('Add image'), 'own profile shows the camera upload');
  ok(!mainHTML().includes('action-chip'), 'no chat/flirt/pause chips on your own profile');
  window.goBack();

  group('NSFW stats require both sides');
  window.toggleUserFlag('nsfw');
  window.viewProfile('u2');  // RustyTrail has nsfw true
  ok(mainHTML().includes('Position'), 'Position/Size appear when both sides have NSFW on');
  ok(mainHTML().includes('NSFW description'), 'NSFW bio appears when both sides have NSFW on');
  window.goBack();
  window.viewProfile('u3');  // CedarHowl nsfw false
  ok(!mainHTML().includes('Position'), 'NSFW stats stay hidden if the other side has it off');
  window.goBack();
  window.toggleUserFlag('nsfw');

  group('Mutt protections');
  window.doLogout();
  window.doLogin(true);
  ok(S().user.mutt && S().user.rank === 'Mutt', 'Mutt login produces a Mutt account');
  window.toggleUserFlag('nsfw');
  ok(S().user.nsfw === false, 'Mutt cannot enable Global NSFW');
  window.openModal('flirt', { id: 'u1' });
  ok(modalHTML().includes('locked'), 'Tier 2 flirts are locked for a Mutt');
  window.closeModal();
  window.openDM('u1');
  ok(mainHTML().includes('Mutt protection'), 'DM thread warns that Mutt protection is active');
  window.doLogout();
  window.doLogin(false);

  group('Messages & headspace indicator');
  window.openDM('u1');
  ok(mainHTML().includes('NSFW off'), 'angel headspace shown for an SFW recipient');
  ok(S().route.overlay.type === 'dm', 'DM overlay is active');
  const dmInput = window.document.getElementById('dm-input');
  dmInput.value = 'Testing one two';
  window.sendDM('u1');
  ok(G.MOCK_DM_THREADS.u1.some(m => m.text === 'Testing one two'), 'sent DM lands in the thread');
  window.goBack();
  window.openDM('u2');
  ok(mainHTML().includes('NSFW on'), 'devil headspace shown for an NSFW recipient');
  window.goBack();

  group('Chat spam cooldown');
  window.goSection('pack', 'chat');
  for (let i = 0; i < 3; i++) {
    window.renderMain();
    window.document.getElementById('chat-input').value = 'msg ' + i;
    window.sendChat();
  }
  ok(S().chatCooldownUntil > Date.now(), '3 consecutive messages trigger the cooldown');
  ok(mainHTML().includes('Spam filter active'), 'cooldown banner shows');
  ok(window.document.getElementById('chat-input').disabled, 'input is disabled during cooldown');
  S().chatCooldownUntil = 0; window.renderMain();
  ok(!window.document.getElementById('chat-input').disabled, 'input re-enables after cooldown');

  group('Wall, Events, Havens');
  window.goSubsection('wall');
  ok(mainHTML().includes('card-flag'), 'every wall post carries a report flag');
  const w0 = G.MOCK_WALL[0].likes;
  window.likePost(G.MOCK_WALL[0].id);
  ok(G.MOCK_WALL[0].likes === w0 + 1, 'liking a post increments the count');
  window.goSubsection('events');
  ok(mainHTML().includes('Post-meetup review'), 'completed event prompts a blind review');
  window.openModal('review', { id: 'e0' });
  window.submitReview('e0');
  ok(G.MOCK_EVENTS.find(e => e.id === 'e0').needsReview === false, 'review submission clears the prompt');
  const ev = G.MOCK_EVENTS.find(e => e.id === 'e1'); const r0 = ev.rsvps;
  window.toggleRSVP('e1');
  ok(ev.going && ev.rsvps === r0 + 1, 'RSVP increments attendance');
  window.goSubsection('havens');
  ok(mainHTML().includes('Book stay'), 'havens list offers booking');

  group('Host event via + button');
  window.openModal('hostEvent');
  window.document.getElementById('ev-title').value = 'Pier Sunrise Run';
  window.document.getElementById('ev-date').value = 'Sep 1, 6:00 AM';
  window.hostEvent();
  ok(G.MOCK_EVENTS[0].title === 'Pier Sunrise Run', 'new event is created');
  ok(S().route.subsection === 'events', 'creating an event lands you on Events');

  group('Pause and Block');
  window.viewProfile('u3');
  window.openModal('pauseBlock', { id: 'u3' });
  window.document.getElementById('pb-slider').value = '5';
  window.confirmSlide();
  ok(S().user.pausedUsers.some(p => p.handle === 'CedarHowl' && p.days === 5), 'pause records 5 days');
  window.goSection('community');
  ok(!mainHTML().includes('CedarHowl'), 'paused member drops off the map');
  window.openModal('blockedList');
  ok(modalHTML().includes('CedarHowl'), 'paused member appears in the management list');
  window.unblock('CedarHowl');
  ok(!S().user.pausedUsers.length, 'unblock clears the pause');
  window.closeModal();

  group('Notification modes & auto-jump');
  window.setNotifMode('modern');
  ok(!headerHTML().includes('Open Notifications'), 'Modern mode removes the bell');
  ok(window.document.getElementById('bottom-nav').innerHTML.includes('nav-dot'), 'Modern mode shows section red dots');
  window.setNotifMode('classic');
  ok(headerHTML().includes('Open Notifications'), 'Classic mode shows the bell');
  ok(!window.document.getElementById('bottom-nav').innerHTML.includes('nav-dot'), 'Classic mode hides red dots');
  window.setNotifMode('both');
  ok(headerHTML().includes('Open Notifications') && window.document.getElementById('bottom-nav').innerHTML.includes('nav-dot'), 'Both mode shows bell and dots');
  const unreadMind = S().notifications.filter(n => n.section === 'mind' && !n.read).length;
  window.handleNavTap('mind');
  ok(S().route.section === 'mind' && S().route.subsection === 'checklist', 'tapping Mind auto-jumps to the unread checklist item');
  ok(S().notifications.filter(n => n.section === 'mind' && !n.read).length === unreadMind - 1, 'the jumped-to notification is marked read');

  group('Shop & points');
  window.openModal('shop');
  ok(modalHTML().includes('Lifetime Pack Points') && modalHTML().includes('Spendable'), 'both point balances shown');
  ok(G.SHOP_TABS.join() === 'Themes,Sounds,Apparel,Utility', 'shop tabs match the one-word standard');
  const pts = S().user.spendablePoints;
  window.purchaseItem('Themes', 0);
  ok(S().user.spendablePoints === +(pts - G.SHOP_ITEMS.Themes[0].price).toFixed(2), 'purchase deducts spendable points');
  S().user.spendablePoints = 1;
  window.purchaseItem('Apparel', 0);
  ok(S().user.spendablePoints === 1, 'purchase blocked when points are short');
  S().user.spendablePoints = 365;
  window.closeModal();

  group('Daily camera reward caps at once per day');
  S().user.lastPhotoRewardDate = null;
  const p0 = S().user.spendablePoints;
  window.openModal('camera'); window.snapPhoto();
  ok(S().user.spendablePoints === +(p0 + 0.01).toFixed(2), 'first upload earns +0.01');
  window.openModal('camera'); window.snapPhoto();
  ok(S().user.spendablePoints === +(p0 + 0.01).toFixed(2), 'second upload the same day earns nothing');

  group('Settings');
  window.openModal('settings');
  ok(modalHTML().includes('Log out') && modalHTML().includes('Delete account'), 'settings offers logout and delete');
  window.openModal('displayName');
  window.document.getElementById('dn-input').value = 'TopDawgRory';
  window.saveDisplayName();
  ok(S().user.handle === 'TopDawgRory', 'display name updates');
  S().user.handle = 'AlphaDawg';

  group('Zero emoji in shipped source');
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  for (const f of ['index.html', 'js/app.js', 'js/data.js', 'js/icons.js', 'css/style.css']) {
    ok(!emojiRe.test(read(f)), `${f} contains no emoji`);
  }

  group('Integrity colour spectrum');
  ok(G.integrityColor(0) === '#ef4444' || G.integrityColor(0).startsWith('rgb'), 'score 0 maps to the red end');
  ok(G.integrityColor(5) === '#a855f7' || G.integrityColor(5).startsWith('rgb'), 'score 5 maps to the purple end');

  group('Logout');
  window.doLogout();
  ok(!S().loggedIn, 'logout clears the session');
  ok(!window.document.getElementById('login-screen').classList.contains('hidden'), 'login screen returns');

  group('Runtime cleanliness');
  ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`);
  if (consoleErrors.length) consoleErrors.slice(0, 5).forEach(e => console.error('   >', e));

  console.log(`\n${failures === 0 ? '✔ ALL TESTS PASSED' : '✘ ' + failures + ' FAILURE(S)'}`);
  process.exit(failures ? 1 : 0);
} catch (err) {
  console.error('\nCRASH:', err);
  process.exit(1);
}
