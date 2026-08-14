# TopDawgs — Interactive Prototype

A working front-end mock-up of the TopDawgs mobile app, built to Specification v23.3. Pure HTML/CSS/JS with no build step — drop it in a GitHub Pages repo and it runs.

Default account: **@AlphaDawg** (any password works).

---

## Deploying to GitHub Pages

Copy everything in this folder to the root of your repo and push:

```bash
git add .
git commit -m "TopDawgs interactive prototype"
git push
```

Your site appears at `https://<username>.github.io/<repo>/`. The `.nojekyll` file is included so Jekyll doesn't interfere with the asset folders.

To run it locally instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Open it in a browser and use device emulation (or just narrow the window) to see the mobile layout. The app is centred at 480px on desktop.

---

## File layout

```
index.html              Login screen + app shell
css/style.css           Full design system and every component
js/data.js              All mock data + section/subsection config arrays
js/icons.js             SVG icon library (no emoji anywhere)
js/app.js               State, routing, history stack, all views and modals
assets/logo.webp        TopDawgs emblem
assets/hero-*.svg       Generated banner art for the four main sections
test/smoke.js           89 automated assertions against the real files
test/render-check.js    Verifies every CSS class used actually has a rule
.nojekyll               Tells GitHub Pages to serve files as-is
```

Everything is driven by config arrays in `data.js` — `SECTIONS`, `MAP_FILTERS`, `SHOP_TABS` — so adding a subsection means adding one object, not editing render code. That's deliberate: it keeps the port to React Native mechanical.

---

## Running the tests

```bash
npm install jsdom
node test/smoke.js
node test/render-check.js
```

`smoke.js` boots the actual `index.html` in jsdom, walks every screen, and asserts real behaviour — the Mutt NSFW lock, the eyes-only map filter, the 3-message cooldown, the back stack, the daily reward cap, notification-mode switching, and that no emoji made it into the source. It fails on any console error. All 89 assertions currently pass.

---

## What's implemented

**Login / session.** Log in, log out, delete account (with the 30-day purge notice). Session and all toggles persist in localStorage. A second login button drops you into an unverified **Mutt** account so the restricted view is demonstrable rather than theoretical.

**Community.** Map-only, no subsections. Filters live in the top pill and are multi-selectable by check mark: People, Havens, Events, Restaurants, Gyms, Other. Each member pin carries an Integrity Rating colour chip on its lower-left. A pin with unread messages shows a chat-bubble count and opens the DM thread on tap; without one it opens the profile. Offline, incognito, blocked, and paused members leave the map. Your own pin disappears the instant you enable Incognito. The radius slider redraws the ghost-zone circle live.

**Hookup mode.** Global NSFW is an eyes-only client filter: members without it on vanish from your view, the rest switch to NSFW avatars, and the map palette shifts violet. Messaging stays open in both directions regardless — that's a stated rule, not an oversight. Mutts are hard-locked out of the toggle.

**Pack.** Messages (with the angel/devil headspace indicator in the DM header), Chat (zero-NSFW, report flag on every message, 30-second cooldown after 3 consecutive unanswered messages, cleared early if someone replies), Wall (report flag on every card, likes, comments), Events (RSVP, host via the `+` button, sealed post-meetup blind reviews), Havens (booking with the 12-hour safety-ping and sanctuary disclaimers).

**Body.** Nutrition and Exercise, both with live progress meters and logging.

**Mind.** Checklist (the STI screening reminder with a clinic-finder CTA), Modules, Sounds (premium tracks route to the Shop), Secrets (sealed locker with timed release).

**Profile.** One layout for your own and everyone else's. Centred avatar, Integrity Rating spectrum bar with a star that runs red → purple and sparkles above 4.75, plus the four-part breakdown. Stats show Age/Height/Weight, and add Position/Size only when both sides have NSFW on. Bios are inline-editable on your own profile and capped at 500 characters. NSFW photos stay blurred and locked unless both sides qualify. Photo upload earns +0.01 Pack Points, capped once per calendar day.

**Pause / Block.** One modal, a mode toggle. Pause is amber with a 1–14 day slider; Block is red and permanent. Both require a genuine drag-to-confirm, and both write to the Blocked & Paused list where they can be undone.

**Notifications.** Classic (bell only), Modern (red dots and auto-jump, no bell), and Both. Tapping a section icon with a dot jumps straight to the newest unread item and opens the right subsection; tapping again cycles to the next.

**Shop.** Lifetime Pack Points (reputation, non-spendable) and Spendable Points shown separately, with the four one-word tabs: Themes, Sounds, Apparel, Utility. Purchases deduct and are refused when short.

**Navigation.** A real history stack. Back appears in the header when there's somewhere to go, Escape closes the topmost layer, and the browser/Android hardware Back button is wired into the same stack — so it'll behave correctly once this is wrapped in Capacitor.

**Tooltips.** Touch and hold any control for an action-only label ("Host Event", "Pause User", "Open Shop").

---

## Deliberate choices worth flagging

**No emoji.** The spec illustrates icons with emoji; every one is a hand-built SVG here, so the interface renders identically on every platform.

**Subsection switching lives in the pill.** The spec puts subsection navigation in the top-right dropdown and says swiping happens on the pill so body scrolling is never interrupted. That's what's implemented — there's no second row of tabs competing with it. Swipe the pill left or right on a touch device.

**Mock data is honest about its own limits.** No back end. Messages, posts, and events live in memory and reset on reload; account settings and toggles persist. Nothing pretends to be verified, moderated, or encrypted — the compliance pipelines from the spec (The Pound, NCMEC hashing, EXIF scrubbing, BIPA verification) appear as the user-facing surfaces they'd produce, not as working systems.

---

## Next step: Capacitor

The app is a static bundle, so wrapping it is straightforward:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init TopDawgs com.topdawgs.app --web-dir=.
npx cap add android
npx cap sync
npx cap open android
```

The back button already talks to the internal history stack via `popstate`, so Android's hardware back works without extra glue.
