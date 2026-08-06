// TopDawgs — mock data + mutable app state for the clickable prototype.
// Nothing here talks to a real backend; it's all in-memory so the demo
// is fully self-contained on GitHub Pages.

const STATE = {
  onboardingStep: 0, // 0 = welcome, 1 = create account, 2 = id verify, 3 = done
  loggedIn: false,
  route: '#/community',
  activeTab: 'community',
  packSub: 'wall',
  communityFilter: 'all',
  modalOpen: null, // 'post' | 'flirt-locked' | null
  toast: null,

  user: {
    name: 'Rory K.',
    handle: '@RoryK',
    rank: 'pack', // mutt | pack | top
    chapter: 'Port Neches, TX',
    bio: 'Trail runs, tabletop nights, and dragging my Pack to the gym on Sundays.',
    tags: ['Hiking', 'D&D', 'Powerlifting', 'Homebrew'],
    matrixScore: 3.4,
    bodyScore: 3.6,
    mindScore: 3.1,
    idVerified: true,
    nsfwEnabled: false,
    allowDMs: true,
    allowFlirts: true,
    radius: 35,
    showSTIOnProfile: false,
    stiStatus: 'negative', // negative | positive-uu | positive | unknown
    stiLastTest: '2026-07-02',
    badges: ['medal', 'haven', 'dumbbell', 'meditation'],
  },

  notifications: 3,

  chatCooldownUntil: 0,
};

const RANK_LABEL = { mutt: 'Mutt', pack: 'Pack Dawg', top: 'TopDawg' };

const CONTACTS = [
  { id: 'c1', name: 'Marcus D.', handle: '@AlphaMarcus', online: true, hosting: true, bookmarked: true, nsfw: false },
  { id: 'c2', name: 'Devon T.', handle: '@DevTee', online: true, hosting: false, bookmarked: false, nsfw: true },
  { id: 'c3', name: 'Sam O.', handle: '@SamO_PA', online: false, hosting: false, bookmarked: true, nsfw: false },
  { id: 'c4', name: 'Chris B.', handle: '@ChrisBHou', online: true, hosting: false, bookmarked: false, nsfw: false },
  { id: 'c5', name: 'Jordan P.', handle: '@JordanPack', online: false, hosting: false, bookmarked: false, nsfw: true },
];

const DM_THREAD = [
  { from: 'them', text: "Hey man, grabbing food after the workout?" },
  { from: 'me', text: "Yeah sounds good! Meet at 6." },
  { from: 'them', text: "Bringing anyone else from the chapter?" },
];

const CHAPTER_CHAT = [
  { name: 'Dave', text: "Who's hitting the gym today?" },
  { name: 'Dave', text: "I'll be there at 5." },
  { name: 'Marcus', text: "Count me in, bringing the new guy." },
];

const FEED_POSTS = [
  {
    id: 'p1', author: 'Chapter Announcements', rank: 'top', time: '2h',
    text: 'Saturday chapter hike leaves from the Riverside trailhead at 8am. Bring water, bring the Pack.',
    media: true, comments: 12, reactions: 34, isPartner: false,
  },
  {
    id: 'p2', author: 'Iron Paw Gym', rank: 'partner', time: '4h',
    text: 'Free guest passes for TopDawgs members this week — mention the app at the front desk.',
    media: true, comments: 5, reactions: 21, isPartner: true, shop: false,
  },
  {
    id: 'p3', author: 'Marcus D.', rank: 'pack', time: '6h',
    text: 'Finally hit a 3-plate deadlift. Mind pillar says stay humble, Body pillar says let\'s go again Thursday.',
    media: false, comments: 8, reactions: 40, isPartner: false,
  },
];

