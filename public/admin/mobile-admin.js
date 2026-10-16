/* Aetherwing Mobile Admin 2.0
   Navigation is a proxy for the EXISTING admin workspace buttons.
   Save/publish actions remain owned by content-admin.js. */
(()=>{
  'use strict';
  const root=document.querySelector('[data-workspace]');
  const rail=document.querySelector('[data-admin-tabs]');
  const nav=document.querySelector('[data-aw-admin-mobile-nav]');
  const sheet=document.querySelector('[data-aw-admin-mobile-sheet]');
  const overlay=document.querySelector('[data-aw-admin-mobile-overlay]');
  const list=document.querySelector('[data-aw-admin-mobile-list]');
  const title=document.querySelector('[data-aw-admin-mobile-title]');
  const dock=document.querySelector('[data-aw-admin-mobile-dock]');
  const feedback=document.querySelector('[data-content-save-feedback]');
  if(!root||!rail||!nav||!sheet||!overlay||!list||!dock)return;
  const tabs=Array.from(rail.querySelectorAll('button'));
  const groups={
    racing:['schedule-events','results','wins','standings','milestones'],
    team:['drivers','roster-profiles','driver-profiles','charters','iracing-garage','competitions','leadership'],
    media:['news','partners','driver-portfolios'],
    more:['site','navigation','page-overrides','feature','add','library','3d','theme-preview']
  };
  const groupButtons=Array.from(nav.querySelectorAll('[data-aw-admin-mobile-group]'));
  const identifier=(button)=>button.getAttribute('data-admin-dataset')||button.getAttribute('data-admin-paint-tab')||button.getAttribute('data-admin-tab')||'';
  const groupOf=(button)=>{
    const id=identifier(button);
    if(id==='overview')return 'home';
    return Object.keys(groups).find(group=>groups[group].includes(id))||'more';
  };
  const labelOf=(button)=>{
    const text=Array.from(button.childNodes).filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim();
    return text||button.textContent.replace(/^\s*\d+\s*/,'').trim();
  };
  let focusOrigin=null;
  const close=()=>{
    if(sheet.hidden)return;
    sheet.hidden=true;
    overlay.hidden=true;
    document.documentElement.classList.remove('aw-admin-sheet-open');
    groupButtons.forEach(b=>b.setAttribute('aria-expanded','false'));
    if(focusOrigin instanceof HTMLElement)focusOrigin.focus();
  };
  const switchTo=(target)=>{
    // Use the original UI listeners so unsaved-change guards and publication states stay authoritative.
    const original=tabs.find(t=>identifier(t)===target);
    if(original)original.click();
    close();
    refresh();
  };
  const open=(group,button)=>{
    if(group==='home'){switchTo('overview');return;}
    focusOrigin=button;
    const heading={racing:'Race Operations',team:'Team & Roster',media:'Media Center',more:'Admin Tools'};
    if(title)title.textContent=heading[group]||'Admin Workspaces';
    list.replaceChildren();
    for(const original of tabs.filter(t=>groupOf(t)===group)){
      const item=document.createElement('button');
      item.type='button';
      item.textContent=labelOf(original);
      item.dataset.target=identifier(original);
      if(original.classList.contains('is-active'))item.classList.add('is-active');
      item.addEventListener('click',()=>switchTo(item.dataset.target));
      list.append(item);
    }
    sheet.hidden=false;overlay.hidden=false;
    document.documentElement.classList.add('aw-admin-sheet-open');
    groupButtons.forEach(b=>b.setAttribute('aria-expanded',String(b===button)));
    sheet.querySelector('[data-aw-admin-mobile-close]')?.focus();
  };
  const refresh=()=>{
    const current=tabs.find(b=>b.classList.contains('is-active'))||tabs[0];
    const activeGroup=groupOf(current);
    groupButtons.forEach(b=>{
      const selected=b.dataset.awAdminMobileGroup===activeGroup;
      b.classList.toggle('is-active',selected);
      if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    // Only ordinary CMS datasets use the content form. Paint and theme tools stay independent.
    const isDataset=!!current?.hasAttribute('data-admin-dataset');
    dock.hidden=!isDataset;
    const status=document.querySelector('[data-aw-admin-mobile-status]');
    if(status&&feedback){
      status.textContent=feedback.textContent?.trim()||'Editor ready';
      status.dataset.state=feedback.dataset.state||'neutral';
    }
  };
  groupButtons.forEach(button=>button.addEventListener('click',()=>open(button.dataset.awAdminMobileGroup,button)));
  overlay.addEventListener('click',close);
  document.querySelector('[data-aw-admin-mobile-close]')?.addEventListener('click',close);
  document.querySelector('[data-aw-admin-mobile-save]')?.addEventListener('click',()=>{
    const submit=document.querySelector('[data-content-form] button[type="submit"]');
    if(submit instanceof HTMLButtonElement&&!submit.disabled)submit.click();
  });
  document.querySelector('[data-aw-admin-mobile-publish]')?.addEventListener('click',()=>{
    const publish=document.querySelector('[data-content-publish]');
    if(publish instanceof HTMLButtonElement&&!publish.disabled)publish.click();
  });
  document.addEventListener('keydown',event=>{
    if(sheet.hidden)return;
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
      const controls=Array.from(sheet.querySelectorAll('button:not([disabled])')).filter(el=>el.getClientRects().length);
      if(!controls.length)return;
      if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus();}
      else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus();}
    }
  });
  const observer=new MutationObserver(refresh);
  observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['class','aria-selected']});
  if(feedback)observer.observe(feedback,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state']});
  window.addEventListener('resize',()=>{if(matchMedia('(min-width: 981px)').matches)close()});
  window.addEventListener('pagehide',close);
  refresh();
})();
