# TopDawgs — Clickable App Prototype

A fully interactive, front-end-only prototype of the TopDawgs mobile app, built
straight from the design spec (v8) and existing mockup. No backend, no build
step — it's plain HTML/CSS/JS, so it runs anywhere a static file can be
served, including **GitHub Pages**.

## What's in here

```
index.html          Entry point — loads the phone-shell UI
manifest.json        PWA manifest (installable "Add to Home Screen")
css/style.css        Design tokens (the husky-logo blues) + every component style
js/icons.js           Original SVG icon set, incl. the 4 custom nav icons
js/data.js            Mock data + in-memory app state (no backend — refreshing resets it)
js/screens.js         One render function per screen/subsection
js/app.js             Hash-based router + click/toggle event handling
assets/icons/         Home-screen icon (husky mark)
```

## Running it

**Locally:** any static server works, e.g.
```
python3 -m http.server 8000
```
then open `http://localhost:8000`.

**On GitHub Pages:** push this folder to a repo, enable Pages on the `main`
branch (root), and it's live. No build step, no dependencies to install.

**On your phone:** open the Pages URL in mobile Safari/Chrome and use
"Add to Home Screen" — the manifest makes it launch full-screen like a real
app for demos.

## What's implemented

- **Onboarding:** Welcome → Create account → 18+ ID verification → enters as **Mutt**
- **Community:** interactive map, resource-partner / haven / member pins, filter bar, quick-action sheet
- **Pack** (all 5 subsections): Wall Feed, Contacts & DMs, Events, Havens Directory, Local Chat (with the 3-message / 30-second spam cooldown from the spec)
- **Body:** Diet & Nutrition, Exercise & Movement
- **Mind:** Educational Video Series, Daily Checklist (with STI test reminders + nearby low-cost clinics), Soundscapes player, Time-Lock Vault
- **Profile:** Matrix score, badges, and the **opt-in** "Show STI status on profile" toggle
- **Settings** + the avatar quick-settings dropdown (Global NSFW, Allow DMs, Allow Flirts, radius slider)
- **Unified Post/Event creation modal**, including the Adult Play event lock (Pack Dawg+ rank *and* clean testing status required — try it as different ranks)
- **DM threads** with the angel/devil headspace indicator, and Blocked Users management

### Demo-only rank switcher
The pill row at the very top (Mutt / Pack Dawg / TopDawg / Restart onboarding)
is **not part of the shipped app** — it's a reviewer aid so anyone clicking
around can see the rank-gated features (NSFW lock, Adult Play lock) without
needing a real backend or account system. Delete the `<div class="dev-bar">`
block in `index.html` whenever you're ready to treat this as production UI.

## Known open item

The spec's header line says "Architecture: Map, Pack, Body, Mind" while every
section and the existing mockup use "Community" — this build uses
**Community**, per your call. If "Map" was actually meant to replace
"Community" as a fifth concept, flag it and it's a quick rename.

## Suggested next step: wrapping this into an installable APK/IPA

This prototype is structured so it can be dropped into
[Capacitor](https://capacitorjs.com/) with minimal changes (it's already
static HTML/CSS/JS with no server dependency) to produce a real installable
Android APK / iOS IPA for demo purposes — that's a good follow-up session
once you've reviewed this pass.
