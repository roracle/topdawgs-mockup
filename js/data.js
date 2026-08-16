/* ============================================================
   TOPDAWGS — DATA LAYER
   Config arrays drive the whole section/subsection structure, so
   adding a subsection is a data edit, not a render-code edit.
   ============================================================ */

const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const T0 = Date.now();

const RANKS = ['Mutt', 'Pack Dawg', 'TopDawg'];

const SECTIONS = [
  { id: 'community', label: 'Community', icon: 'community', hasSubsections: false },
  { id: 'pack', label: 'Pack', icon: 'pack', hasSubsections: true, subsections: [
      { id: 'messages', label: 'Messages' },
      { id: 'chat', label: 'Chat' },
      { id: 'wall', label: 'Wall' },
      { id: 'events', label: 'Events' },
      { id: 'havens', label: 'Havens' },
  ]},
  { id: 'body', label: 'Body', icon: 'body', hasSubsections: true, subsections: [
      { id: 'nutrition', label: 'Nutrition' },
      { id: 'exercise', label: 'Exercise' },
  ]},
  { id: 'mind', label: 'Mind', icon: 'mind', hasSubsections: true, subsections: [
      { id: 'checklist', label: 'Checklist' },
      { id: 'modules', label: 'Modules' },
      { id: 'sounds', label: 'Sounds' },
      { id: 'secrets', label: 'Secrets' },
  ]},
];

const MAP_FILTERS = [
  { id: 'people', label: 'People' },
  { id: 'havens', label: 'Havens' },
  { id: 'events', label: 'Events' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'gyms', label: 'Gyms' },
  { id: 'other', label: 'Other' },
];

/* ---------- Integrity Rating spectrum: 0.00 red -> 5.00 purple ---------- */
function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
function lerpColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  return 'rgb(' + Math.round(pa.r + (pb.r - pa.r) * t) + ',' +
                  Math.round(pa.g + (pb.g - pa.g) * t) + ',' +
                  Math.round(pa.b + (pb.b - pa.b) * t) + ')';
}
function integrityColor(score) {
  const stops = [[0, '#ef4444'], [1.25, '#f59e0b'], [2.5, '#facc15'], [3.75, '#34d399'], [5, '#a855f7']];
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i][0], c0 = stops[i][1], s1 = stops[i + 1][0], c1 = stops[i + 1][1];
    if (score >= s0 && score <= s1) return lerpColor(c0, c1, (score - s0) / (s1 - s0));
  }
  return '#a855f7';
}

