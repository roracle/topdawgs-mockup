// TopDawgs — screen templates. Every function returns an HTML string for
// the scrollable content area; app.js wraps it with the shell (topbar/nav).

function initials(name) { return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase(); }

function avatarHTML(name, size, colorful) {
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${size*0.36}px;">${initials(name)}</div>`;
}

function rankBadgeHTML(rank) {
  const cls = rank === 'top' ? 'rank-top' : rank === 'pack' ? 'rank-pack' : 'rank-mutt';
  return `<span class="rank-badge ${cls}">${RANK_LABEL[rank]}</span>`;
}

/* ==========================================================================
   ONBOARDING
   ========================================================================== */
function screenWelcome() {
  return `
  <div class="auth-wrap screen-fade">
    <div class="brand-mark">
      <div class="ring">${ICONS.pack}</div>
      <div class="wordmark">TOPDAWGS</div>
      <div class="tagline">COMMUNITY · PACK · BODY · MIND</div>
    </div>
    <button class="btn btn-primary" data-go="#/register">Create your account</button>
    <div style="height:10px"></div>
    <button class="btn btn-secondary" data-go="#/register?login=1">I already have an account</button>
    <div class="divider-or">or continue with</div>
    <div class="row gap-sm">
      <button class="btn btn-secondary btn-sm" style="flex:1" data-toast="Google sign-in (demo)">Google</button>
      <button class="btn btn-secondary btn-sm" style="flex:1" data-toast="Apple sign-in (demo)">Apple</button>
    </div>
    <p class="tiny faint" style="text-align:center; margin-top:22px;">By continuing you agree to the Community Guidelines &amp; 18+ age policy.</p>
  </div>`;
}

function screenRegister() {
  return `
  <div class="auth-wrap screen-fade">
    <div class="paw-trail">
      <div class="paw done"></div><div class="paw now"></div><div class="paw"></div>
    </div>
    <div class="eyebrow">Step 1 of 2</div>
    <h2 class="page-title">Create your account</h2>
    <div class="field"><label>Display name</label><input placeholder="e.g. Rory K." value="Rory K."></div>
    <div class="field"><label>Email</label><input placeholder="you@email.com" type="email"></div>
    <div class="field"><label>Password</label><input placeholder="••••••••" type="password"></div>
    <div class="lock-notice">${ICONS.info}<span>Everyone starts as a <strong>Mutt</strong>. You'll unlock posting, events and Pack Dawg features after 18+ ID verification.</span></div>
    <div style="height:14px"></div>
    <button class="btn btn-primary" data-go="#/verify">Continue to verification</button>
    <button class="btn btn-ghost" style="margin-top:10px" data-go="#/welcome">Back</button>
  </div>`;
}

function screenVerify() {
  return `
  <div class="auth-wrap screen-fade">
    <div class="paw-trail">
      <div class="paw done"></div><div class="paw done"></div><div class="paw now"></div>
    </div>
    <div class="eyebrow">Step 2 of 2 &middot; Required</div>
    <h2 class="page-title">Verify you're 18+</h2>
    <p class="muted small" style="margin-bottom:16px;">A government-issued ID is required before you can post, message, or join events. This is checked once and never shown on your public profile.</p>
    <div class="id-upload-box ${STATE.idUploaded ? 'uploaded' : ''}" data-do="upload-id">
      ${STATE.idUploaded ? ICONS.check : ICONS.camera}
      <div>${STATE.idUploaded ? 'ID uploaded — verifying' : 'Tap to upload ID photo'}</div>
    </div>
    <button class="btn btn-primary" ${STATE.idUploaded ? '' : 'disabled'} data-go="#/community" data-do="finish-onboarding">Finish &amp; enter as Mutt</button>
    <button class="btn btn-ghost" style="margin-top:10px" data-go="#/register">Back</button>
  </div>`;
}

function unreadCount() { return NOTIFICATIONS.filter(n => !n.read).length; }

function bellButton() {
  return `<button class="icon-btn" data-go="#/notifications">${unreadCount() > 0 ? '<span class="notif-dot"></span>' : ''}${ICONS.bell}</button>`;
}

/* ==========================================================================
   TOP BAR + BOTTOM NAV (shared shell pieces)
   ========================================================================== */
