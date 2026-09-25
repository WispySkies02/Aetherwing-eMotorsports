(()=>{
  const root=document.documentElement;
  const grid=document.querySelector('[data-theme-grid]');
  const name=document.querySelector('[data-theme-preview-name]');
  const reset=document.querySelector('[data-theme-reset]');
  if(!grid||!name||!reset)return;
  const labels=Object.fromEntries([...grid.querySelectorAll('[data-theme]')].map((button)=>[button.dataset.theme,button.querySelector('b')?.textContent?.trim()||button.dataset.theme]));
  const select=(theme='default')=>{
    if(theme==='default')delete root.dataset.adminTheme;else root.dataset.adminTheme=theme;
    grid.querySelectorAll('[data-theme]').forEach((button)=>{const active=button.dataset.theme===theme;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    name.textContent=labels[theme]||'Default Aetherwing';
  };
  grid.addEventListener('click',(event)=>{const button=event.target.closest('[data-theme]');if(button)select(button.dataset.theme);});
  reset.addEventListener('click',()=>select('default'));
  select('default');
})();
