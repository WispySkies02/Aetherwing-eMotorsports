const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const tags=(items,className='team-partner__tags')=>Array.isArray(items)&&items.length?`<ul class="${className}">${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'';

export function partnerCardHtml(partner,index=0) {
  const url=/^https:\/\//i.test(String(partner.url||''))?partner.url:'#';
  const presence=partner.presenceTitle?`<section class="team-partner__presence" aria-label="Aetherwing presence"><small>Aetherwing presence</small><h4>${esc(partner.presenceTitle)}</h4>${(partner.presenceParagraphs||[]).map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}${tags(partner.presenceTags)}</section>`:'';
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${esc(partner.name)} website" data-partner-name="${esc(partner.name)}" class="team-partner${index===0?' is-featured':''}"><div>${partner.logo?`<img src="${esc(partner.logo)}" alt="${esc(partner.name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode(this.alt))">`:`<strong>${esc(partner.name)}</strong>`}</div><span class="team-partner__badges"><i>${esc(partner.badge||partner.role)}</i>${partner.category?`<i>${esc(partner.category)}</i>`:''}</span>${partner.profileLabel?`<small class="team-partner__profile-label">${esc(partner.profileLabel)}</small>`:''}<h3>${esc(partner.name)}</h3><p>${esc(partner.description)}</p>${tags(partner.tags)}${presence}<b>Visit website ↗</b></a>`;
}