function topbarTransparent() {
  const u = STATE.user;
  return `
  <div class="topbar">
    <div class="topbar-left">
      <button class="icon-btn avatar-btn" data-do="open-quicksettings">${initials(u.name)}</button>
      ${bellButton()}
      <button class="icon-btn" data-go="#/shop">${ICONS.shop}</button>
    </div>
    <div class="topbar-right" style="position:relative;">
      <div class="pill" data-do="toggle-community-dropdown">Community ${ICONS.chevronDown}</div>
      ${STATE.communityDropdownOpen ? communityDropdownMenu() : ''}
    </div>
  </div>`;
}

function communityDropdownMenu() {
  const opts = [['all', 'Show All'], ['havens', 'Pack Havens'], ['pins', 'Resource Partners'], ['posts', 'Map Posts']];
  return `
  <div class="dropdown-catcher" data-do="toggle-community-dropdown"></div>
  <div class="dropdown-menu screen-fade">
    ${opts.map(([k, l]) => `
    <div class="dropdown-item ${STATE.communityFilter === k ? 'active' : ''}" data-do="set-community-filter" data-filter="${k}">
      <span>${l}</span>${STATE.communityFilter === k ? ICONS.check : ''}
    </div>`).join('')}
  </div>`;
}

function topbarSolid(title, subActions) {
  const u = STATE.user;
  return `
  <div class="topbar solid">
    <div class="topbar-left">
      <button class="icon-btn avatar-btn" data-do="open-quicksettings">${initials(u.name)}</button>
      ${bellButton()}
      <button class="icon-btn" data-go="#/shop">${ICONS.shop}</button>
    </div>
    <div class="topbar-right">${subActions || ''}</div>
  </div>`;
}

function bottomNav() {
  const items = [
    { key: 'community', label: 'Community', icon: 'community', go: '#/community' },
    { key: 'pack', label: 'Pack', icon: 'pack', go: '#/pack/' + STATE.packSub },
    { key: 'body', label: 'Body', icon: 'body', go: '#/body/diet' },
    { key: 'mind', label: 'Mind', icon: 'mind', go: '#/mind/checklist' },
  ];
  return `<div class="bottomnav">${items.map(it => `
    <button class="navitem ${STATE.activeTab === it.key ? 'active' : ''}" data-go="${it.go}" data-set-tab="${it.key}">
      ${ICONS[it.icon]}<span>${it.label}</span>
    </button>`).join('')}</div>`;
}

function fabPost() {
  return `<button class="icon-btn" style="position:absolute; right:16px; bottom:96px; width:50px; height:50px; background:var(--sky); color:#04121c; z-index:45; box-shadow:var(--glow-sky);" data-do="open-post-modal">${ICONS.plus}</button>`;
}

/* ==========================================================================
   COMMUNITY (map)
   ========================================================================== */
function screenCommunity() {
  const pinIcon = (t) => t === 'partner' ? ICONS.coffee : t === 'haven' ? ICONS.haven : ICONS.pin;
  const f = STATE.communityFilter;
  const showPins = f === 'all' || f === 'pins' || f === 'havens';
  const showPosts = f === 'all' || f === 'posts';
  const pins = MAP_PINS.filter(p => f === 'havens' ? p.type === 'haven' : f === 'pins' ? p.type !== 'user' : true);
  return `
  <div class="map-canvas screen-fade">
    <div class="map-grid"></div>
    ${showPosts ? MAP_POSTS.map(p => `<div class="map-post" style="top:${p.top};left:${p.left};"></div>`).join('') : ''}
    ${showPins ? pins.map(p => `
      <div class="map-pin ${p.type}" style="top:${p.top};left:${p.left};" data-do="open-pin" data-pin="${p.id}">
        <div class="dot">${pinIcon(p.type)}</div>
        <div class="pin-label">${p.label}</div>
      </div>`).join('') : ''}
  </div>
  ${STATE.openPin ? mapPinSheet() : ''}
  `;
}

