import { checkpoints, drivers, presets, transferIndex, chartModel, valueAt, raceNumber, dateLabel } from './kmart-season2.mjs';

export function mountKmartFeature(root) {
  const doc=root.ownerDocument,win=doc.defaultView,NS='http://www.w3.org/2000/svg';
  const q=selector=>root.querySelector(selector);
  const text=(selector,value)=>{q(selector).textContent=value;};
  const el=(tag,content)=>{const node=doc.createElement(tag);node.textContent=content;return node;};
  const svg=q('[data-km-chart]');
  let mode='official',ids=[...presets.story],selected=checkpoints.length-1,model;
  const shape=(tag,attributes,parent=svg,content)=>{
    const node=doc.createElementNS(NS,tag);for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
    if(content!==undefined)node.textContent=content;parent.append(node);return node;
  };
  const selection=()=>{
    const point=checkpoints[selected];
    svg.querySelectorAll('[data-checkpoint-hit]').forEach(node=>node.setAttribute('aria-pressed',String(Number(node.dataset.checkpointHit)===selected)));
    const line=svg.querySelector('[data-selection-line]');if(line){line.setAttribute('x1',model.x(selected));line.setAttribute('x2',model.x(selected));}
    const dots=svg.querySelector('[data-selection-dots]');
    if(dots){dots.replaceChildren();for(const series of model.series){const point=series.points.find(p=>p.index===selected);if(point)shape('circle',{cx:point.x,cy:point.y,r:6,fill:series.color,stroke:'#101116','stroke-width':2},dots);}}
    const detail=q('[data-km-tooltip]'),list=el('ul','');
    for(const driver of drivers.filter(driver=>ids.includes(driver.id))){const value=valueAt(point,driver.id,mode);const row=el('li',`${driver.name}${driver.id==='hailey'&&mode==='earned'?' · race-earned':''}: ${value===null?'Not recorded':value} ${value===null?'':'pts'}`);row.style.setProperty('--driver-color',driver.color);list.append(row);}
    detail.replaceChildren(el('h3',`${point.label} · ${dateLabel(point.date)}`),el('p',point.summary),list);
    q('[data-km-checkpoint]').value=selected;
    const range=q('[data-km-timeline]');range.value=selected;range.setAttribute('aria-valuetext',`${point.label}, ${point.haileyOfficial} official points, ${point.haileyRank}`);
    text('[data-km-race]',`${point.isAdministrativeTransfer?'Administrative checkpoint':`R${raceNumber(selected)}`} · ${dateLabel(point.date)}`);
    text('[data-km-milestone-title]',point.label);text('[data-km-milestone-story]',point.summary);text('[data-km-milestone-points]',point.haileyOfficial);text('[data-km-milestone-rank]',point.haileyRank);
    q('[data-km-previous]').disabled=selected===0;q('[data-km-next]').disabled=selected===checkpoints.length-1;
    root.querySelectorAll('[data-km-jump]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.kmJump)===selected)));
  };
  const choose=index=>{selected=Math.max(0,Math.min(checkpoints.length-1,Number(index)));selection();};
  const render=()=>{
    const focused=doc.activeElement?.dataset?.checkpointHit;
    model=chartModel(mode,ids,Math.round(q('[data-km-chart-wrap]').getBoundingClientRect().width)||960);
    svg.setAttribute('viewBox',`0 0 ${model.width} ${model.height}`);svg.replaceChildren();
    shape('title',{},svg,'Season 2 cumulative championship points');
    for(const tick of model.ticks){shape('line',{x1:model.left,x2:model.width-model.right,y1:model.y(tick),y2:model.y(tick),class:'km-gridline'});shape('text',{x:model.left-10,y:model.y(tick)+4,'text-anchor':'end'},svg,tick);}
    shape('rect',{x:model.x(transferIndex)-9,y:model.top,width:18,height:model.height-model.top-model.bottom,class:'km-transfer-band'});
    shape('text',{x:model.width<500?model.width-model.right:model.x(transferIndex),y:18,'text-anchor':model.width<500?'end':'middle',class:'km-transfer-label'},svg,mode==='earned'?'TRANSFER EXCLUDED':'+310 TRANSFER');
    for(const tick of model.labels)shape('text',{x:tick.x,y:model.height-20,'text-anchor':tick.index===10?'end':tick.index===0?'start':'middle'},svg,tick.label);
    for(const series of model.series){const group=shape('g',{'data-chart-driver':series.id});shape('path',{d:series.path,stroke:series.color,class:`km-chart-line${series.id==='hailey'?' is-hailey':''}`},group);for(const point of series.points)shape('circle',{cx:point.x,cy:point.y,r:series.id==='hailey'?4:2.5,fill:series.color},group);}
    shape('line',{'data-selection-line':'',x1:model.x(selected),x2:model.x(selected),y1:model.top,y2:model.height-model.bottom,class:'km-selection-line'});
    shape('g',{'data-selection-dots':''});
    checkpoints.forEach((point,index)=>{const half=(model.width-model.left-model.right)/(checkpoints.length-1)/2;shape('rect',{x:Math.max(model.left,model.x(index)-half),y:model.top,width:index===0||index===10?half:half*2,height:model.height-model.top-model.bottom,fill:'transparent',tabindex:0,role:'button','data-checkpoint-hit':index,'aria-label':`${point.label}, ${dateLabel(point.date)}${point.isAdministrativeTransfer?', league-approved transfer, not a race':''}`,'aria-pressed':index===selected});});
    q('[data-km-chart-empty]').hidden=ids.length>0;
    root.querySelectorAll('[data-km-table-driver="hailey"]').forEach(cell=>{cell.textContent=valueAt(checkpoints[Number(cell.dataset.index)],'hailey',mode);});
    q('.km-data caption').textContent=`Cumulative points · ${mode==='earned'?'Hailey race-earned only':'official standings'} · missing values are not zero`;
    text('[data-km-mode-note]',mode==='earned'?'Race-earned view: Hailey’s +310 administrative transfer is excluded. Rivals retain their earned totals; the blue line stays flat at the transfer checkpoint.':'Official points include the +310 league-approved transfer after Portland.');
    selection();if(focused!==undefined)svg.querySelector(`[data-checkpoint-hit="${focused}"]`)?.focus({preventScroll:true});
  };
  q('[data-km-controls]').disabled=false;
  for(const control of root.querySelectorAll('[data-km-checkpoint],[data-km-timeline],[data-km-jump]'))control.disabled=false;
  root.addEventListener('change',event=>{
    const target=event.target;
    if(target.name==='km-points-mode'){mode=target.value;render();}
    if(target.matches('[data-km-driver]')){ids=[...root.querySelectorAll('[data-km-driver]:checked')].map(node=>node.value);q('[data-km-comparison]').value='custom';render();}
    if(target.matches('[data-km-comparison]')&&presets[target.value]){ids=[...presets[target.value]];root.querySelectorAll('[data-km-driver]').forEach(node=>{node.checked=ids.includes(node.value);});render();}
    if(target.matches('[data-km-checkpoint]'))choose(target.value);
  });
  q('[data-km-timeline]').addEventListener('input',event=>choose(event.target.value));
  root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-km-jump'))choose(button.dataset.kmJump);if(button.hasAttribute('data-km-previous'))choose(selected-1);if(button.hasAttribute('data-km-next'))choose(selected+1);});
  for(const eventName of ['pointermove','focusin'])svg.addEventListener(eventName,event=>{const hit=event.target.closest?.('[data-checkpoint-hit]');if(hit&&Number(hit.dataset.checkpointHit)!==selected)choose(hit.dataset.checkpointHit);});
  svg.addEventListener('click',event=>{const hit=event.target.closest?.('[data-checkpoint-hit]');if(hit)choose(hit.dataset.checkpointHit);});
  svg.addEventListener('keydown',event=>{if(!event.target.hasAttribute('data-checkpoint-hit'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(event.target.dataset.checkpointHit);return;}const next=event.key==='ArrowRight'?selected+1:event.key==='ArrowLeft'?selected-1:event.key==='Home'?0:event.key==='End'?checkpoints.length-1:null;if(next===null)return;event.preventDefault();choose(next);svg.querySelector(`[data-checkpoint-hit="${selected}"]`).focus({preventScroll:true});});
  render();const observer=new win.ResizeObserver(render);observer.observe(q('[data-km-chart-wrap]'));
  return ()=>observer.disconnect();
}