/* ---------- Relative timestamps ---------- */
function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 45 * 1000) return 'just now';
  if (d < HOUR) return Math.max(1, Math.round(d / MIN)) + 'm';
  if (d < DAY) return Math.round(d / HOUR) + 'h';
  if (d < 7 * DAY) return Math.round(d / DAY) + 'd';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function timeFull(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/* ---------- Members ---------- */
const MOCK_USERS = [
  { id: 'u1', handle: 'AlphaMarcus', name: 'Marcus', rank: 'TopDawg', integrity: 4.6,
    mutt: false, nsfw: false, online: true, incognito: false, showSTI: true,
    integrityParts: { community: 4.7, pack: 4.8, body: 4.4, mind: 4.5 },
    age: 28, height: "6'1\"", weight: '185 lbs', position: 'Verse Top', size: '7.5"',
    bio: 'Fitness enthusiast, haven host, heavy lifter. If you want a gym partner who actually shows up, that is me. #gym #havens',
    nsfwBio: 'Looking for active verse partners who lift as hard as they play.',
    sti: { status: 'clear', expiresInDays: 143 }, safeSexOnly: true,
    followers: 412, x: 24, y: 32, joined: T0 - 620 * DAY,
    images: [
      { id: 'i1', src: 'assets/photos/gym.svg', uploaded: T0 - 14 * DAY, nsfw: false },
      { id: 'i2', src: 'assets/photos/trail.svg', uploaded: T0 - 28 * DAY, nsfw: false },
      { id: 'i3', src: 'assets/photos/night.svg', uploaded: T0 - 10 * DAY, nsfw: true },
    ]},
  { id: 'u2', handle: 'RustyTrail', name: 'Rusty', rank: 'Pack Dawg', integrity: 3.1,
    mutt: false, nsfw: true, online: true, incognito: false, showSTI: true,
    integrityParts: { community: 3.4, pack: 3.0, body: 3.2, mind: 2.8 },
    age: 33, height: "5'11\"", weight: '172 lbs', position: 'Bottom', size: '—',
    bio: 'Trail runner, weekend hiker, unrepentant coffee snob. #trails',
    nsfwBio: 'Down for chill company after a long day on the trail.',
    sti: { status: 'clear', expiresInDays: 61 }, safeSexOnly: true,
    followers: 188, x: 62, y: 56, joined: T0 - 300 * DAY,
    images: [{ id: 'i4', src: 'assets/photos/trail.svg', uploaded: T0 - 6 * DAY, nsfw: true }]},
  { id: 'u3', handle: 'CedarHowl', name: 'Cedar', rank: 'Pack Dawg', integrity: 2.4,
    mutt: false, nsfw: false, online: true, incognito: false, showSTI: false,
    integrityParts: { community: 2.9, pack: 2.6, body: 2.0, mind: 2.1 },
    age: 25, height: "5'9\"", weight: '160 lbs', position: 'Verse', size: '—',
    bio: 'Runs the events calendar. Always down for game night. #events',
    nsfwBio: '', sti: { status: 'expired', expiresInDays: 0 }, safeSexOnly: false,
    followers: 96, x: 42, y: 20, joined: T0 - 210 * DAY,
    images: [{ id: 'i5', src: 'assets/photos/diner.svg', uploaded: T0 - 46 * DAY, nsfw: false }]},
  { id: 'u4', handle: 'SableFang', name: 'Sable', rank: 'TopDawg', integrity: 4.9,
    mutt: false, nsfw: true, online: true, incognito: false, showSTI: true,
    integrityParts: { community: 5.0, pack: 4.9, body: 4.9, mind: 4.8 },
    age: 31, height: "6'2\"", weight: '198 lbs', position: 'Top', size: '8"',
    bio: 'Haven host. Gym partner wanted, flakes need not apply. #havens #gym',
    nsfwBio: 'Top energy only. Message with intent.',
    sti: { status: 'clear', expiresInDays: 22 }, safeSexOnly: false,
    followers: 730, x: 76, y: 30, joined: T0 - 800 * DAY,
    images: [{ id: 'i6', src: 'assets/photos/cabin.svg', uploaded: T0 - 5 * DAY, nsfw: true }]},
  { id: 'u5', handle: 'MossPup', name: 'Moss', rank: 'Mutt', integrity: 1.0,
    mutt: true, nsfw: false, online: true, incognito: false, showSTI: false,
    integrityParts: { community: 1.0, pack: 1.2, body: 0.9, mind: 0.9 },
    age: 21, height: "5'7\"", weight: '145 lbs', position: '—', size: '—',
    bio: 'New to the pack. Looking for people to hike with.', nsfwBio: '',
    sti: { status: 'none', expiresInDays: 0 }, safeSexOnly: false,
    followers: 7, x: 50, y: 72, joined: T0 - 3 * DAY, images: []},
  { id: 'u6', handle: 'NightWatch', name: 'Wes', rank: 'Pack Dawg', integrity: 3.8,
    mutt: false, nsfw: true, online: false, incognito: true, showSTI: true,
    integrityParts: { community: 3.9, pack: 3.8, body: 3.7, mind: 3.8 },
    age: 29, height: "6'0\"", weight: '180 lbs', position: 'Verse', size: '6.5"',
    bio: 'Currently incognito — proof that hidden members drop off the map.',
    nsfwBio: 'Ask me when I surface.',
    sti: { status: 'clear', expiresInDays: 90 }, safeSexOnly: true,
    followers: 254, x: 34, y: 50, joined: T0 - 420 * DAY,
    images: [{ id: 'i7', src: 'assets/photos/night.svg', uploaded: T0 - 20 * DAY, nsfw: false }]},
];

/* ---------- Wall posts with threaded comments ---------- */
const MOCK_POSTS = [
  { id: 'p1', authorId: 'u1', ts: T0 - 42 * MIN,
    text: 'Great turnout at the Saturday trail meetup. Twelve of us, nobody bailed, and we finished the loop before the heat hit. Already planning the next one. #trails #pack',
    image: 'assets/photos/trail.svg',
    likedBy: ['u2', 'u4', 'u3'], shares: 2,
    comments: [
      { id: 'c1', authorId: 'u2', ts: T0 - 33 * MIN, text: 'That last climb nearly finished me. Worth it though.', likedBy: ['u1'], parentId: null },
      { id: 'c2', authorId: 'u1', ts: T0 - 28 * MIN, text: '@RustyTrail you set the pace the whole back half, no shame there.', likedBy: ['u2', 'u4'], parentId: 'c1' },
      { id: 'c3', authorId: 'u4', ts: T0 - 12 * MIN, text: 'Put me down for the next one.', likedBy: [], parentId: null },
    ]},
  { id: 'p2', authorId: 'u3', ts: T0 - 5 * HOUR,
    text: 'Reminder: chapter game night moved to Thursday this week. Same place, bring a deck. #events',
    image: null, likedBy: ['u1'], shares: 0,
    comments: [
      { id: 'c4', authorId: 'u5', ts: T0 - 4 * HOUR, text: 'Is it okay if a new Mutt tags along?', likedBy: ['u3'], parentId: null },
      { id: 'c5', authorId: 'u3', ts: T0 - 3.5 * HOUR, text: 'Absolutely. Show up, we will teach you the house game.', likedBy: ['u5', 'u1'], parentId: 'c4' },
    ]},
  { id: 'p3', authorId: 'u4', ts: T0 - 26 * HOUR,
    text: 'Haven booking slots for next weekend just opened. Two overnight, one refresh pass. First come. #havens',
    image: 'assets/photos/cabin.svg',
    likedBy: ['u1', 'u2', 'u3', 'u6'], shares: 5,
    comments: [
      { id: 'c6', authorId: 'u2', ts: T0 - 24 * HOUR, text: 'Grabbed the Friday overnight. Thanks for hosting.', likedBy: ['u4'], parentId: null },
    ]},
  { id: 'p4', authorId: 'u2', ts: T0 - 3 * DAY,
    text: 'Six months sober from energy drinks and my resting heart rate dropped nine points. Small thing, big difference. #body',
    image: null, likedBy: ['u1', 'u3', 'u4', 'u5', 'u6'], shares: 1,
    comments: []},
];

/* ---------- Direct messages, with read receipts ---------- */
const MOCK_DM_THREADS = {
  u1: [
    { id: 'd1', me: false, text: 'Hey! Grabbing food after the workout?', ts: T0 - 3 * HOUR, read: true },
    { id: 'd2', me: true, text: 'Yeah, sounds good. Meet at 6?', ts: T0 - 2.8 * HOUR, read: true },
    { id: 'd3', me: false, text: 'Perfect. Same spot as last time.', ts: T0 - 2.5 * HOUR, read: false },
    { id: 'd4', me: false, text: 'Bring the resistance bands if you still have them.', ts: T0 - 40 * MIN, read: false },
  ],
  u2: [
    { id: 'd5', me: false, text: 'That trail you mentioned — is it dog friendly?', ts: T0 - 20 * HOUR, read: false },
  ],
  u3: [
    { id: 'd6', me: true, text: 'Thanks for organizing Thursday.', ts: T0 - 2 * DAY, read: true },
  ],
  u4: [], u5: [
    { id: 'd7', me: false, text: 'Hi! Just joined. Any advice for a new Mutt?', ts: T0 - 6 * HOUR, read: false },
  ], u6: [],
};

/* ---------- Regional chat ---------- */
const MOCK_CHAT = [
  { id: 'ch1', userId: 'u3', text: 'Who is hitting the gym today?', ts: T0 - 90 * MIN },
  { id: 'ch2', userId: 'u3', text: 'I will be there at 5.', ts: T0 - 88 * MIN },
  { id: 'ch3', userId: 'u2', text: 'Count me in.', ts: T0 - 70 * MIN },
  { id: 'ch4', userId: 'u4', text: 'Same, bringing a friend who just moved here.', ts: T0 - 41 * MIN },
];

/* ---------- Events ---------- */
const MOCK_EVENTS = [
  { id: 'e0', title: 'Sunset Ridge Hike', hostId: 'u4', ts: T0 - 6 * DAY, dateLabel: 'Aug 10 · completed',
    rsvps: ['u1', 'u2', 'u3'], going: true, needsReview: true, location: 'Sunset Ridge Trailhead' },
  { id: 'e1', title: 'Saturday Trail Run', hostId: 'u3', ts: T0 + 1 * DAY, dateLabel: 'Sat 8:00 AM',
    rsvps: ['u1', 'u2'], going: false, location: 'Riverside Park' },
  { id: 'e2', title: 'Chapter Game Night', hostId: 'u1', ts: T0 + 4 * DAY, dateLabel: 'Thu 7:00 PM',
    rsvps: ['u3', 'u4', 'u5'], going: true, location: 'The Back Room' },
  { id: 'e3', title: 'Gym Meetup and Protein Bar', hostId: 'u4', ts: T0 + 7 * DAY, dateLabel: 'Sun 6:00 PM',
    rsvps: ['u2'], going: false, location: 'Iron Yard Gym' },
];

/* ---------- Havens ---------- */
const MOCK_HAVENS = [
  { id: 'h1', name: 'Marcus Loft', hostId: 'u1', rating: 4.8, distance: '1.2 mi', passes: 'Overnight and refresh', image: 'assets/photos/night.svg' },
  { id: 'h2', name: 'Sable Den', hostId: 'u4', rating: 4.9, distance: '3.4 mi', passes: 'Overnight only', image: 'assets/photos/cabin.svg' },
  { id: 'h3', name: 'Cedar Cabin', hostId: 'u3', rating: 4.5, distance: '5.0 mi', passes: 'Refresh only', image: 'assets/photos/pier.svg' },
];

/* ---------- Body ---------- */
const MOCK_NUTRITION = {
  calories: { current: 1450, goal: 2200 },
  water: { current: 4, goal: 8 },
  meals: [
    { name: 'Breakfast', cal: 420, ts: T0 - 7 * HOUR },
    { name: 'Lunch', cal: 610, ts: T0 - 3 * HOUR },
    { name: 'Snack', cal: 420, ts: T0 - 1 * HOUR },
  ],
};
const MOCK_EXERCISE = {
  pushups: { current: 40, goal: 100 },
  situps: { current: 30, goal: 100 },
  cardio: { current: 18, goal: 30 },
};

/* ---------- Mind ---------- */
const MOCK_CHECKLIST = [
  { id: 'k1', text: 'STI and blood panel screen', due: 'Overdue', urgent: true, done: false, cta: 'Find free or low-cost clinics' },
  { id: 'k2', text: 'Morning breathing routine', due: 'Today', urgent: false, done: false },
  { id: 'k3', text: 'Weekly reflection journal', due: 'Today', urgent: false, done: false },
  { id: 'k4', text: 'Call someone in the pack', due: 'This week', urgent: false, done: true },
];
const MOCK_MODULES = [
  { id: 'm1', title: 'Foundations of Self-Mastery', length: '12 min', progress: 100 },
  { id: 'm2', title: 'Setting Boundaries with Confidence', length: '9 min', progress: 40 },
  { id: 'm3', title: 'Building Morning Discipline', length: '15 min', progress: 0 },
];
const MOCK_SOUNDS = [
  { id: 's1', title: 'Rainfall Focus', length: '30 min', premium: false },
  { id: 's2', title: 'Deep Forest Breathing', length: '10 min', premium: true },
  { id: 's3', title: 'Midnight Ambient Drift', length: '45 min', premium: true },
];
const MOCK_SECRETS = [
  { id: 'x1', title: 'Locked memory 1', releaseIn: '3 days' },
  { id: 'x2', title: 'Locked memory 2', releaseIn: '11 days' },
];

/* ---------- Shop ---------- */
const SHOP_TABS = ['Themes', 'Sounds', 'Apparel', 'Utility'];
const SHOP_ITEMS = {
  Themes: [
    { name: 'Neon Glow Tracker', price: 120 },
    { name: 'Violet Pin Set', price: 80 },
    { name: 'Midnight Spectrum Skin', price: 150 },
  ],
  Sounds: [
    { name: 'Deep Forest Breathing', price: 60 },
    { name: 'Midnight Ambient Drift', price: 90 },
  ],
  Apparel: [
    { name: 'TopDawgs Hoodie', price: 900 },
    { name: 'Suede Pack Cap', price: 450 },
  ],
  Utility: [
    { name: 'Extended Haven Pass', price: 300 },
    { name: 'Priority Event Pass', price: 200 },
    { name: 'Profile Highlight Token', price: 150 },
  ],
};

/* ---------- Notifications ---------- */
function seedNotifications() {
  return [
    { id: 'n1', kind: 'checklist', section: 'mind', subsection: 'checklist', actorId: null,
      text: 'Time for your STI and blood panel screen.', ts: T0 - 5 * MIN, read: false },
    { id: 'n2', kind: 'mention', section: 'pack', subsection: 'wall', actorId: 'u1', targetPostId: 'p1',
      text: 'mentioned you in a comment.', ts: T0 - 28 * MIN, read: false },
    { id: 'n3', kind: 'message', section: 'pack', subsection: 'messages', actorId: 'u1',
      text: 'sent you a message.', ts: T0 - 40 * MIN, read: false },
    { id: 'n4', kind: 'like', section: 'pack', subsection: 'wall', actorId: 'u4', targetPostId: 'p4',
      text: 'liked your post.', ts: T0 - 3 * HOUR, read: false },
    { id: 'n5', kind: 'follow', section: 'community', subsection: null, actorId: 'u2',
      text: 'started following you.', ts: T0 - 9 * HOUR, read: true },
    { id: 'n6', kind: 'proximity', section: 'community', subsection: null, actorId: 'u4',
      text: 'is now within your radius.', ts: T0 - 26 * HOUR, read: true },
  ];
}

/* ---------- Signed-in account ---------- */
function seedCurrentUser() {
  return {
    id: 'me',
    handle: 'AlphaDawg',
    name: 'Rory',
    rank: 'Pack Dawg',
    integrity: 3.4,
    integrityParts: { community: 3.6, pack: 3.8, body: 3.1, mind: 3.1 },
    mutt: false,
    nsfw: false,
    allowDMs: true,
    allowFlirts: true,
    incognito: false,
    radius: 2.5,
    notifMode: 'both',
    pageNotifs: true,
    age: 30, height: "6'0\"", weight: '178 lbs', position: 'Verse', size: '7"',
    bio: 'Building the pack one meetup at a time. Lift heavy, show up early, leave the trail cleaner than you found it. #pack #trails',
    nsfwBio: 'Ask me in person.',
    safeSexOnly: true,
    showSTI: true,
    sti: { status: 'clear', expiresInDays: 172 },
    followers: 143,
    following: ['u1', 'u3'],
    saved: ['p3'],
    lifetimePoints: 2140,
    spendablePoints: 365,
    lastPhotoRewardDate: null,
    joined: T0 - 500 * DAY,
    images: [
      { id: 'o1', src: 'assets/photos/pier.svg', uploaded: T0 - 2 * DAY, nsfw: false },
      { id: 'o2', src: 'assets/photos/gym.svg', uploaded: T0 - 12 * DAY, nsfw: false },
    ],
    blockedUsers: [],
    pausedUsers: [],
    mutedUsers: [],
    notesOnUsers: {},
  };
}