function mapPinSheet() {
  const pin = MAP_PINS.find(p => p.id === STATE.openPin);
  if (!pin) return '';
  const isPartner = pin.type === 'partner';
  const isHaven = pin.type === 'haven';
  return `
  <div class="map-sheet screen-fade">
    <div class="handle"></div>
    <div class="row between">
      <div>
        <h3 style="font-size:16px;">${pin.label}</h3>
        <span class="chip ${isPartner ? 'gold' : isHaven ? 'ok' : 'sky'}">${isPartner ? 'Resource Partner' : isHaven ? 'Verified Pack Haven' : 'Member Pin'}</span>
      </div>
      <button class="icon-btn" data-do="close-pin">${ICONS.chevronDown}</button>
    </div>
    <div style="height:12px"></div>
    <div class="row gap-sm">
      <button class="btn btn-primary btn-sm" style="flex:1" data-toast="Quick event launched at ${pin.label}">Launch quick event</button>
      <button class="btn btn-secondary btn-sm" style="flex:1" data-go="#/pack/events">View events here</button>
    </div>
  </div>`;
}

/* ==========================================================================
   PACK — 5 subsections
   ========================================================================== */
function packSubStrip() {
  const subs = [
    {k:'wall', l:'Wall Feed'}, {k:'contacts', l:'Contacts & DMs'}, {k:'events', l:'Events'},
    {k:'havens', l:'Havens'}, {k:'chat', l:'Local Chat'},
  ];
  return `<div class="subsection-strip">${subs.map(s => `<div class="sub-pill ${STATE.packSub===s.k?'active':''}" data-go="#/pack/${s.k}">${s.l}</div>`).join('')}</div>`;
}

function screenPackWall() {
  const rankChip = (r) => r === 'top' ? '<span class="rank-badge rank-top">TopDawg</span>' : r === 'partner' ? '<span class="chip gold">Partner</span>' : '<span class="rank-badge rank-pack">Pack Dawg</span>';
  let cards = '';
  FEED_POSTS.forEach((p, i) => {
    cards += `
    <div class="card">
      <div class="row gap-sm">${avatarHTML(p.author,34)}<div><div class="row gap-sm">${p.author} ${rankChip(p.rank)}</div><span class="tiny faint">${p.time} ago</span></div></div>
      <p class="small" style="margin-top:10px; line-height:1.5;">${p.text}</p>
      ${p.media ? `<div class="post-media">${ICONS.image}</div>` : ''}
      <div class="reaction-bar">
        <span>${ICONS.flirt} ${p.reactions}</span>
        <span>${ICONS.chat} ${p.comments} comments</span>
        <span style="margin-left:auto;">${ICONS.bookmark}</span>
      </div>
    </div>`;
    if (i === 1) cards += `<div class="shop-drop">${ICONS.shop}<div><strong class="small">Regional Shop Drop</strong><div class="tiny muted">New Pack Havens travel kit — 1 shop post per 8-10 social posts.</div></div></div>`;
  });
  return packSubStrip() + `<div class="screen-inner screen-fade">${cards}</div>`;
}

