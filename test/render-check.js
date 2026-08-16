/* Verifies every CSS class used in rendered markup has a matching rule,
   so nothing ships silently unstyled. */
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dom=new JSDOM(read('index.html'),{runScripts:'outside-only',url:'https://e.com/',pretendToBeVisual:true});
const w=dom.window; const store={};
w.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
w.eval([read('js/data.js'),read('js/icons.js'),read('js/social.js'),read('js/app.js')].join('\n;\n')+'\n;window.__G={SECTIONS};');
w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
w.doLogin(false);

const defined=new Set([...read('css/style.css').matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m=>m[1]));
const used=new Set();
const harvest=()=>w.document.querySelectorAll('*').forEach(el=>el.classList.forEach(c=>used.add(c)));

for(const s of w.__G.SECTIONS){
  w.goSection(s.id); harvest();
  if(s.hasSubsections) for(const sub of s.subsections){ w.goSubsection(sub.id); harvest(); }
}
w.viewProfile('u1'); harvest();
w.setProfileTab('gallery'); harvest();
w.viewProfile(null); w.setProfileTab('saved'); harvest();
w.openPost('p1'); harvest();
w.startReply('p1','c1','RustyTrail'); harvest();
w.openDM('u1'); harvest();
w.openSearch(); harvest();
w.onSearchInput('haven'); harvest();
w.openTag('havens'); harvest();
w.openNotifications(); harvest();
['settings','shop','hostEvent','camera','blockedList','report','password','displayName','deleteConfirm'].forEach(m=>{w.openModal(m);harvest();});
w.openModal('flirt',{id:'u1'});harvest();
w.openModal('pauseBlock',{id:'u1'});harvest();
w.openModal('note',{id:'u1'});harvest();
w.openModal('haven',{id:'h1'});harvest();
w.openModal('review',{id:'e0'});harvest();
w.openModal('postMenu',{id:'p1'});harvest();
w.openModal('editPost',{id:'p1'});harvest();
w.openModal('userMenu',{id:'u1'});harvest();
w.openModal('imagePreview',{src:'assets/photos/gym.svg',uploaded:Date.now()});harvest();
w.closeModal();
['user','filter','subsection'].forEach(d=>{w.goSection('pack');w.toggleDropdown(d);harvest();});

const missing=[...used].filter(c=>!defined.has(c)).sort();
console.log(`classes used: ${used.size} | defined: ${defined.size}`);
if(missing.length){ console.log('\nUNSTYLED:'); missing.forEach(c=>console.log('  -',c)); process.exitCode=1; }
else console.log('Every class used in markup has a CSS rule.');
