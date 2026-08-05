# TopDawgs — Interactive UI Mockup

A working, clickable prototype of the **TopDawgs Mobile App**, built to Master Specification v14.0
(proactive hierarchical routing, electric cyan & dark slate).

Everything is static — no build step, no framework, no server. Drop it on GitHub Pages and it runs.

---

## Deploy to GitHub Pages

1. Create a repo (for example `topdawgs`) and copy every file in this folder into its root.

   ```bash
   git init
   git add .
   git commit -m "TopDawgs interactive mockup"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/topdawgs.git
   git push -u origin main
   ```

2. In the repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - Save.

3. Wait about a minute, then open `https://YOUR-USER.github.io/topdawgs/`.

Every path in the project is relative (`./index.html`, `./icon-192.png`), so it works both at a
project URL like `/topdawgs/` and at a user site root like `YOUR-USER.github.io`.

### Run it locally

Opening `index.html` straight from disk works, but the service worker is skipped on `file://`.
For the full experience:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire app — markup, styles and logic in one file. |
| `manifest.webmanifest` | PWA manifest: name, theme colours, icons, launch shortcuts. |
| `sw.js` | Service worker. Network-first for the page, cache-first for assets, works offline. |
| `icon-192.png` / `icon-512.png` | Standard app icons. |
| `icon-maskable-512.png` | Android adaptive icon (badge inset to the safe zone). |
| `apple-touch-icon.png` | iOS home-screen icon, 180 × 180 on the dark canvas. |
| `favicon.ico` / `favicon-32.png` | Browser tab icons. |
| `404.html` | Themed not-found page. |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is instead of running Jekyll. |

### Installing it as an app

Because of the manifest and service worker, the demo installs to a home screen:

- **Android / Chrome** — menu → *Add to Home screen* / *Install app*
- **iOS Safari** — Share → *Add to Home Screen*
- **Desktop Chrome / Edge** — install icon in the address bar

Once installed it launches full-screen with no browser chrome, which is the best way to demo it.

---

## Deep links

The manifest shortcuts use query parameters the app reads on load:

```
./?s=community
./?s=pack&sub=wall
./?s=body&sub=exercise
./?s=mind&sub=secrets
```

`s` accepts `community`, `pack`, `body`, `mind`. `sub` accepts any subsection of that section.

---

## What's implemented

**§1 Visual language & header** — the five spec hex values as CSS custom properties; line-art nav
icons (skyline, winking husky, standing dog, dual-hemisphere brain); avatar dropdown with My Profile,
Settings, Global NSFW, Allow DMs, Allow Flirts, Incognito, the 0–5 mi radius slider, and per-subsection
notification toggles beneath it; shop shortcut; `+` creation trigger left of the subsection pill.

**§2 Proactive routing** — no notification bell. Red dots on section icons and subsection names.
Tapping a dotted section jumps straight to the newest unread and highlights it; tapping again cycles
to the next. A subsection dot clears only when its last unread clears; a section dot clears only when
every subsection under it is clean.

**§3 Sections** — Community is map-only: draggable, zoomable, six filter categories, people drawn with
a blur circle scaled to your radius, disappearing instantly under Incognito. Pin popups follow the
standardized order (header + badge → head circles → join/leave → event chat → reviews). Posts carry a
live countdown and fade off the map after ten minutes; venues persist. Pack, Body and Mind cover all
eleven subsections, including voice-note recording, RSVP, haven passes, the fitness challenge, and the
Secrets vault with release countdowns.

**§4 Settings** — password change, display name, log out, delete account with typed confirmation.

**§5 Registration & ranks** — Mutt onboarding with the government-ID verification steps, rank-gated
NSFW toggle, posting locked at Mutt rank, and the private health-result flow that credits Body and
Mind equally without ever surfacing results publicly.

### Demo controls

Settings has a dashed **Demo controls** card that isn't part of the spec — it's there to make
walkthroughs easier:

- switch your rank between Mutt / Pack Dawg / Top Dawg to show the NSFW lock and posting gate
- restore the unread markers after you've cleared them

### One deviation

The spec lists six map filter categories and doesn't say which governs transient posts, so posts
follow the **Events** filter, noted in the filter dropdown. Splitting them into a seventh chip is a
few lines in `paintPins()`.

---

## Notes

All data is in-memory mock data defined in the `D` object near the top of the script — nothing is
saved, and refreshing resets the demo. There is no backend, no account system and no real messaging.