const EVENTS = [
  { id: 'e1', title: 'Weekly Gym Meetup', type: 'casual', when: 'Tue 7:00 PM', venue: 'Iron Paw Gym', partner: true, rsvp: 14, scope: 'local', status: 'upcoming' },
  { id: 'e2', title: 'Community Coffee Morning', type: 'casual', when: 'Sat 9:00 AM', venue: 'Riverside Cafe', partner: true, rsvp: 22, scope: 'local', status: 'upcoming' },
  { id: 'e3', title: 'Regional Meetup — Gulf Coast Chapters', type: 'casual', when: 'Aug 22, 12:00 PM', venue: 'Galveston Seawall', partner: false, rsvp: 61, scope: 'regional', status: 'upcoming' },
  { id: 'e4', title: 'Movie Night: Group Outing', type: 'casual', when: 'Fri 8:00 PM', venue: 'Star Cinema', partner: true, rsvp: 9, scope: 'local', status: 'ongoing' },
];

const HAVENS = [
  { id: 'h1', name: 'Riverside Refresh Pass', tier: 'Refresh Pass', capacity: '1-2 guests', pets: 'No pets', accessible: true },
  { id: 'h2', name: 'The Overlook Sanctuary', tier: 'Overnight Sanctuary', capacity: '4 guests', pets: 'Pet friendly', accessible: false },
];

const MAP_PINS = [
  { id: 'm1', type: 'partner', label: 'Iron Paw Gym', top: '28%', left: '30%' },
  { id: 'm2', type: 'partner', label: 'Riverside Cafe', top: '46%', left: '62%' },
  { id: 'm3', type: 'haven', label: 'Riverside Refresh', top: '65%', left: '38%' },
  { id: 'm4', type: 'user', label: 'Marcus D.', top: '38%', left: '48%' },
  { id: 'm5', type: 'user', label: 'Chapter Meetup', top: '58%', left: '70%' },
];

const MAP_POSTS = [
  { top: '20%', left: '55%' },
  { top: '72%', left: '25%' },
  { top: '50%', left: '20%' },
];

const CHECKLIST = [
  { id: 't1', label: 'Log today\'s workout', pillar: 'Body', done: true },
  { id: 't2', label: '10-minute guided meditation', pillar: 'Mind', done: true },
  { id: 't3', label: 'Read Educational Module: Community Governance', pillar: 'Mind', done: false },
  { id: 't4', label: 'Time for a full blood panel STD test', pillar: 'Body + Mind', done: false, testReminder: true },
  { id: 't5', label: 'Daily grounding reflection', pillar: 'Mind', done: false },
];

const CLINICS = [
  { name: 'Gulf Coast Community Health', distance: '1.2 mi', cost: 'Free / sliding scale' },
  { name: 'Port Neches Public Health Center', distance: '2.8 mi', cost: 'Low-cost testing' },
];

const VIDEOS = [
  { title: 'Community Governance 101', length: '8 min', points: '+0.3 Mind' },
  { title: 'Leading With Accountability', length: '11 min', points: '+0.3 Mind' },
  { title: 'Conflict De-escalation Basics', length: '6 min', points: '+0.2 Mind' },
];

const SOUNDSCAPES = ['Rain', 'Brown Noise', 'Forest Night', 'Low Drone', 'Campfire', 'Deep Ocean'];

const WORKOUT_PLAN = [
  { step: 1, text: 'Warm-up: 5 min brisk walk or bike' },
  { step: 2, text: 'Strength block: squat, push, pull (3x8)' },
  { step: 3, text: 'Conditioning finisher: 10 min intervals' },
  { step: 4, text: 'Cool-down + mobility stretch' },
];

const MEAL_PLAN = [
  { meal: 'Breakfast', text: 'Greek yogurt, berries, oats' },
  { meal: 'Lunch', text: 'Grilled chicken, rice, roasted veg' },
  { meal: 'Dinner', text: 'Salmon, sweet potato, greens' },
  { meal: 'Snacks', text: 'Almonds, protein shake, fruit' },
];

const BLOCKED_USERS = ['@TrollUser99', '@SpamBot12'];

const BADGE_META = {
  medal: { label: 'TopDawg', icon: 'medal' },
  haven: { label: 'Haven Host', icon: 'haven' },
  dumbbell: { label: 'Fitness Discipline', icon: 'dumbbell' },
  meditation: { label: 'Mentor', icon: 'meditation' },
};
