/* TopDawgs — automated tests (jsdom).
   Boots the real index.html + js files, asserts behaviour, fails on
   any console error. Includes explicit regression tests for the two
   bugs that broke mobile loading in the previous build. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let failures = 0, consoleErrors = [];
function ok(cond, msg) { if (cond) console.log('  ok  ', msg); else { console.error('  FAIL', msg); failures++; } }
function group(n) { console.log('\n' + n); }

/* ---------- Harness: build a window, optionally with storage disabled ---------- */
function makeWindow(opts) {
  opts = opts || {};
  const dom = new JSDOM(read('index.html'), { runScripts: 'outside-only', url: 'https://e.com/', pretendToBeVisual: true });
  const w = dom.window;
  if (opts.blockStorage) {
    // Reproduces iOS Safari private mode / blocked cookies.
    Object.defineProperty(w, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError: localStorage is not available'); },
    });
  } else {
    const store = {};
    w.localStorage = {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    };
  }
  w.console.error = (...a) => consoleErrors.push(a.join(' '));
  w.eval([read('js/data.js'), read('js/icons.js'), read('js/social.js'), read('js/app.js')].join('\n;\n') +
    '\n;window.__G={SECTIONS,MAP_FILTERS,MOCK_USERS,MOCK_POSTS,MOCK_EVENTS,MOCK_CHAT,MOCK_HAVENS,SHOP_TABS,SHOP_ITEMS,MOCK_CHECKLIST,MOCK_DM_THREADS,ICONS,integrityColor,timeAgo,Store};');
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  return w;
}

