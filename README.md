# TopDawgs — Prototype Shell

A clickable, installable prototype of the TopDawgs mobile app, built from the master spec (`topdawgs-dd-2.html`). It runs as a static site: a centered phone-frame wireframe on desktop, and a full-screen installable PWA on mobile. All data is mocked and lives in memory (`app.js`) — nothing is sent to a server, and refreshing resets the demo.

**What's wired up:** tab + subsection routing, the profile dropdown (NSFW/DMs/Flirts/Incognito/Radius), the community map with pin filtering and Eyes-Only mode, Pack messages/chat/wall/events/havens, Body nutrition/exercise, Mind checklist/modules/sounds/PIN-locked Secrets Vault, the unified profile sheet with the Integrity Score bar and conditional stats matrix, the Flirt selector (Tier 2 gated on both parties' NSFW), the slide-to-confirm block modal, photo inspection with timestamps, and the camera simulator's Pack Points bump.

---

## 1. Create the GitHub repository

1. Go to [github.com/new](https://github.com/new).
2. Name it something like `topdawgs-prototype`.
3. Leave it **Public** (GitHub Pages on a free plan needs a public repo, unless you have GitHub Pro/Team/Enterprise).
4. Don't initialize with a README — you already have one here. Click **Create repository**.

## 2. Add the files locally

Put these six files (plus the `icons/` folder) in one folder on your computer:

```
topdawgs-prototype/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
├── README.md
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-180.png
    ├── icon-192.png
    └── icon-512.png
```

Then, in a terminal, `cd` into that folder and run:

```bash
git init
git add .
git commit -m "Initial TopDawgs prototype"
git branch -M main
git remote add origin https://github.com/<your-username>/topdawgs-prototype.git
git push -u origin main
```

## 3. Enable GitHub Pages

1. On the repo page, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose `main` and folder `/ (root)`. Click **Save**.
4. Wait ~1 minute, then refresh the page — GitHub shows your live URL, something like:
   `https://<your-username>.github.io/topdawgs-prototype/`

## 4. Test it

**Desktop:** open the URL — you'll see the app inside a centered phone-frame wireframe.

**Mobile (browser):** open the same URL on your phone. The frame drops away and the app fills the screen.

**Mobile (installed PWA):**
- **iOS (Safari):** open the URL → tap the **Share** icon → **Add to Home Screen**.
- **Android (Chrome):** open the URL → tap the **⋮** menu → **Install app** (or you'll see an automatic install banner).

Once installed, it launches full-screen with no browser chrome, using the icon and theme color from `manifest.json`, and `sw.js` caches the core assets so it opens even with a flaky connection.

---

## Wrapping it as an APK for a demo

This is a standard PWA, so the most reliable path to an installable `.apk` for Android is [PWABuilder](https://www.pwabuilder.com/):

1. Deploy to GitHub Pages first (steps above) — PWABuilder needs a live, public URL.
2. Go to pwabuilder.com, paste your GitHub Pages URL, and let it score the manifest/service worker (it should score well since both are already in place).
3. Click **Package for stores → Android**, download the generated package, and sign/install the APK on a test device. No Play Store listing is required just to side-load it for a demo.

An alternative is wrapping it in [Capacitor](https://capacitorjs.com/) or [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) if you want more native control later (camera, push notifications, background location) — this static build already has the HTML/CSS/JS structure either tool expects.

## Notes for the native build

This prototype intentionally keeps state in memory only — no `localStorage`, no backend. When you move to a native app (or add a backend to this shell), the natural persistence points are already isolated in `app.js`: the `state` object, the `USERS`/`NOTIFICATIONS`/`THREADS`/etc. mock arrays, and the toggle/rank-gating logic in `handleToggleClick` / `nsfwLocked`. Swap those for real API calls and the UI layer shouldn't need to change much.
