# TopDawgs — Interactive Prototype

A working front-end mock-up of the TopDawgs mobile app, built to Specification v23.3. Pure HTML, CSS, and JavaScript. No build step, no dependencies. Installs as a PWA on Android and iOS.

Default account: **@AlphaDawg** — any password works.

---

## Deploy to GitHub Pages

Copy everything in this folder to the root of your repo and push:

```bash
git add .
git commit -m "TopDawgs prototype"
git push
```

The site appears at `https://<username>.github.io/<repo>/`. `.nojekyll` keeps Jekyll from stripping the asset folders.

**Installing on your phone:** open the Pages URL in Chrome or Safari, then use "Add to Home Screen". It launches full-screen with no browser chrome, keeps working offline, and the Android back button drives the app's own history stack.

Locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Service workers need HTTPS or localhost, so install-to-home-screen only works from the Pages URL or localhost, not from a `file://` path.

---

## What was broken before, and what fixed it

Two bugs stopped the last build loading on a phone. Both are fixed and both now have regression tests.

**Blank screen.** `loadState()` called `localStorage.getItem` unguarded. iOS Safari in private mode — and any browser with site data blocked — throws on that access rather than returning null. The exception escaped before the first render, so nothing painted and there was no error to see. All storage access now goes through a guarded `Store` wrapper, the app runs fully without persistence, and Settings tells you when storage is unavailable. A boot error boundary in `index.html` catches anything else and shows the message instead of a white page.

**Nav bar off-screen.** `100vh` was set on two nested containers. On mobile, `100vh` counts the area *behind* the browser toolbar, so the bottom nav sat below the fold and the page double-scrolled. The frame is now a single `100dvh` column with `100vh` as fallback; only the main region scrolls, and safe-area insets keep everything clear of notches and home indicators.

---

## Files

```
index.html            App shell, login, boot error boundary
manifest.json         PWA manifest with maskable icons and shortcuts
sw.js                 Service worker, cache-first app shell
css/style.css         Design system and every component
js/data.js            Mock data and section config arrays
js/icons.js           SVG icon library (no emoji anywhere)
js/social.js          Social graph: posts, comments, follows, saves, search
js/app.js             State, routing, history stack, views, modals
assets/icons/         Generated PWA icons (192, 512, maskable, apple-touch)
assets/photos/        Generated post and gallery imagery
test/smoke.js         169 assertions against the real files
test/render-check.js  Confirms no class ships unstyled
```

Sections and subsections come from config arrays in `data.js`, so adding one is a data edit rather than a render-code change — which keeps a later React Native port mechanical.

## Tests

```bash
npm install jsdom
node test/smoke.js
node test/render-check.js
```

`smoke.js` boots the real `index.html` in jsdom and asserts behaviour, including a harness that makes `localStorage` throw to prove the mobile boot bug stays fixed. It fails on any console error. All 169 assertions pass.

---

## Social features

The feed behaves the way people expect a feed to behave.

**Posting.** Composer with a live character counter, image attachment with removable preview, and a hashtag button. Your own posts can be edited (marked "edited") or deleted.

**Comments.** Threaded one level deep. Reply to a comment and the composer shows who you're replying to; replies nest under their parent with a rule down the side. Comments can be liked and your own deleted — deleting a parent removes its replies. Comment counts and like counts stay in sync everywhere the post appears.

**Reactions.** Like with a filled-heart state and a pop animation, save to a bookmarks tab on your profile, and share through the native share sheet where available with a counter fallback.

**Follows.** Follow and unfollow anywhere a member appears. Follower counts update live. The Wall has All and Following tabs, and Following genuinely filters to people you follow.

**Hashtags and mentions.** Both are parsed from post and comment text and rendered tappable. A hashtag opens a tag page listing everything carrying it; a mention opens that member's profile.

**Search.** People, posts, and tags, with trending tags shown before you type and a real empty state after.

