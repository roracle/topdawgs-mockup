/* Renders each screen in jsdom and reports any CSS classes used in markup
   that have no rule in style.css — catches "invisible" broken styling. */
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dom=new JSDOM(read('index.html'),{runScripts:'outside-only',url:'https://e.com/',pretendToBeVisual:true});
const w=dom.window; const store={};
w.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
w.eval([read('js/data.js'),read('js/icons.js'),read('js/app.js')].join('\n;\n')+'\n;window.__G={SECTIONS};');
w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
w.doLogin(false);

const css=read('css/style.css');
const defined=new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m=>m[1]));
const used=new Set();
function harvest(){
  w.document.querySelectorAll('*').forEach(el=>el.classList.forEach(c=>used.add(c)));
}
const screens=[];
for(const s of w.__G.SECTIONS){
  w.goSection(s.id); harvest(); screens.push(s.id);
  if(s.hasSubsections) for(const sub of s.subsections){ w.goSubsection(sub.id); harvest(); }
}
w.viewProfile('u1'); harvest();
w.viewProfile(null); harvest();
w.openDM('u1'); harvest();
['settings','shop','hostEvent','camera','blockedList','report'].forEach(m=>{w.openModal(m);harvest();});
w.openModal('flirt',{id:'u1'});harvest();
w.openModal('pauseBlock',{id:'u1'});harvest();
w.openModal('note',{id:'u1'});harvest();
w.openModal('haven',{id:'h1'});harvest();
w.openModal('review',{id:'e0'});harvest();
w.openModal('imagePreview',{uploaded:'x'});harvest();
w.closeModal();
['user','filter','subsection','bell'].forEach(d=>{w.goSection('pack');w.toggleDropdown(d);harvest();});

const missing=[...used].filter(c=>!defined.has(c)).sort();
console.log(`classes used: ${used.size}, defined in css: ${defined.size}`);
if(missing.length){ console.log('\nUNSTYLED CLASSES:'); missing.forEach(c=>console.log('  -',c)); process.exitCode=1; }
else console.log('\nEvery class used in markup has a matching CSS rule.');
