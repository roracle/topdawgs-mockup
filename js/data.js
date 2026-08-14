/* ============================================================
   TOPDAWGS — MOCK DATA LAYER
   All lists are config-array driven so the section/subsection
   structure can be extended later (e.g. a future RN port)
   without touching render logic.
   ============================================================ */

const RANKS = ['Mutt', 'Pack Dawg', 'TopDawg'];

const SECTIONS = [
  { id: 'community', label: 'Community', icon: 'community', hasSubsections: false },
  { id: 'pack',      label: 'Pack',      icon: 'pack',      hasSubsections: true,
    subsections: [
      { id: 'messages', label: 'Messages' },
      { id: 'chat',     label: 'Chat' },
      { id: 'wall',     label: 'Wall' },
      { id: 'events',   label: 'Events' },
      { id: 'havens',   label: 'Havens' },
    ]
  },
  { id: 'body',      label: 'Body',      icon: 'body',      hasSubsections: true,
    subsections: [
      { id: 'nutrition', label: 'Nutrition' },
      { id: 'exercise',  label: 'Exercise' },
    ]
  },
  { id: 'mind',      label: 'Mind',      icon: 'mind',      hasSubsections: true,
    subsections: [
      { id: 'checklist', label: 'Checklist' },
      { id: 'modules',   label: 'Modules' },
      { id: 'sounds',    label: 'Sounds' },
      { id: 'secrets',   label: 'Secrets' },
    ]
  },
];

const MAP_FILTERS = [
  { id: 'people',      label: 'People' },
  { id: 'havens',      label: 'Havens' },
  { id: 'events',      label: 'Events' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'gyms',        label: 'Gyms' },
  { id: 'other',       label: 'Other' },
];