try {
  /* ============ Regression: the mobile blank-screen bugs ============ */
  group('Regression — mobile boot');
  let crashed = null;
  let wBlocked;
  try { wBlocked = makeWindow({ blockStorage: true }); } catch (e) { crashed = e; }
  ok(!crashed, 'boots when localStorage throws (iOS private mode)');
  if (wBlocked) {
    ok(!wBlocked.document.getElementById('login-screen').classList.contains('hidden'),
      'login screen renders with storage blocked');
    wBlocked.doLogin(false);
    ok(wBlocked.STATE.loggedIn && !wBlocked.document.getElementById('app-shell').classList.contains('hidden'),
      'can log in and use the app with storage blocked');
    ok(wBlocked.__G.Store.available === false, 'app detects that storage is unavailable');
    ok(wBlocked.document.getElementById('boot-error').classList.contains('hidden'),
      'no boot error surfaced during normal start');
  }

  const css = read('css/style.css');
  ok(/height:\s*100dvh/.test(css), 'app frame uses dvh so the nav clears mobile browser chrome');
  ok((css.match(/min-height:\s*100vh/g) || []).length === 0, 'no nested 100vh containers remain');
  const html = read('index.html');
  ok(/viewport-fit=cover/.test(html), 'viewport handles notches');
  ok(/rel="manifest"/.test(html), 'manifest is linked');
  ok(/apple-touch-icon/.test(html), 'Apple touch icon is linked');
  ok(/id="boot-error"/.test(html), 'boot error boundary exists');

  group('PWA assets');
  const mani = JSON.parse(read('manifest.json'));
  ok(mani.name === 'TopDawgs' && mani.display === 'standalone', 'manifest declares a standalone app');
  ok(mani.icons.some(i => i.sizes === '192x192') && mani.icons.some(i => i.sizes === '512x512'),
    'manifest has 192 and 512 icons');
  ok(mani.icons.some(i => i.purpose === 'maskable'), 'manifest has a maskable icon');
  mani.icons.forEach(i => ok(fs.existsSync(path.join(root, i.src)), 'icon file exists: ' + i.src));
  ok(fs.existsSync(path.join(root, 'sw.js')), 'service worker exists');
  ok(/serviceWorker/.test(html), 'service worker is registered from the page');

  /* ============ Main suite ============ */
  const w = makeWindow();
  const G = w.__G;
  const S = () => w.STATE;
  const main = () => w.document.getElementById('app-main').innerHTML;
  const header = () => w.document.getElementById('app-header').innerHTML;
  const nav = () => w.document.getElementById('bottom-nav').innerHTML;
  const modal = () => (w.document.getElementById('modal-host') || {}).innerHTML || '';
  const drop = () => (w.document.getElementById('dropdown-host') || {}).innerHTML || '';

  group('Login');
  w.doLogin(false);
  ok(S().loggedIn && S().user.handle === 'AlphaDawg', 'logs in as AlphaDawg');
  ok(S().user.rank === 'Pack Dawg' && !S().user.mutt, 'standard login is a verified Pack Dawg');

  group('Bottom nav is icons only');
  ok(nav().indexOf('Community</') < 0 && nav().indexOf('>Pack<') < 0, 'no text labels rendered in nav');
  ok((nav().match(/<svg/g) || []).length === 4, 'four nav icons');
  ok(/aria-label="Community"/.test(nav()), 'nav items keep accessible names');

  group('No section header images');
  let heroFound = false;
  for (const sec of G.SECTIONS) {
    w.goSection(sec.id);
    if (/hero-banner|hero-label|hero-/.test(main())) heroFound = true;
    if (sec.hasSubsections) for (const sub of sec.subsections) {
      w.goSubsection(sub.id);
      if (/hero-banner|hero-label|hero-/.test(main())) heroFound = true;
    }
  }
  ok(!heroFound, 'no hero banner in any section or subsection');
  ok(!fs.existsSync(path.join(root, 'assets/hero-community.svg')), 'hero image files removed');

  group('All sections and subsections render');
  for (const sec of G.SECTIONS) {
    w.goSection(sec.id);
    ok(S().route.section === sec.id && main().length > 100, sec.id + ' renders');
    if (sec.hasSubsections) for (const sub of sec.subsections) {
      w.goSubsection(sub.id);
      ok(S().route.subsection === sub.id && main().length > 60, sec.id + '/' + sub.id + ' renders');
    }
  }

  group('Wall — composing');
  w.goSection('pack', 'wall');
  ok(/composer-input/.test(main()), 'composer is present on the feed');
  const before = G.MOCK_POSTS.length;
  w.document.getElementById('composer-input').value = 'Testing the composer #newtag';
  w.updateComposer();
  ok(w.document.getElementById('post-btn').disabled === false, 'post button enables with text');
  w.submitPost();
  ok(G.MOCK_POSTS.length === before + 1, 'post is created');
  ok(G.MOCK_POSTS[0].authorId === 'me', 'new post is authored by the signed-in user');
  ok(/newtag/.test(main()), 'new post appears in the feed');

  group('Likes, saves, shares');
  const p1 = G.MOCK_POSTS.find(p => p.id === 'p1');
  const likes0 = p1.likedBy.length;
  w.onLike('p1');
  ok(p1.likedBy.length === likes0 + 1 && w.isPostLiked('p1'), 'liking a post registers');
  w.onLike('p1');
  ok(p1.likedBy.length === likes0 && !w.isPostLiked('p1'), 'unliking reverses it');
  w.onSave('p1');
  ok(w.isSaved('p1'), 'saving a post registers');
  const sh0 = p1.shares;
  w.onShare('p1');
  ok(p1.shares === sh0 + 1, 'sharing increments the counter');

  group('Comment threads');
  w.openPost('p1');
  ok(S().route.overlay.type === 'post', 'post detail opens');
  ok(/comment-bubble/.test(main()), 'existing comments render');
  ok(/replies/.test(main()), 'nested replies render');
  const c0 = p1.comments.length;
  w.document.getElementById('comment-input').value = 'Adding a top level comment';
  w.submitComment('p1');
  ok(p1.comments.length === c0 + 1, 'comment is added');
  ok(p1.comments[p1.comments.length - 1].parentId === null, 'it is top level');
  w.startReply('p1', 'c1', 'RustyTrail');
  ok(S().replyTo && S().replyTo.commentId === 'c1', 'reply mode targets the right comment');
  ok(/Replying to @RustyTrail/.test(main()), 'reply context banner shows');
  w.document.getElementById('comment-input').value = 'This is a threaded reply';
  w.submitComment('p1');
  const added = p1.comments[p1.comments.length - 1];
  ok(added.parentId === 'c1', 'reply is nested under its parent');
  ok(S().replyTo === null, 'reply mode clears after sending');
  const myComment = added.id;
  w.onCommentLike('p1', 'c1');
  ok(p1.comments.find(c => c.id === 'c1').likedBy.indexOf('me') >= 0, 'comment like registers');
  w.onDeleteComment('p1', myComment);
  ok(!p1.comments.find(c => c.id === myComment), 'own comment can be deleted');
  w.goBack();

  group('Threaded delete cascades');
  const tp = w.createPost('parent post', null);
  const pc = w.addComment(tp.id, 'parent comment', null);
  w.addComment(tp.id, 'child reply', pc.id);
  ok(tp.comments.length === 2, 'parent and reply exist');
  w.deleteComment(tp.id, pc.id);
  ok(tp.comments.length === 0, 'deleting a parent removes its replies');
  w.deletePost(tp.id);

  group('Follow graph');
  ok(w.isFollowing('u1'), 'seeded following state is read');
  const f0 = w.followerCount('u2');
  w.onFollow('u2');
  ok(w.isFollowing('u2') && w.followerCount('u2') === f0 + 1, 'following increments follower count');
  w.onFollow('u2');
  ok(!w.isFollowing('u2') && w.followerCount('u2') === f0, 'unfollowing reverses it');

  group('Following feed filter');
  w.goSection('pack', 'wall');
  w.setFeedMode('following');
  const followingHtml = main();
  ok(!/SableFang/.test(followingHtml), 'posts from unfollowed members are filtered out');
  ok(/CedarHowl/.test(followingHtml) || /AlphaMarcus/.test(followingHtml), 'posts from followed members remain');
  w.setFeedMode('all');
  ok(/SableFang/.test(main()), 'All tab shows everyone again');

  group('Mute hides content');
  w.onMute('u4');
  ok(w.isMuted('u4'), 'mute registers');
  ok(!/SableFang/.test(main()), 'muted member disappears from the feed');
  w.onMute('u4');
  ok(!w.isMuted('u4'), 'unmute reverses it');

  group('Hashtags and search');
  ok(/tag-link/.test(main()), 'hashtags render as tappable links');
  w.openTag('havens');
  ok(S().route.overlay.type === 'tag', 'tag page opens');
  ok(/#havens/.test(main()), 'tag page shows the tag');
  ok(w.postsWithTag('havens').length >= 1, 'tag lookup finds posts');
  w.goBack();
  w.openSearch();
  ok(/search-input/.test(main()), 'search opens');
  ok(/Trending tags/.test(main()), 'trending tags shown when query is empty');
  w.onSearchInput('rusty');
  ok(/RustyTrail/.test(main()), 'search finds people');
  w.onSearchInput('haven');
  const sr = w.searchAll('haven');
  ok(sr.posts.length > 0, 'search finds posts');
  ok(sr.tags.length > 0, 'search finds tags');
  w.onSearchInput('zzzznothing');
  ok(/Nothing matches/.test(main()), 'empty search state shows');
  w.onSearchInput('');
  w.goBack();

  group('Notifications page');
  w.openNotifications();
  ok(S().route.overlay.type === 'notifications', 'bell opens a dedicated page, not a toast');
  ok(/notif-row/.test(main()), 'notifications list renders');
  ok(/Mark all read/.test(main()), 'mark all read is offered');
  const unread0 = w.unreadNotifications().length;
  ok(unread0 > 0, 'there are unread notifications');
  w.onMarkAllRead();
  ok(w.unreadNotifications().length === 0, 'mark all read clears them');
  S().notifications = w.seedNotifications();
  w.goBack();

  group('Notification routing');
  w.openNotifications();
  w.openNotification('n4');
  ok(S().route.overlay.type === 'post' && S().route.overlay.postId === 'p4', 'like notification opens the post');
  w.goBack(); w.goBack();
  w.openNotifications();
  w.openNotification('n3');
  ok(S().route.overlay.type === 'dm', 'message notification opens the thread');
  w.goBack();

  group('Messaging');
  w.goSection('pack', 'messages');
  ok(/conversation|card-row/.test(main()), 'conversation list renders');
  ok(w.conversations()[0].ts >= w.conversations()[1].ts, 'conversations sort by recency');
  // u5 has not been opened earlier in this suite, so its unread count is intact.
  ok(w.unreadDMCount('u5') > 0, 'unread count computed before opening');
  w.openDM('u5');
  ok(w.unreadDMCount('u5') === 0, 'opening the thread marks it read');
  w.goBack();
  w.openDM('u1');
  ok(/NSFW off/.test(main()), 'angel headspace shown for an SFW recipient');
  w.document.getElementById('dm-input').value = 'Hello there';
  w.sendDM('u1');
  ok(G.MOCK_DM_THREADS.u1.some(m => m.text === 'Hello there' && m.me), 'sent message lands in the thread');
  ok(/Sent|Read/.test(main()), 'read receipt state renders on own message');
  w.goBack();
  w.openDM('u2');
  ok(/NSFW on/.test(main()), 'devil headspace shown for an NSFW recipient');
  w.goBack();

  group('Chat cooldown');
  w.goSection('pack', 'chat');
  for (let i = 0; i < 3; i++) {
    w.renderMain();
    w.document.getElementById('chat-input').value = 'msg ' + i;
    w.sendChat();
  }
  ok(S().chatCooldownUntil > Date.now(), '3 consecutive messages trigger the cooldown');
  ok(w.document.getElementById('chat-input').disabled, 'input disabled during cooldown');
  S().chatCooldownUntil = 0; w.renderMain();
  ok(!w.document.getElementById('chat-input').disabled, 'input re-enables after cooldown');

  group('Community map');
  // Restore an unread message so the map bubble has something to show.
  G.MOCK_DM_THREADS.u1.forEach(m => { if (!m.me) m.read = false; });
  w.goSection('community');
  ok(/Filters/.test(header()), 'filters live in the top pill');
  w.toggleDropdown('filter');
  ok(/checkbox/.test(drop()), 'filters are selectable by check mark');
  w.toggleDropdown('filter');
  ok(/map-pin/.test(main()), 'people pins render');
  w.toggleMapFilter('people');
  ok(main().indexOf('class="map-pin') < 0, 'unchecking People removes people pins');
  w.toggleMapFilter('people');
  ok(!/NightWatch/.test(main()), 'incognito member is off the map');
  ok(/integrity-emblem/.test(main()), 'integrity emblem on pins');
  ok(/dm-bubble/.test(main()), 'unread DM bubble on the right pin');
  ok(/>You</.test(main()), 'own pin is on the map');
  w.toggleUserFlag('incognito');
  ok(!/>You</.test(main()), 'incognito removes own pin');
  w.toggleUserFlag('incognito');

  group('NSFW eyes-only filter');
  w.toggleUserFlag('nsfw');
  ok(!/CedarHowl/.test(main()), 'hookup mode hides non-NSFW members');
  ok(/RustyTrail/.test(main()), 'NSFW members stay visible');
  ok(!/MossPup/.test(main()), 'Mutts never appear in hookup mode');
  w.viewProfile('u2');
  ok(/Position/.test(main()), 'NSFW stats show when both sides qualify');
  w.goBack();
  w.viewProfile('u3');
  ok(!/Position/.test(main()), 'NSFW stats hidden when the other side is off');
  w.goBack();
  w.toggleUserFlag('nsfw');

  group('Profile');
  w.viewProfile('u1');
  ok(/AlphaMarcus/.test(main()), 'profile shows handle');
  ok(/Followers/.test(main()) && /Following/.test(main()), 'follower and following counts show');
  ok(/Integrity Rating/.test(main()), 'integrity rating renders');
  ok(/Posts/.test(main()) && /Gallery/.test(main()), 'profile tabs render');
  w.setProfileTab('gallery');
  ok(/gallery-thumb/.test(main()), 'gallery tab shows photos');
  ok(/blurred/.test(main()), 'NSFW photo is blurred when not mutually unlocked');
  w.goBack();
  w.viewProfile(null);
  ok(/Saved/.test(main()), 'own profile has a saved tab');
  w.setProfileTab('saved');
  ok(/card/.test(main()), 'saved posts render');
  w.setProfileTab('posts');
  w.goBack();

  group('Mutt protections');
  w.doLogout(); w.doLogin(true);
  ok(S().user.mutt && S().user.rank === 'Mutt', 'Mutt login creates a Mutt');
  w.toggleUserFlag('nsfw');
  ok(S().user.nsfw === false, 'Mutt cannot enable NSFW');
  w.openModal('flirt', { id: 'u1' });
  ok(/locked/.test(modal()), 'Tier 2 flirts locked for a Mutt');
  w.closeModal();
  w.openDM('u1');
  ok(/Mutt protection/.test(main()), 'DM warns about Mutt protection');
  w.goBack();
  w.doLogout(); w.doLogin(false);

  group('Pause and block');
  w.openModal('pauseBlock', { id: 'u3' });
  w.document.getElementById('pb-slider').value = '5';
  w.confirmSlide();
  ok(S().user.pausedUsers.some(p => p.handle === 'CedarHowl' && p.days === 5), 'pause records days');
  w.goSection('community');
  ok(!/CedarHowl/.test(main()), 'paused member leaves the map');
  w.goSection('pack', 'wall');
  ok(!/CedarHowl/.test(main()), 'paused member leaves the feed');
  w.openModal('blockedList');
  ok(/CedarHowl/.test(modal()), 'appears in the restriction list');
  w.unrestrict('CedarHowl');
  ok(!S().user.pausedUsers.length, 'unpause clears it');
  w.closeModal();

  group('Notification modes');
  w.setNotifMode('modern');
  ok(!/Open Notifications/.test(header()), 'Modern hides the bell');
  ok(/nav-dot/.test(nav()), 'Modern shows red dots');
  w.setNotifMode('classic');
  ok(/Open Notifications/.test(header()), 'Classic shows the bell');
  ok(!/nav-dot/.test(nav()), 'Classic hides red dots');
  w.setNotifMode('both');
  ok(/Open Notifications/.test(header()) && /nav-dot/.test(nav()), 'Both shows bell and dots');
  const mindUnread = w.unreadForSection('mind').length;
  w.handleNavTap('mind');
  ok(S().route.section === 'mind' && S().route.subsection === 'checklist', 'auto-jump lands on the unread item');
  ok(w.unreadForSection('mind').length === mindUnread - 1, 'jumped notification marked read');

  group('Back stack');
  w.goSection('community');
  const d0 = S().history.length;
  w.goSection('pack', 'wall');
  w.openPost('p1');
  w.viewProfile('u1');
  ok(S().route.overlay.type === 'profile', 'three levels deep');
  w.goBack();
  ok(S().route.overlay.type === 'post', 'back returns to the post');
  w.goBack();
  ok(!S().route.overlay && S().route.subsection === 'wall', 'back returns to the wall');
  w.goBack();
  ok(S().route.section === 'community', 'back returns to community');
  ok(S().history.length === d0, 'history unwinds cleanly');

  group('Events, havens, shop, camera');
  w.goSection('pack', 'events');
  ok(/Post-meetup review/.test(main()), 'completed event asks for a blind review');
  w.openModal('review', { id: 'e0' }); w.submitReview('e0');
  ok(G.MOCK_EVENTS.find(e => e.id === 'e0').needsReview === false, 'review clears the prompt');
  const ev = G.MOCK_EVENTS.find(e => e.id === 'e1');
  w.toggleRSVP('e1');
  ok(ev.going, 'RSVP toggles');
  w.openModal('hostEvent');
  w.document.getElementById('ev-title').value = 'Pier Sunrise Run';
  w.document.getElementById('ev-date').value = 'Sep 1, 6:00 AM';
  w.document.getElementById('ev-loc').value = 'The Pier';
  w.hostEvent();
  ok(G.MOCK_EVENTS.some(e => e.title === 'Pier Sunrise Run'), 'event is created');
  w.openModal('shop');
  ok(G.SHOP_TABS.join() === 'Themes,Sounds,Apparel,Utility', 'shop tabs follow the one-word standard');
  const pts = S().user.spendablePoints;
  w.purchaseItem('Themes', 0);
  ok(S().user.spendablePoints === Number((pts - G.SHOP_ITEMS.Themes[0].price).toFixed(2)), 'purchase deducts points');
  S().user.spendablePoints = 1;
  w.purchaseItem('Apparel', 0);
  ok(S().user.spendablePoints === 1, 'purchase blocked when short');
  S().user.spendablePoints = 365;
  w.closeModal();
  S().user.lastPhotoRewardDate = null;
  const pp = S().user.spendablePoints;
  w.openModal('camera'); w.snapPhoto();
  ok(S().user.spendablePoints === Number((pp + 0.01).toFixed(2)), 'first daily photo earns +0.01');
  w.openModal('camera'); w.snapPhoto();
  ok(S().user.spendablePoints === Number((pp + 0.01).toFixed(2)), 'second photo same day earns nothing');

  group('Relative timestamps');
  ok(G.timeAgo(Date.now() - 30 * 1000) === 'just now', 'seconds render as just now');
  ok(/^\d+m$/.test(G.timeAgo(Date.now() - 10 * 60000)), 'minutes render');
  ok(/^\d+h$/.test(G.timeAgo(Date.now() - 5 * 3600000)), 'hours render');
  ok(/^\d+d$/.test(G.timeAgo(Date.now() - 3 * 86400000)), 'days render');

  group('XSS safety');
  const xss = w.createPost('<img src=x onerror=alert(1)> #safe', null);
  w.goSection('pack', 'wall');
  ok(main().indexOf('<img src=x onerror') < 0, 'markup in post text is escaped');
  ok(/&lt;img/.test(main()), 'escaped form is present');
  w.deletePost(xss.id);

  group('Zero emoji in source');
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  ['index.html','js/app.js','js/data.js','js/icons.js','js/social.js','css/style.css','manifest.json','sw.js']
    .forEach(f => ok(!emoji.test(read(f)), f + ' has no emoji'));

  group('Logout');
  w.doLogout();
  ok(!S().loggedIn && !w.document.getElementById('login-screen').classList.contains('hidden'), 'logout returns to login');

  group('Runtime cleanliness');
  ok(consoleErrors.length === 0, 'no console errors (' + consoleErrors.length + ')');
  consoleErrors.slice(0, 6).forEach(e => console.error('   >', e));

  console.log('\n' + (failures === 0 ? 'ALL TESTS PASSED' : failures + ' FAILURE(S)'));
  process.exit(failures ? 1 : 0);
} catch (err) {
  console.error('\nCRASH:', err);
  process.exit(1);
}
