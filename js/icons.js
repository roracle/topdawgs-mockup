// TopDawgs — icon library. All icons are original line-art, sized on a 24x24
// grid, using currentColor so CSS controls fill/stroke per context.

const ICONS = {

  // --- Primary nav icon: COMMUNITY — stylized city skyline ---------------
  community: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M5 21V10.5L9 8v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M9 21V4l6 2.5V21" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M15 21V9l4 2v10" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M7 13h.01M7 16.5h.01M11.2 8h.01M11.2 11h.01M11.2 14h.01M11.2 17h.01M17 14h.01M17 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,

  // --- Primary nav icon: PACK — husky head (no text), original line art --
  pack: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.2 9.5 4.3 3.9c-.15-.44.3-.83.7-.6l4.4 2.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M17.8 9.5l1.9-5.6c.15-.44-.3-.83-.7-.6l-4.4 2.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M6.4 10.2c-1 1.4-1.3 3-1 4.7.3 1.9 1.6 3.4 3.4 4 1 .35 2.1.5 3.2.5s2.2-.15 3.2-.5c1.8-.6 3.1-2.1 3.4-4 .3-1.7 0-3.3-1-4.7-1.1-1.6-3-3-5.6-3s-4.5 1.4-5.6 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M9.3 12.2c-.5.4-.9.9-1 1.6M14.7 12.2c.5.4.9.9 1 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M9.6 11.6c.5-.35 1-.35 1.4 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="12" cy="14.6" rx="1.15" ry=".85" fill="currentColor"/>
    <path d="M12 15.4v1.1c0 .5.4.8 1 .95" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  // --- Primary nav icon: BODY — healthy dog profile ------------------------
  body: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 19v-3.2c0-1 .3-2 .9-2.8l1.1-1.5V8.6c0-.9.5-1.7 1.3-2.1L10 5.6l.7-1.8c.2-.5.9-.6 1.2-.1l1 1.5 2 .6c.9.3 1.5 1.1 1.5 2v2.1l1.4 1.2c.8.7 1.2 1.7 1.2 2.7V19" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M8.6 19v-2.6M14.8 19v-2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M6.6 9.2 5.1 7.7M17.2 9.9l1.6 1.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="9.6" cy="9" r=".55" fill="currentColor"/>
    <path d="M8.6 12c.7.5 1.5.7 2.2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M14.4 6.6c1.3.35 2.2 1.55 2.2 2.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  // --- Primary nav icon: MIND — brain profile ------------------------------
  mind: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.3 4.6c-1.6.2-2.8 1.5-2.9 3.1-1.1.4-1.9 1.5-1.9 2.7 0 .7.25 1.35.7 1.85-.5.5-.8 1.2-.8 1.95 0 1.35.95 2.45 2.2 2.7.15 1.4 1.35 2.5 2.8 2.5.35 0 .68-.06 1-.18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.3 4.6c.5-.35 1.1-.55 1.75-.55 1.6 0 2.9 1.25 3 2.8.95.35 1.65 1.25 1.65 2.3 0 .3-.06.6-.17.85.8.4 1.35 1.25 1.35 2.2 0 .55-.18 1.05-.5 1.45.55.45.9 1.15.9 1.9 0 1.4-1.15 2.5-2.55 2.5-.2 0-.4-.02-.58-.07-.35.85-1.2 1.45-2.18 1.45-1.3 0-2.35-1.02-2.4-2.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.2 8.2c.55 0 1 .4 1 1.05M10.2 12.1c.7 0 1.25-.5 1.25-1.25M13.6 9.4c.5.15.85.6.85 1.15M10.7 15.6c.5 0 .95-.3 1.1-.75" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>
    <path d="M12 6.9v11.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="1.5 2"/>
  </svg>`,

  bell: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.2.3.4 0 1-.5 1H5c-.5 0-.8-.6-.5-1C5 14.5 6 13 6 10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  shop: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8.5 5.5 4h13L20 8.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4 8.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12a3 3 0 0 0 6 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  plus: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  chevronDown: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  bookmark: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,

  flirt: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20s-7-4.3-9-9.2C1.8 7.7 3.4 5 6.3 5c1.9 0 3.2 1 3.7 2.2C10.5 6 11.8 5 13.7 5c2.9 0 4.5 2.7 3.3 5.8C15 15.7 12 20 12 20Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,

  send: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12 20 4l-6 16-3-6-7-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,

  image: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M4 17l5-4.5 3.5 3L17 11l3 3.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,

  lock: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" stroke="currentColor" stroke-width="1.6"/></svg>`,

  check: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.5l5 5L20 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  pin: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>`,

  coffee: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke="currentColor" stroke-width="1.6"/><path d="M16 10.5h1.5a2 2 0 1 1 0 4H16" stroke="currentColor" stroke-width="1.6"/><path d="M8 5.5c0 .8.6 1-.2 1.8M11.5 5.5c0 .8.6 1-.2 1.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,

  dumbbell: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9v6M3.3 10.5v3M20.7 10.5v3M19 9v6M7 12h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  film: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4" stroke="currentColor" stroke-width="1.4"/></svg>`,

  haven: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 11 12 4l8 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19v-5h4v5" stroke="currentColor" stroke-width="1.7"/></svg>`,

  chat: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12a8 4.8 0 1 1 3 6.2L4 19l1-3.3A7.9 4.7 0 0 1 4 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,

  clock: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  meditation: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6" r="1.8" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 16c1.5-2.5 3-3.5 3-3.5s1 1.7 4.5 1.7 4.5-1.7 4.5-1.7 1.5 1 3 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 19h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  wave: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  vaultIcon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  play: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4.5v15l14-7.5-14-7.5Z" fill="currentColor"/></svg>`,

  pause: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>`,

  settingsGear: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5v2.3M12 18.2v2.3M4.5 12H6.8M17.2 12h2.3M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M6.3 17.7l1.6-1.6M16.1 7.9l1.6-1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  warning: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4 2 20h20L12 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  info: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  attachment: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12.5V7a4 4 0 0 1 8 0v8a3 3 0 0 1-6 0V9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  medal: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="9" r="5.5" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 13.5 7 20l5-2.5L17 20l-1.5-6.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,

  medkit: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="8" width="17" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6"/><path d="M12 11.5v5M9.5 14h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  block: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 6.5l11 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  camera: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8h3l1.5-2h7L17 8h3v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.6"/></svg>`,

  ellipsis: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>`,
};

function icon(name, extra) {
  return `<span class="ico ${extra||''}">${ICONS[name] || ''}</span>`;
}