/* Integrity Rating spectrum: 0.00 red -> 5.00 purple */
function integrityColor(score) {
  const stops = [
    [0.0, '#ef4444'],
    [1.25, '#f59e0b'],
    [2.5, '#facc15'],
    [3.75, '#34d399'],
    [5.0, '#a855f7'],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [s0, c0] = stops[i], [s1, c1] = stops[i + 1];
    if (score >= s0 && score <= s1) {
      const t = (score - s0) / (s1 - s0);
      return lerpColor(c0, c1, t);
    }
  }
  return stops[stops.length - 1][1];
}
function lerpColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bch = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bch})`;
}
function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return { r: parseInt(v.slice(0,2),16), g: parseInt(v.slice(2,4),16), b: parseInt(v.slice(4,6),16) };
}

/* ---------- Mock community members ---------- */
const MOCK_USERS = [
  { id: 'u1', handle: 'AlphaMarcus', rank: 'TopDawg', integrity: 4.6, mutt: false, nsfw: false,
    online: true, incognito: false, showSTI: true,
    integrityParts: { community: 4.7, pack: 4.8, body: 4.4, mind: 4.5 },
    age: 28, height: "6'1\"", weight: '185 lbs', position: 'Verse Top', size: '7.5"',
    bio: 'Fitness enthusiast, local haven host, and heavy lifter. If you want a gym partner who actually shows up, that\'s me.',
    nsfwBio: 'Looking for active verse partners who lift as hard as they play.',
    sti: { status: 'clear', expiresInDays: 143 }, safeSexOnly: true,
    unreadDMs: 2, x: 24, y: 32,
    images: [
      { id: 'img1', uploaded: 'Aug 2, 2026 2:22 PM', nsfw: false },
      { id: 'img2', uploaded: 'Jul 19, 2026 9:03 AM', nsfw: false },
      { id: 'img3', uploaded: 'Aug 6, 2026 11:40 PM', nsfw: true },
    ] },
  { id: 'u2', handle: 'RustyTrail', rank: 'Pack Dawg', integrity: 3.1, mutt: false, nsfw: true,
    online: true, incognito: false, showSTI: true,
    integrityParts: { community: 3.4, pack: 3.0, body: 3.2, mind: 2.8 },
    age: 33, height: "5'11\"", weight: '172 lbs', position: 'Bottom', size: '—',
    bio: 'Trail runner, weekend hiker, unrepentant coffee snob.',
    nsfwBio: 'Down for chill company after a long day on the trail.',
    sti: { status: 'clear', expiresInDays: 61 }, safeSexOnly: true,
    unreadDMs: 0, x: 62, y: 56,
    images: [{ id: 'img4', uploaded: 'Aug 9, 2026 9:10 PM', nsfw: true }] },
  { id: 'u3', handle: 'CedarHowl', rank: 'Pack Dawg', integrity: 2.4, mutt: false, nsfw: false,
    online: true, incognito: false, showSTI: false,
    integrityParts: { community: 2.9, pack: 2.6, body: 2.0, mind: 2.1 },
    age: 25, height: "5'9\"", weight: '160 lbs', position: 'Verse', size: '—',
    bio: 'Runs the events calendar. Always down for game night.',
    nsfwBio: '', sti: { status: 'expired', expiresInDays: 0 }, safeSexOnly: false,
    unreadDMs: 0, x: 42, y: 20,
    images: [{ id: 'img5', uploaded: 'Jun 30, 2026 12:44 PM', nsfw: false }] },
  { id: 'u4', handle: 'SableFang', rank: 'TopDawg', integrity: 4.9, mutt: false, nsfw: true,
    online: true, incognito: false, showSTI: true,
    integrityParts: { community: 5.0, pack: 4.9, body: 4.9, mind: 4.8 },
    age: 31, height: "6'2\"", weight: '198 lbs', position: 'Top', size: '8"',
    bio: 'Haven host. Gym partner wanted, flakes need not apply.',
    nsfwBio: 'Top energy only. Message with intent.',
    sti: { status: 'clear', expiresInDays: 22 }, safeSexOnly: false,
    unreadDMs: 0, x: 76, y: 30,
    images: [{ id: 'img6', uploaded: 'Aug 11, 2026 6:02 PM', nsfw: true }] },
  { id: 'u5', handle: 'MossPup', rank: 'Mutt', integrity: 1.0, mutt: true, nsfw: false,
    online: true, incognito: false, showSTI: false,
    integrityParts: { community: 1.0, pack: 1.2, body: 0.9, mind: 0.9 },
    age: 21, height: "5'7\"", weight: '145 lbs', position: '—', size: '—',
    bio: 'New to the pack. Looking for people to hike with.', nsfwBio: '',
    sti: { status: 'none', expiresInDays: 0 }, safeSexOnly: false,
    unreadDMs: 0, x: 50, y: 72,
    images: [] },
  { id: 'u6', handle: 'NightWatch', rank: 'Pack Dawg', integrity: 3.8, mutt: false, nsfw: true,
    online: false, incognito: true, showSTI: true,
    integrityParts: { community: 3.9, pack: 3.8, body: 3.7, mind: 3.8 },
    age: 29, height: "6'0\"", weight: '180 lbs', position: 'Verse', size: '6.5"',
    bio: 'Currently incognito — proof that hidden members drop off the map.', nsfwBio: 'Ask me when I surface.',
    sti: { status: 'clear', expiresInDays: 90 }, safeSexOnly: true,
    unreadDMs: 0, x: 34, y: 50,
    images: [] },
];

/* ---------- Direct message threads ---------- */
const MOCK_DM_THREADS = {
  u1: [
    { me: false, text: 'Hey! Grabbing food after the workout?' },
    { me: true,  text: 'Yeah, sounds good. Meet at 6?' },
    { me: false, text: 'Perfect. Same spot as last time.' },
  ],
  u2: [
    { me: false, text: 'That trail you mentioned — is it dog friendly?' },
  ],
  u3: [],
  u4: [],
  u5: [
    { me: false, text: 'Hi! Just joined. Any advice for a new Mutt?' },
  ],
  u6: [],
};

/* ---------- Pack: Chat ---------- */
const MOCK_CHAT = [
  { user: 'Dave', text: "Who's hitting the gym today?" },
  { user: 'Dave', text: "I'll be there at 5." },
  { user: 'RustyTrail', text: "Count me in." },
];

/* ---------- Pack: Wall ---------- */
const MOCK_WALL = [
  { id: 'w1', user: 'AlphaMarcus', rank: 'TopDawg', time: '2h ago',
    text: 'Great turnout at the Saturday trail meetup! Already planning the next one.', likes: 14, comments: 3 },
  { id: 'w2', user: 'CedarHowl', rank: 'Pack Dawg', time: '5h ago',
    text: 'Reminder: chapter game night moved to Thursday this week.', likes: 9, comments: 1 },
  { id: 'w3', user: 'SableFang', rank: 'TopDawg', time: '1d ago',
    text: 'Haven booking slots for next weekend just opened up.', likes: 22, comments: 6 },
];

/* ---------- Pack: Events ---------- */
const MOCK_EVENTS = [
  { id: 'e0', title: 'Sunset Ridge Hike', host: 'SableFang', date: 'Aug 10 · completed', rsvps: 6, going: true, needsReview: true },
  { id: 'e1', title: 'Saturday Trail Run', host: 'CedarHowl', date: 'Aug 16, 8:00 AM', rsvps: 12, going: false },
  { id: 'e2', title: 'Chapter Game Night', host: 'AlphaMarcus', date: 'Aug 20, 7:00 PM', rsvps: 8, going: true },
  { id: 'e3', title: 'Gym Meetup + Protein Bar', host: 'SableFang', date: 'Aug 23, 6:00 PM', rsvps: 5, going: false },
];

/* ---------- Pack: Havens ---------- */
const MOCK_HAVENS = [
  { id: 'h1', name: "Marcus's Loft", host: 'AlphaMarcus', rating: 4.8, distance: '1.2 mi', passes: 'Overnight & Refresh' },
  { id: 'h2', name: 'Sable Den', host: 'SableFang', rating: 4.9, distance: '3.4 mi', passes: 'Overnight only' },
  { id: 'h3', name: 'Cedar Cabin', host: 'CedarHowl', rating: 4.5, distance: '5.0 mi', passes: 'Refresh only' },
];

/* ---------- Body ---------- */
const MOCK_NUTRITION = { calories: { current: 1450, goal: 2200 }, water: { current: 4, goal: 8 },
  meals: [{ name: 'Breakfast', cal: 420 }, { name: 'Lunch', cal: 610 }, { name: 'Snack', cal: 420 }] };
const MOCK_EXERCISE = { pushups: { current: 40, goal: 100 }, situps: { current: 30, goal: 100 },
  cardio: { current: 18, goal: 30, unit: 'min' } };

/* ---------- Mind ---------- */
const MOCK_CHECKLIST = [
  { id: 'c1', text: 'STI / Blood Panel Screen', due: 'Overdue', urgent: true, cta: 'Find Free/Cheap Local Clinics' },
  { id: 'c2', text: 'Morning breathing routine', due: 'Today', urgent: false },
  { id: 'c3', text: 'Weekly reflection journal', due: 'Today', urgent: false },
];
const MOCK_MODULES = [
  { id: 'm1', title: 'Foundations of Self-Mastery', length: '12 min' },
  { id: 'm2', title: 'Setting Boundaries with Confidence', length: '9 min' },
  { id: 'm3', title: 'Building Morning Discipline', length: '15 min' },
];
const MOCK_SOUNDS = [
  { id: 's1', title: 'Rainfall Focus', length: '30 min', premium: false },
  { id: 's2', title: 'Deep Forest Breathing', length: '10 min', premium: true },
  { id: 's3', title: 'Midnight Ambient Drift', length: '45 min', premium: true },
];
const MOCK_SECRETS = [
  { id: 'sec1', title: 'Locked Memory #1', locked: true, releaseIn: '3 days' },
  { id: 'sec2', title: 'Locked Memory #2', locked: true, releaseIn: '11 days' },
];

/* ---------- Shop ---------- */
const SHOP_TABS = ['Themes', 'Sounds', 'Apparel', 'Utility'];
const SHOP_ITEMS = {
  Themes:  [{ name: 'Neon Glow Tracker', price: 120 }, { name: 'Violet Pin Set', price: 80 }, { name: 'Midnight Spectrum Skin', price: 150 }],
  Sounds:  [{ name: 'Deep Forest Breathing', price: 60 }, { name: 'Midnight Ambient Drift', price: 90 }],
  Apparel: [{ name: 'TopDawgs Hoodie', price: 900 }, { name: 'Suede Pack Cap', price: 450 }],
  Utility: [{ name: 'Extended Haven Pass', price: 300 }, { name: 'Priority Event Pass', price: 200 }, { name: 'Profile Highlight Token', price: 150 }],
};

/* ---------- Notifications (drives red-dot + auto-jump) ---------- */
function seedNotifications() {
  return [
    { id: 'n1', section: 'mind', subsection: 'checklist', text: 'Time for your STI and Blood Panel Screen.', read: false, time: 'now' },
    { id: 'n2', section: 'pack', subsection: 'wall', text: 'AlphaMarcus tagged you in a Wall post.', read: false, time: '10m ago' },
    { id: 'n3', section: 'pack', subsection: 'messages', text: 'RustyTrail sent you a message.', read: false, time: '25m ago' },
    { id: 'n4', section: 'community', subsection: null, text: 'SableFang is now within your radius.', read: true, time: '1h ago' },
  ];
}

/* ---------- Default logged-in user ---------- */
function seedCurrentUser() {
  return {
    handle: 'AlphaDawg',
    rank: 'Pack Dawg',
    integrity: 3.4,
    integrityParts: { community: 3.6, pack: 3.8, body: 3.1, mind: 3.1 },
    mutt: false,
    nsfw: false,
    allowDMs: true,
    allowFlirts: true,
    incognito: false,
    radius: 2.5,
    notifMode: 'both',        // classic | modern | both
    pageNotifs: true,
    age: 30,
    height: "6'0\"",
    weight: '178 lbs',
    position: 'Verse',
    size: '7"',
    bio: 'Building the pack one meetup at a time. Lift heavy, show up early, leave the trail cleaner than you found it.',
    nsfwBio: 'Ask me in person.',
    safeSexOnly: true,
    showSTI: true,
    sti: { status: 'clear', expiresInDays: 172 },
    lifetimePoints: 2140,
    spendablePoints: 365,
    lastPhotoRewardDate: null,
    images: [
      { id: 'own1', uploaded: 'Aug 12, 2026 7:15 AM', nsfw: false },
      { id: 'own2', uploaded: 'Aug 4, 2026 5:48 PM', nsfw: false },
    ],
    blockedUsers: [],
    pausedUsers: [],
    notesOnUsers: {},
  };
}
