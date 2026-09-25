(()=>{
  const $=(selector)=>document.querySelector(selector),api=window.AetherwingSeasonal;
  const root=$('[data-theme-lab]');
  if(!root||!api)return;
  const select=$('[data-theme-select]'),route=$('[data-theme-route]'),frame=$('[data-theme-preview]'),buttons=$('[data-theme-buttons]'),schedule=$('[data-theme-schedule]'),auto=$('[data-theme-auto]'),name=$('[data-theme-preview-name]'),effect=$('[data-theme-effect]');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const entries=Object.entries(api.themes);
  for(const [id,theme] of entries){const option=document.createElement('option');option.value=id;option.textContent=`${theme.label} · ${theme.window}`;select.append(option);}
  buttons.innerHTML=entries.map(([id,theme])=>`<button type="button" data-theme-choice="${esc(id)}"><b>${esc(theme.label)}</b><small>${esc(theme.window)}</small></button>`).join('');
  schedule.innerHTML=entries.map(([id,theme])=>`<article><span>${esc(theme.window)}</span><strong>${esc(theme.label)}</strong><small>${esc(theme.effect)}</small></article>`).join('');
  const automatic=api.scheduleFor(new Date()),automaticTheme=api.themes[automatic];
  auto.textContent=automaticTheme?`${automaticTheme.label} · ${automaticTheme.window}`:'Plain Aetherwing';
  const previewUrl=()=>{const base=route.value||'/',theme=select.value||'auto',join=base.includes('?')?'&':'?';return `${base}${join}season=${encodeURIComponent(theme)}&themeLab=1`;};
  const update=()=>{const theme=select.value==='auto'?api.themes[automatic]:api.themes[select.value];frame.src=previewUrl();name.textContent=select.value==='off'?'PLAIN AETHERWING':theme?.label||'AUTO';effect.textContent=select.value==='off'?'No seasonal accent or front-glass layer.':theme?.effect||'Automatic seasonal presentation.';buttons.querySelectorAll('button').forEach(button=>button.classList.toggle('is-active',button.dataset.themeChoice===select.value));};
  select.addEventListener('change',update);route.addEventListener('change',update);
  buttons.addEventListener('click',event=>{const button=event.target.closest('[data-theme-choice]');if(!button)return;select.value=button.dataset.themeChoice;update();});
  $('[data-theme-open]')?.addEventListener('click',()=>window.open(previewUrl(),'_blank','noopener'));
  update();
})();
