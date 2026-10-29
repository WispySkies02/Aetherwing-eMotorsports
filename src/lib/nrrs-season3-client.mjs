import {races,raceDetail} from './nrrs-season3-review.mjs';

export function mountSeason3Chart(root){
  const svg=root.querySelector('svg'),picker=root.querySelector('[data-s3-picker]'),detail=root.querySelector('[data-s3-detail]');
  let selected=1;
  const choose=(round,{focus=false}={})=>{
    selected=Math.max(1,Math.min(races.length,Number(round)));
    picker.value=String(selected);detail.textContent=raceDetail(races[selected-1]);
    svg.querySelectorAll('[data-s3-race]').forEach(node=>{const active=Number(node.dataset.s3Race)===selected;node.setAttribute('aria-pressed',String(active));node.setAttribute('tabindex',active?'0':'-1');});
    if(focus)svg.querySelector(`[data-s3-race="${selected}"]`).focus();
  };
  picker.disabled=false;picker.addEventListener('change',()=>choose(picker.value));
  for(const name of ['pointerover','focusin','click'])svg.addEventListener(name,event=>{const hit=event.target.closest?.('[data-s3-race]');if(hit)choose(hit.dataset.s3Race);});
  svg.addEventListener('keydown',event=>{
    if(!event.target.closest('[data-s3-race]'))return;
    const round=event.key==='ArrowRight'?selected+1:event.key==='ArrowLeft'?selected-1:event.key==='Home'?1:event.key==='End'?25:null;
    if(round!==null){event.preventDefault();choose(round,{focus:true});}
    else if(event.key===' '||event.key==='Enter'){event.preventDefault();choose(selected);}
  });
  choose(selected);
}

// CMS text updates must preserve the mounted chart and the reader's selected race.
export function updateSeason3Story(root,story){
  const set=(selector,value)=>{const node=root.querySelector(selector);if(node)node.textContent=value??'';};
  set('h1',story.title);set('.s3-subtitle',story.subtitle);set('.news-article__summary',story.summary);set('.news-article__kicker',story.kicker);
  set('.news-article__meta .eyebrow',`${story.category} · ${story.date}`);
  const meta=root.querySelectorAll('.news-article__meta > span');
  if(meta[0])meta[0].textContent=story.context||'';if(meta[1])meta[1].textContent=story.byline||'Aetherwing eMotorsports';
  root.querySelectorAll('[data-s3-section]').forEach(node=>{
    const section=story.sections?.[Number(node.dataset.s3Section)];node.hidden=!section;if(!section)return;
    const h=root.ownerDocument.createElement('h2');h.textContent=section.heading;
    node.replaceChildren(h,...(section.paragraphs||[]).map(text=>{const p=root.ownerDocument.createElement('p');p.textContent=text;return p;}));
  });
}