function screenPackContacts() {
  const flirtIcon = (c) => c.nsfw ? '😈' : '👼';
  return packSubStrip() + `
  <div class="screen-fade">
    <div class="contact-carousel">
      ${CONTACTS.filter(c=>c.online).map(c => `<div class="bubble" data-go="#/dm/${c.id}">${avatarHTML(c.name,48)}<div class="name">${c.name.split(' ')[0]}</div></div>`).join('')}
    </div>
    <div class="screen-inner">
      ${CONTACTS.map(c => `
      <div class="contact-row">
        ${avatarHTML(c.name,40)}
        <div>
          <div class="row gap-sm">${c.name} <span class="tiny faint">${flirtIcon(c)}</span></div>
          <span class="tiny muted">${c.handle}</span>
        </div>
        <div class="action-icon-row">
          ${c.hosting ? `<button class="mini-btn" data-toast="Invited ${c.name} to your event">${ICONS.plus}</button>` : ''}
          ${STATE.user.allowFlirts ? `<button class="mini-btn" data-toast="Flirt sent to ${c.name}">${ICONS.flirt}</button>` : ''}
          <button class="mini-btn ${c.bookmarked?'':''}" data-toast="${c.bookmarked?'Removed bookmark':'Bookmarked'}">${ICONS.bookmark}</button>
          <button class="mini-btn" data-go="#/dm/${c.id}">${ICONS.chat}</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function screenPackEvents() {
  const scopeFilter = STATE.eventScope || 'local';
  const filtered = EVENTS.filter(e => scopeFilter === 'all' || e.scope === scopeFilter);
  return packSubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="row gap-sm" style="margin-bottom:12px;">
      <div class="chip ${scopeFilter==='local'?'sky':'ghost'}" data-do="event-scope-local">Local/Regional</div>
      <div class="chip ${scopeFilter==='ongoing'?'sky':'ghost'}" data-do="event-scope-ongoing">Ongoing</div>
      <div class="chip ${scopeFilter==='all'?'sky':'ghost'}" data-do="event-scope-all">All</div>
    </div>
    ${filtered.map(e => `
    <div class="card event-card">
      <div class="event-banner">${e.partner ? '<span class="chip gold partner-tag">Resource Partner</span>' : ''}</div>
      <div class="row between"><strong>${e.title}</strong><span class="chip ${e.status==='ongoing'?'ok':'sky'}">${e.status}</span></div>
      <div class="event-meta"><span>${ICONS.clock} ${e.when}</span><span>${ICONS.pin} ${e.venue}</span></div>
      <div class="row between" style="margin-top:10px;">
        <span class="small muted">${e.rsvp} RSVP'd</span>
        <button class="btn btn-primary btn-sm" data-toast="RSVP confirmed for ${e.title}">RSVP</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function screenPackHavens() {
  return packSubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="lock-notice">${ICONS.info}<span>Pack Havens are emergency sanctuaries &amp; refresh passes verified by the community.</span></div>
    ${HAVENS.map(h => `
    <div class="card haven-card">
      <div class="row between"><strong>${h.name}</strong><span class="chip sky">${h.tier}</span></div>
      <div class="haven-tags">
        <span class="chip ghost">${h.capacity}</span>
        <span class="chip ghost">${h.pets}</span>
        <span class="chip ${h.accessible?'ok':'ghost'}">${h.accessible ? 'Step-free access' : 'Steps present'}</span>
      </div>
      <button class="btn btn-secondary btn-sm" style="margin-top:10px;" data-toast="Request sent to host">Request stay</button>
    </div>`).join('')}
  </div>`;
}

function screenPackChat() {
  const now = Date.now();
  const cooling = now < STATE.chatCooldownUntil;
  const remaining = Math.max(0, Math.ceil((STATE.chatCooldownUntil - now)/1000));
  return packSubStrip() + `
  <div class="screen-fade" style="position:relative; height: calc(100% - 50px);">
    <div class="chat-scroll">
      <div class="small muted" style="text-align:center; margin-bottom:4px;">— Local Chat &middot; ${STATE.user.chapter} —</div>
      ${CHAPTER_CHAT.map(m => `<div class="bubble-msg them"><strong style="color:var(--sky);">${m.name}:</strong> ${m.text}</div>`).join('')}
      ${cooling ? `<div class="cooldown-banner">${ICONS.clock} Spam filter active — wait ${remaining}s</div>` : ''}
    </div>
    <div class="chat-input-bar" style="position:relative;">
      <button class="icon-btn">${ICONS.image}</button>
      <input placeholder="${cooling ? 'Cooldown active…' : 'Message the chapter…'}" ${cooling ? 'disabled' : ''} id="chatInput">
      <button class="send-btn" ${cooling ? 'disabled' : ''} data-do="send-chat">${ICONS.send}</button>
    </div>
  </div>`;
}

/* ==========================================================================
   BODY
   ========================================================================== */
function bodySubStrip() {
  const subs = [{k:'diet',l:'Diet & Nutrition'},{k:'exercise',l:'Exercise & Movement'}];
  return `<div class="subsection-strip">${subs.map(s => `<div class="sub-pill ${STATE.route.includes(s.k)?'active':''}" data-go="#/body/${s.k}">${s.l}</div>`).join('')}</div>`;
}

function screenBodyDiet() {
  return bodySubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="section-title">TopDawgs Approved Guidelines</div>
    <div class="card">
      <p class="small muted">Answer a few questions to generate a plan tailored to your goals and schedule.</p>
      <div class="field"><label>Primary goal</label><select><option>Build muscle</option><option>Lose fat</option><option>Maintain</option></select></div>
      <div class="field"><label>Meals per day</label><select><option>3</option><option>4</option><option>5</option></select></div>
      <button class="btn btn-primary" data-toast="Meal plan refreshed">Generate meal plan</button>
    </div>
    <div class="section-title">Today's Plan</div>
    ${MEAL_PLAN.map(m => `
    <div class="card"><div class="row between"><strong class="small">${m.meal}</strong><span class="chip sky">+0.1 Body</span></div><p class="small muted" style="margin-top:6px;">${m.text}</p></div>`).join('')}
  </div>`;
}

function screenBodyExercise() {
  return bodySubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="section-title">Environment</div>
    <div class="row gap-sm" style="margin-bottom:14px;">
      <div class="chip sky">Gym access</div><div class="chip ghost">Home only</div><div class="chip ghost">Both</div>
    </div>
    <div class="section-title">Today's Custom Routine</div>
    ${WORKOUT_PLAN.map(w => `
    <div class="card"><div class="plan-item"><div class="num-badge">${w.step}</div><p class="small">${w.text}</p></div></div>`).join('')}
    <button class="btn btn-primary" data-toast="+0.1 logged to Body score">Log workout complete</button>
  </div>`;
}

/* ==========================================================================
   MIND
   ========================================================================== */
function mindSubStrip() {
  const subs = [{k:'videos',l:'Video Series'},{k:'checklist',l:'Checklist'},{k:'soundscapes',l:'Soundscapes'},{k:'vault',l:'Secrets Vault'}];
  return `<div class="subsection-strip">${subs.map(s => `<div class="sub-pill ${STATE.route.includes(s.k)?'active':''}" data-go="#/mind/${s.k}">${s.l}</div>`).join('')}</div>`;
}

function screenMindVideos() {
  return mindSubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="section-title">Educational Video Series</div>
    ${VIDEOS.map(v => `
    <div class="card row gap-md">
      <div style="width:70px;height:50px;border-radius:8px;background:var(--panel-2);display:flex;align-items:center;justify-content:center;flex:none;">${ICONS.film}</div>
      <div style="flex:1;"><strong class="small">${v.title}</strong><div class="tiny muted">${v.length}</div></div>
      <span class="chip sky">${v.points}</span>
    </div>`).join('')}
  </div>`;
}

function screenMindChecklist() {
  return mindSubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="section-title">Daily Action & Reflection</div>
    <div class="card">
      ${CHECKLIST.map(t => `
      <div class="checklist-item ${t.done?'done':''}" data-do="toggle-checklist" data-id="${t.id}">
        <div class="checkbox">${t.done ? ICONS.check : ''}</div>
        <div style="flex:1;"><div class="small label">${t.label}</div><span class="tiny muted">${t.pillar}</span></div>
        ${t.testReminder ? `<span class="chip warn">Test due</span>` : ''}
      </div>`).join('')}
    </div>
    <div class="section-title">Low-Cost Testing Nearby</div>
    ${CLINICS.map(c => `
    <div class="card row between"><div>${ICONS.medkit}<div style="display:inline-block;margin-left:10px;"><strong class="small">${c.name}</strong><div class="tiny muted">${c.distance} &middot; ${c.cost}</div></div></div></div>`).join('')}
  </div>`;
}

function screenMindSoundscapes() {
  const playing = STATE.playingSound;
  return mindSubStrip() + `
  <div class="screen-inner screen-fade" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    ${SOUNDSCAPES.map(s => `
    <div class="soundscape-tile ${playing===s?'playing':''}" data-do="play-sound" data-sound="${s}">
      ${playing===s ? ICONS.pause : ICONS.play}
      <div class="small" style="margin-top:8px;">${s}</div>
    </div>`).join('')}
  </div>
  ${playing ? `<div class="player-bar"><button class="play-btn" data-do="stop-sound">${ICONS.pause}</button><div><strong class="small">${playing}</strong><div class="tiny muted">Ambient loop &middot; playing</div></div></div>` : ''}
  `;
}

function screenMindVault() {
  return mindSubStrip() + `
  <div class="screen-inner screen-fade">
    <div class="vault-box">
      ${ICONS.vaultIcon}
      <h3 style="font-size:15px; margin-bottom:6px;">Time-Lock Vault & Secret Board</h3>
      <p class="small muted">Submit anonymously. Your entry is NLP-anonymized and released to the public feed after a randomized 3–10 day delay.</p>
    </div>
    <div class="field" style="margin-top:14px;"><textarea placeholder="Write what's on your mind…"></textarea></div>
    <button class="btn btn-primary" data-toast="Submitted to the Vault — releasing in 3-10 days">Submit anonymously</button>
    <div class="section-title">Recently Released</div>
    <div class="card"><p class="small muted">"Six months clean off nicotine. The Pack kept me accountable more than I expected."</p></div>
    <div class="card"><p class="small muted">"Told my sponsor the truth for the first time. Scared, but lighter."</p></div>
  </div>`;
}

/* ==========================================================================
   NOTIFICATIONS (Facebook-style list — tap a card, go to what it's about)
   ========================================================================== */
function notifIconFor(type) {
  return ({ message: 'chat', event: 'clock', badge: 'medal', testing: 'medkit', system: 'bell' })[type] || 'bell';
}

function screenNotifications() {
  return topbarSolid('Notifications') + `
  <div class="screen-inner screen-fade">
    <h2 class="page-title">Notifications</h2>
    ${NOTIFICATIONS.length === 0 ? `<div class="empty-state">${ICONS.bell}<div>You're all caught up.</div></div>` : NOTIFICATIONS.map(n => `
    <div class="card notif-card ${n.read ? '' : 'unread'}" data-go="${n.target}" data-do="read-notif" data-id="${n.id}">
      <div class="row gap-md">
        <div class="notif-icon">${ICONS[notifIconFor(n.type)]}</div>
        <div style="flex:1;">
          <p class="small">${n.text}</p>
          <span class="tiny muted">${n.time} ago</span>
        </div>
        ${n.read ? '' : '<span class="notif-dot-static"></span>'}
      </div>
    </div>`).join('')}
  </div>`;
}

/* ==========================================================================
   DM THREAD
   ========================================================================== */
function screenDM(id) {
  const c = CONTACTS.find(x => x.id === id) || CONTACTS[0];
  return `
  <div class="topbar solid">
    <div class="topbar-left">
      <button class="icon-btn" data-go="#/pack/contacts">${ICONS.chevronLeft}</button>
      ${avatarHTML(c.name,30)}
      <div><div class="row gap-sm small">${c.name}</div><span class="chat-header-flag">${c.nsfw ? '😈 NSFW mode on' : '👼 SFW headspace'}</span></div>
    </div>
    <div class="topbar-right"><button class="icon-btn">${ICONS.ellipsis}</button></div>
  </div>
  <div class="screen-fade" style="position:relative; height: calc(100% - 46px);">
    <div class="chat-scroll">
      ${DM_THREAD.map(m => `<div class="bubble-msg ${m.from==='me'?'me':'them'}">${m.text}</div>`).join('')}
    </div>
    <div class="chat-input-bar" style="position:relative;">
      <button class="icon-btn" data-toast="Attach a photo">${ICONS.attachment}</button>
      <input placeholder="Type a message…" id="dmInput">
      <button class="send-btn" data-do="send-dm">${ICONS.send}</button>
    </div>
  </div>`;
}

/* ==========================================================================
   PROFILE
   ========================================================================== */
function screenProfile() {
  const u = STATE.user;
  return topbarSolid('Profile', `<button class="icon-btn" data-go="#/settings">${ICONS.settingsGear}</button>`) + `
  <div class="screen-inner screen-fade">
    <div style="text-align:center; padding: 10px 0 6px;">
      ${avatarHTML(u.name, 84)}
      <h2 style="margin-top:10px;">${u.name}</h2>
      <span class="muted small">${u.handle}</span>
      <div style="margin-top:8px;">${rankBadgeHTML(u.rank)}</div>
      <p class="small muted" style="margin-top:6px;">${u.chapter}</p>
    </div>
    <div class="card">
      <p class="small">${u.bio}</p>
      <div class="row gap-sm" style="margin-top:10px; flex-wrap:wrap;">${u.tags.map(t => `<span class="chip ghost">${t}</span>`).join('')}</div>
    </div>
    <div class="card">
      <div class="row between"><span class="small muted">Matrix Score</span><div class="matrix-score"><span class="num">${u.matrixScore.toFixed(1)}</span><span class="max">/5.0</span></div></div>
      <div class="row between small muted" style="margin-top:10px;"><span>Body</span><span>${u.bodyScore.toFixed(1)}</span></div>
      <div class="meter"><div style="width:${u.bodyScore/5*100}%"></div></div>
      <div class="row between small muted" style="margin-top:10px;"><span>Mind</span><span>${u.mindScore.toFixed(1)}</span></div>
      <div class="meter"><div style="width:${u.mindScore/5*100}%"></div></div>
    </div>
    <div class="card">
      <div class="section-title" style="margin-top:0;">Earned Badges</div>
      <div class="badge-grid">
        ${u.badges.map(b => `<div class="badge-item"><div class="badge-icon">${ICONS[BADGE_META[b].icon]}</div><span>${BADGE_META[b].label}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="section-title" style="margin-top:0;">Health Status (Private)</div>
      <div class="toggle-row">
        <div><div class="toggle-label small">Show STI status on my profile</div><div class="toggle-sub">Off by default. Results themselves are never shown — only your compliance badge.</div></div>
        <label class="toggle"><input type="checkbox" ${u.showSTIOnProfile?'checked':''} data-toggle="showSTIOnProfile"><span class="track"><span class="knob"></span></span></label>
      </div>
      <div class="row between small" style="margin-top:8px;"><span class="muted">Testing compliance</span><span class="chip ok">Up to date</span></div>
    </div>
  </div>`;
}

/* ==========================================================================
   SETTINGS (quick-settings + full settings page)
   ========================================================================== */
function quickSettingsPanel() {
  const u = STATE.user;
  const nsfwLocked = u.rank === 'mutt';
  return `
  <div class="modal-overlay" data-do="close-quicksettings" style="align-items:flex-start; justify-content:flex-end;">
    <div class="card raised screen-fade" style="width:250px; margin:56px 12px 0; padding:14px;">
      <div class="row gap-sm" style="margin-bottom:10px;">${avatarHTML(u.name,36)}<div><strong class="small">${u.name}</strong><div class="tiny muted">${u.handle}</div></div></div>
      <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:flex-start; margin-bottom:6px;" data-go="#/profile">My Profile</button>
      <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:flex-start; margin-bottom:10px;" data-go="#/settings">Settings</button>
      <div class="toggle-row" style="padding:8px 0;">
        <div class="toggle-label small">Global NSFW ${nsfwLocked?ICONS.lock:''}</div>
        <label class="toggle ${nsfwLocked?'locked':''}"><input type="checkbox" ${u.nsfwEnabled?'checked':''} data-toggle="nsfwEnabled"><span class="track"><span class="knob"></span></span></label>
      </div>
      ${nsfwLocked ? `<div class="tiny faint" style="margin-bottom:6px;">Reach Pack Dawg status to enable NSFW content</div>` : ''}
      <div class="toggle-row" style="padding:8px 0;"><div class="toggle-label small">Allow DMs</div><label class="toggle"><input type="checkbox" ${u.allowDMs?'checked':''} data-toggle="allowDMs"><span class="track"><span class="knob"></span></span></label></div>
      <div class="toggle-row" style="padding:8px 0;"><div class="toggle-label small">Allow Flirts</div><label class="toggle"><input type="checkbox" ${u.allowFlirts?'checked':''} data-toggle="allowFlirts"><span class="track"><span class="knob"></span></span></label></div>
      <div style="padding:10px 0 2px;">
        <div class="row between small"><span class="muted">Radius</span><span>${u.radius} mi</span></div>
        <div class="slider-wrap"><input type="range" min="15" max="75" value="${u.radius}" data-range="radius"></div>
      </div>
    </div>
  </div>`;
}

function screenSettings() {
  const u = STATE.user;
  const nsfwLocked = u.rank === 'mutt';
  return topbarSolid('Settings', '') + `
  <div class="screen-inner screen-fade">
    <h2 class="page-title">Settings</h2>
    <div class="section-title">Visibility & Content</div>
    <div class="card">
      <div class="toggle-row">
        <div><div class="toggle-label">Global NSFW ${nsfwLocked?ICONS.lock:''}</div><div class="toggle-sub">${nsfwLocked ? 'Reach Pack Dawg status to enable NSFW content' : 'Show adult content across the app'}</div></div>
        <label class="toggle ${nsfwLocked?'locked':''}"><input type="checkbox" ${u.nsfwEnabled?'checked':''} data-toggle="nsfwEnabled"><span class="track"><span class="knob"></span></span></label>
      </div>
      <div class="toggle-row"><div><div class="toggle-label">Allow DMs</div><div class="toggle-sub">Anyone can message you directly</div></div><label class="toggle"><input type="checkbox" ${u.allowDMs?'checked':''} data-toggle="allowDMs"><span class="track"><span class="knob"></span></span></label></div>
      <div class="toggle-row"><div><div class="toggle-label">Allow Flirts</div><div class="toggle-sub">Let others send flirt reactions</div></div><label class="toggle"><input type="checkbox" ${u.allowFlirts?'checked':''} data-toggle="allowFlirts"><span class="track"><span class="knob"></span></span></label></div>
    </div>
    <div class="section-title">Discovery Radius</div>
    <div class="card">
      <div class="row between small"><span class="muted">Search & feed radius</span><span>${u.radius} miles</span></div>
      <div class="slider-wrap"><input type="range" min="15" max="75" value="${u.radius}" data-range="radius"></div>
    </div>
    <div class="section-title">Privacy</div>
    <div class="card">
      <button class="btn btn-secondary" style="margin-bottom:8px;" data-go="#/blocked">Blocked users</button>
      <button class="btn btn-secondary">Download my data</button>
    </div>
    <div class="section-title">Account</div>
    <div class="card"><button class="btn btn-danger" data-toast="Signed out (demo)">Sign out</button></div>
  </div>`;
}

function screenBlocked() {
  return topbarSolid('Blocked Users', '') + `
  <div class="screen-inner screen-fade">
    <h2 class="page-title">Blocked Users</h2>
    <div class="card blocked-list">
      ${BLOCKED_USERS.map(b => `<div class="contact-row"><div class="name-block">${b}</div><button class="btn btn-secondary btn-sm" data-toast="Unblocked ${b}">Unblock</button></div>`).join('')}
    </div>
  </div>`;
}

/* ==========================================================================
   POST / EVENT CREATION MODAL
   ========================================================================== */
function postModal() {
  const mode = STATE.postMode || 'post';
  const eventType = STATE.eventType || 'casual';
  const canAdultPlay = STATE.user.rank !== 'mutt' && STATE.user.stiStatus !== 'positive';
  return `
  <div class="modal-overlay" data-do="close-post-modal">
    <div class="modal-sheet screen-fade">
      <div class="handle"></div>
      <div class="segmented">
        <button class="${mode==='post'?'active':''}" data-do="post-mode-post">Post</button>
        <button class="${mode==='event'?'active':''}" data-do="post-mode-event">Event</button>
      </div>
      <div class="field"><textarea placeholder="What's on your mind, Dawg?"></textarea></div>
      <div class="attach-row">
        <div class="attach-tile">${ICONS.image}</div>
        <div class="attach-tile">${ICONS.camera}</div>
      </div>
      ${mode === 'event' ? `
      <div class="section-title" style="margin-top:4px;">Event Type</div>
      <div class="segmented" style="margin-bottom:14px;">
        <button class="${eventType==='casual'?'active':''}" data-do="event-type-casual">Casual Local</button>
        <button class="${eventType==='adult'?'active':''} ${canAdultPlay?'':''}" data-do="event-type-adult">Adult Play</button>
      </div>
      ${eventType === 'adult' && !canAdultPlay ? `<div class="lock-notice">${ICONS.lock}<span>Adult Play events require Pack Dawg+ rank and a current negative/undetectable testing status on file.</span></div>` : ''}
      <div class="field"><label>Venue</label><input placeholder="Search venue or partner location…"></div>
      <div class="row gap-sm">
        <div class="field" style="flex:1;"><label>Date & time</label><input type="datetime-local"></div>
        <div class="field" style="flex:1;"><label>Capacity</label><input type="number" placeholder="e.g. 10"></div>
      </div>
      <div class="toggle-row"><div class="toggle-label small">Allow comments</div><label class="toggle"><input type="checkbox" checked><span class="track"><span class="knob"></span></span></label></div>
      <div class="toggle-row"><div class="toggle-label small">Allow reactions</div><label class="toggle"><input type="checkbox" checked><span class="track"><span class="knob"></span></span></label></div>
      ` : `
      <div class="toggle-row"><div class="toggle-label small">Mark as NSFW</div><div class="toggle-sub">Auto-detected by image scan; manual overrides are peer-audited</div><label class="toggle"><input type="checkbox"><span class="track"><span class="knob"></span></span></label></div>
      `}
      <button class="btn btn-primary" style="margin-top:6px;" ${mode==='event' && eventType==='adult' && !canAdultPlay ? 'disabled' : ''} data-do="submit-post-modal">${mode === 'event' ? 'Create event' : 'Post to Wall Feed'}</button>
    </div>
  </div>`;
}