**Notifications.** The bell opens a dedicated page, not a toast. Unread rows are visually distinct, the header shows a count badge, and there's a mark-all-read action. Tapping a notification routes to the thing it's about — a like opens the post, a message opens the thread, a follow opens the profile.

**Messaging.** Conversations sort by recency with previews, timestamps, and unread badges. Threads show read receipts (single check sent, double check read), a typing indicator, and relative timestamps. Opening a thread marks it read.

**Moderation.** Mute, pause, block, and report are all wired. Muted, paused, and blocked members disappear from the feed, the map, and search, and are managed from one screen in Settings.

**Timestamps.** Everything is relative — "just now", "12m", "5h", "3d" — with full timestamps on photo previews.

---

## Spec features

**Community** is map-only. Filters live in the top pill, multi-selectable by check mark: People, Havens, Events, Restaurants, Gyms, Other. Pins carry an Integrity Rating colour chip on the lower left. A pin with unread messages shows a chat-bubble count and opens the thread on tap rather than the profile. Offline, incognito, blocked, and paused members leave the map, and your own pin disappears the moment you enable Incognito. The radius slider redraws the ghost zone live.

**Hookup mode.** Global NSFW is an eyes-only client filter — members without it on vanish from your view, the rest switch to NSFW avatars, and the palette shifts violet. Messaging stays open in both directions regardless. Mutts are hard-locked out of the toggle.

**Pack.** Messages, Chat (zero-NSFW, report flag on every message, 30-second cooldown after three consecutive unanswered messages, cleared early if someone replies), Wall, Events (RSVP, host via the `+` button, sealed post-meetup blind reviews), Havens (booking with safety-ping and sanctuary disclaimers).

**Body and Mind.** Nutrition and Exercise with live meters and logging. Checklist, Modules with progress, Sounds routing premium tracks to the Shop, and the sealed Secrets locker.

**Profile.** One layout for yourself and everyone else. Post, follower, and following counts, the Integrity Rating spectrum bar with a star running red to purple that sparkles above 4.75, and the four-part breakdown. Stats add Position and Size only when both sides have NSFW on. Bios are inline-editable on your own profile, capped at 500 characters. Tabs for Posts, Gallery, and Saved. NSFW photos stay blurred behind a lock unless both sides qualify. Photo upload earns +0.01 Pack Points, capped once per calendar day.

**Pause and block.** One modal with a mode toggle — amber pause with a 1–14 day slider, red permanent block — both requiring a real drag to confirm.

**Notifications modes.** Classic (bell only), Modern (dots and auto-jump, no bell), and Both. Tapping a section icon with a dot jumps to the newest unread item and opens the right subsection.

**Shop.** Lifetime Pack Points and Spendable Points shown separately, four one-word tabs, purchases refused when short.

**Navigation.** A real history stack. Back appears in the header when there's somewhere to go, Escape closes the topmost layer, and the browser and Android hardware back buttons drive the same stack.

**Tooltips.** Touch and hold any control for an action-only label.

---

## Deliberate choices

**No emoji.** The spec draws icons with emoji; every one here is a hand-built SVG, so the interface renders identically on every platform. A test enforces this.

**Icons-only bottom nav, no section banners.** Both save vertical space on a phone. Nav items keep `aria-label` so screen readers still announce them.

**Subsection switching lives in the pill.** The spec puts it in the dropdown and says swiping happens on the pill so body scrolling is never interrupted. Swipe the pill left or right on a touch device.

**Honest about the back end.** There isn't one. Posts, comments, and messages live in memory and reset on reload; your account and settings persist in localStorage. The compliance pipelines from the spec — The Pound, NCMEC hashing, EXIF scrubbing, BIPA verification — appear as the user-facing surfaces they'd produce, not as working systems.

---

## Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init TopDawgs com.topdawgs.app --web-dir=.
npx cap add android
npx cap sync && npx cap open android
```

The hardware back button already talks to the internal history stack through `popstate`, so it works without extra glue.
