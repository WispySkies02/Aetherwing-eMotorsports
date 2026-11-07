import { eventStart } from './race-clock.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const text = value => typeof value === 'string' ? value : '';
const headingId = (heading, section) => `mx-${String(heading).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'section'}-${section + 1}`;

// The CMS sections are the only copy source. Blocks describe presentation and
// placement, so changing a paragraph never leaves a second stale text version.
export function resolveArticleBlocks(story = {}) {
  const sections = Array.isArray(story.sections) ? story.sections : [];
  const plan = Array.isArray(story.articleBlocks) ? story.articleBlocks : sections.flatMap((section,index) => [
    ...(index > 0 ? [{type:'heading',section:index}] : []),
    ...(section.paragraphs || []).map((_,paragraph) => ({type:'paragraph',section:index,paragraph}))
  ]);
  const seen = new Set(), blocks = [];
  for (const block of plan) {
    if (block?.type === 'previous-race') { blocks.push({type:'previous-race'}); continue; }
    const section = sections[block?.section];
    if (!section) continue;
    if (block.type === 'heading') {
      if (text(section.heading)) blocks.push({type:'heading',section:block.section,text:section.heading,id:headingId(section.heading,block.section)});
      continue;
    }
    if (!['paragraph','quote'].includes(block.type)) continue;
    const copy = section.paragraphs?.[block.paragraph], identity = `${block.section}:${block.paragraph}`;
    if (typeof copy !== 'string' || seen.has(identity)) continue;
    seen.add(identity);
    blocks.push({type:block.type,section:block.section,paragraph:block.paragraph,text:copy,
      ...(block.type === 'quote' ? {quoteStyle:['featured','standard','inline'].includes(block.quoteStyle) ? block.quoteStyle : 'standard',attribution:text(block.attribution)} : {})});
  }
  // New CMS paragraphs remain visible even before a layout annotation is added.
  sections.forEach((section,index) => {
    const missing = (section.paragraphs || []).flatMap((copy,paragraph) => typeof copy === 'string' && !seen.has(`${index}:${paragraph}`) ? [{type:'paragraph',section:index,paragraph,text:copy}] : []);
    if (!missing.length) return;
    const last = blocks.findLastIndex(block => block.section === index);
    if (last >= 0) blocks.splice(last + 1,0,...missing);
    else blocks.push(...(index > 0 && section.heading ? [{type:'heading',section:index,text:section.heading,id:headingId(section.heading,index)}] : []),...missing);
  });
  return blocks;
}

export function readingTime(story = {}) {
  const copy = [story.title,story.summary,...resolveArticleBlocks(story).map(block => block.text)].filter(Boolean).join(' ');
  return Math.max(1,Math.ceil((copy.match(/\S+/g) || []).length / 225));
}

const articleUrl = (story, candidate) => {
  try {
    const url = new URL(candidate || `/news/${encodeURIComponent(story.slug || 'bell-eyes-championship-mexico-city')}/`,'https://aetherwing.net/');
    if (['http:','https:'].includes(url.protocol)) return url.href;
  } catch {}
  return 'https://aetherwing.net/news/';
};

export function articleStructuredData(story = {}, canonical) {
  const url = articleUrl(story,canonical);
  const article = {'@context':'https://schema.org','@type':'NewsArticle',headline:story.title || '',description:story.embedDescription || story.summary || '',
    datePublished:story.dateIso || '',mainEntityOfPage:{'@type':'WebPage','@id':url},url,articleSection:story.category || '',inLanguage:'en',
    publisher:{'@type':'Organization',name:'Aetherwing eMotorsports',url:'https://aetherwing.net/'},timeRequired:`PT${readingTime(story)}M`,
    articleBody:resolveArticleBlocks(story).map(block => block.text).filter(Boolean).join('\n\n')};
  if (Array.isArray(story.tags) && story.tags.length) article.keywords = story.tags.join(', ');
  const image = story.socialImage || story.image;
  if (image) { try { const absolute = new URL(image,url); if (['https:','http:'].includes(absolute.protocol)) article.image = absolute.href; } catch {} }
  return article;
}

export function raceCountdown(race = {}, now = Date.now()) {
  const empty = {state:'unavailable',start:null,days:0,hours:0,minutes:0,seconds:0};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(race.date || '') || !/\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(race.time || '')) return empty;
  const start = eventStart(race), milliseconds = start.getTime() - Number(now);
  if (!Number.isFinite(milliseconds)) return empty;
  if (milliseconds <= 0) return {...empty,state:'reached',start:start.toISOString()};
  const remaining = Math.ceil(milliseconds / 1000);
  return {state:'countdown',start:start.toISOString(),days:Math.floor(remaining / 86400),hours:Math.floor(remaining / 3600) % 24,minutes:Math.floor(remaining / 60) % 60,seconds:remaining % 60};
}

const raceFields = race => [
  ['event','Event',race.event],['date','Date',race.dateLabel || race.date],['time','Time',race.time],['track','Circuit',race.track],['location','Location',race.location],
  ['series','Series',race.series],['round','Race',race.round],['driver','Driver',race.driver],['car','Car',`No. ${race.number || '—'} ${race.manufacturer || ''}`.trim()],['team','Team',race.team],['configuration','Track configuration',race.configuration]
];

function racePanel(story) {
  const race = story.raceDetails || {}, clock = raceCountdown(race);
  return `<section class="mx-race" data-mx-race-panel aria-labelledby="mx-race-heading"><header><p class="mx-eyebrow">The race ahead</p><h2 id="mx-race-heading">${escapeHtml(race.event)}</h2></header><div class="mx-race__layout"><dl class="mx-race__facts">${raceFields(race).map(([key,label,value]) => `<div data-mx-race-field="${key}"><dt>${label}</dt><dd>${key === 'date' ? `<time datetime="${escapeHtml(race.date)}">${escapeHtml(value)}</time>` : escapeHtml(value)}</dd></div>`).join('')}</dl><div class="mx-countdown" data-mx-countdown data-mx-date="${escapeHtml(race.date)}" data-mx-time="${escapeHtml(race.time)}" data-mx-countdown-state="${clock.state}" role="timer" aria-live="off" aria-label="Time until the scheduled race start"><p class="mx-eyebrow">To scheduled start</p><div class="mx-countdown__units" data-mx-countdown-units hidden>${[['days','Days'],['hours','Hours'],['minutes','Minutes'],['seconds','Seconds']].map(([key,label]) => `<span><b data-mx-unit="${key}">${String(clock[key]).padStart(2,'0')}</b><small>${label}</small></span>`).join('')}</div><p class="mx-countdown__status" data-mx-countdown-status>${clock.state === 'reached' ? 'Scheduled start time reached.' : `Scheduled start · ${escapeHtml(race.time)}`}</p><small class="mx-countdown__zone">America/New_York · Eastern Time</small></div></div></section>`;
}

function scenarioPanel(story) {
  const race = story.raceDetails || {}, points = Number(race.clinchRelativePoints);
  if (!Number.isFinite(points) || points <= 0) return '';
  return `<aside class="mx-scenario" aria-labelledby="mx-scenario-heading"><div><p class="mx-eyebrow" id="mx-scenario-heading">Championship scenario</p><strong data-mx-clinch>+${points} <span>points</span></strong></div><div><p>Bell enters Mexico City leading the regular-season standings.</p><p>Bell needs to outscore teammate Will by at least ${points} points to clinch the regular-season championship at Mexico City.</p><p>If she does not clinch Monday night, the championship battle continues into the remaining regular-season events.</p><details data-mx-scenario><summary>How can Bell clinch the regular-season championship?</summary><p>Bell must outscore StarClutch Racing teammate Will by at least ${points} points during the ${escapeHtml(race.event)} to secure the regular-season championship.</p><small>This scenario reflects the standings and clinch calculation supplied for this pre-race report. The +${points} figure is points gained relative to Will during this event, not the existing championship lead.</small></details></div></aside>`;
}

function editorialHtml(story, blocks) {
  let html = '', sectionOpen = false;
  for (const block of blocks) {
    if (block.type === 'heading') {
      if (sectionOpen) html += '</section>';
      html += `<section class="mx-editorial-section" aria-labelledby="${block.id}"><h2 id="${block.id}" data-mx-block="heading">${escapeHtml(block.text)}</h2>`;
      sectionOpen = true;
    } else {
      if (!sectionOpen) { html += '<section class="mx-editorial-section" aria-label="Introduction">'; sectionOpen = true; }
      if (block.type === 'previous-race') {
        const previous = story.raceDetails?.previousRace;
        if (previous?.event) html += `<aside class="mx-previous" data-mx-previous><p class="mx-eyebrow">Previous race</p><h3>${escapeHtml(previous.event)}</h3><p>${escapeHtml(previous.track)}</p><strong>${escapeHtml(previous.finish)} <span>— ${escapeHtml(story.raceDetails?.driver)}</span></strong></aside>`;
      } else if (block.type === 'quote') {
        html += `<blockquote class="mx-quote mx-quote--${block.quoteStyle}" data-mx-block="quote" data-mx-quote data-quote-style="${block.quoteStyle}" data-mx-section="${block.section}" data-mx-paragraph="${block.paragraph}"><p>${escapeHtml(block.text)}</p>${block.attribution ? `<cite>— ${escapeHtml(block.attribution)}</cite>` : ''}</blockquote>`;
      } else if (block.type === 'paragraph') {
        const dateline = block.section === 0 && block.paragraph === 0 && block.text.startsWith('MEXICO CITY, Mexico —') ? '<strong>MEXICO CITY, Mexico —</strong>' + escapeHtml(block.text.slice('MEXICO CITY, Mexico —'.length)) : escapeHtml(block.text);
        html += `<p data-mx-block="paragraph" data-mx-section="${block.section}" data-mx-paragraph="${block.paragraph}">${dateline}</p>`;
      }
    }
  }
  return html + (sectionOpen ? '</section>' : '');
}

export function renderMexicoCityFeature(story = {}, {canonicalUrl} = {}) {
  const race = story.raceDetails || {}, blocks = resolveArticleBlocks(story), headings = blocks.filter(block => block.type === 'heading'), url = articleUrl(story,canonicalUrl);
  // The generic social card is not an on-track photograph. Only an explicitly
  // supplied and identified hero image can replace this typography treatment.
  const photo = story.heroImage && story.heroImageAlt ? `<img src="${escapeHtml(story.heroImage)}" alt="${escapeHtml(story.heroImageAlt)}" width="1600" height="900" decoding="async" fetchpriority="high">` : `<div class="mx-hero__typography"><span>Aetherwing <b>Team Wire</b></span><p>${escapeHtml(race.round)} / ${escapeHtml(race.series)}</p><strong>Mexico<br>City</strong><small>${escapeHtml(race.driver)} · No. ${escapeHtml(race.number)} ${escapeHtml(race.manufacturer)} · ${escapeHtml(race.team)}</small></div>`;
  const related = (Array.isArray(story.relatedStories) ? story.relatedStories : []).filter(item => text(item?.slug) && text(item?.title));
  const relatedHtml = related.length ? `<section class="mx-related" data-mx-related aria-labelledby="mx-related-heading"><h2 id="mx-related-heading">Related stories</h2><ul>${related.map(item => `<li><a href="/news/${encodeURIComponent(item.slug)}/"><span>${escapeHtml(item.title)}</span>${item.date ? `<small>${item.dateIso ? `<time datetime="${escapeHtml(item.dateIso)}">${escapeHtml(item.date)}</time>` : escapeHtml(item.date)}</small>` : ''}<b aria-hidden="true">↗</b></a></li>`).join('')}</ul></section>` : '';
  return `<div class="wrap mx-story" data-mx-feature><header class="mx-hero" data-mx-hero><a class="mx-back" href="/news/">← Back to News</a><p class="mx-eyebrow">${escapeHtml(story.category)}</p><h1>${escapeHtml(story.title)}</h1><p class="mx-deck">${escapeHtml(story.summary)}</p><dl class="mx-meta"><div><dt>Published</dt><dd><time datetime="${escapeHtml(story.dateIso)}">${escapeHtml(story.date)}</time></dd></div><div><dt>Coverage</dt><dd>${escapeHtml(story.context)}</dd></div><div><dt>Driver</dt><dd>${escapeHtml(race.driver)}</dd></div><div><dt>Team</dt><dd>${escapeHtml(race.team)}</dd></div><div><dt>Series</dt><dd>${escapeHtml(race.series)}</dd></div><div><dt>Reading time</dt><dd data-mx-reading-time>${readingTime(story)} min read</dd></div></dl><figure class="mx-hero__figure"><div class="mx-hero__visual" data-mx-hero-visual>${photo}</div><figcaption>${escapeHtml(story.heroImage && story.heroCaption ? story.heroCaption : `${race.driver || ''} · No. ${race.number || ''} ${race.manufacturer || ''} · ${race.team || ''}`)}</figcaption></figure></header><div class="mx-feature-body">${racePanel(story)}${scenarioPanel(story)}<section class="mx-share" id="mx-share" aria-label="Share this article"><span class="mx-eyebrow">Share this story</span><div class="mx-share__actions"><button type="button" data-mx-copy disabled>Copy article link</button><button type="button" data-mx-share hidden>Share article</button><a data-mx-x href="https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title || '')}&amp;url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">Share to X ↗</a></div><p class="mx-share__status" data-mx-share-status role="status" aria-live="polite"></p><label class="mx-copy-fallback" data-mx-copy-fallback hidden><span>Article link · select and copy</span><input type="text" readonly aria-label="Article link" value="${escapeHtml(url)}"></label></section><div class="mx-reading-grid"><details class="mx-toc" data-mx-toc open><summary>In this article</summary><nav aria-label="Article sections"><ol>${headings.map(block => `<li><a href="#${block.id}">${escapeHtml(block.text)}</a></li>`).join('')}</ol></nav></details><div class="mx-prose" data-mx-editorial>${editorialHtml(story,blocks)}</div></div><footer class="mx-next" aria-labelledby="mx-next-heading"><p class="mx-eyebrow">Next event</p><h2 id="mx-next-heading">${escapeHtml(race.event)}</h2><p><time datetime="${escapeHtml(race.date)}">${escapeHtml(race.dateLabel || race.date)}</time><span> · ${escapeHtml(race.time)}</span></p><p>${escapeHtml(race.track)}</p><p>${escapeHtml(race.series)}</p><div class="mx-next__links"><a href="/news/">← Back to News</a><a href="#mx-share">Share article ↑</a></div>${relatedHtml}</footer></div></div>`;
}

const mounted = new WeakMap();
export function mountMexicoCityFeature(root) {
  if (!root) return null;
  if (mounted.has(root)) return mounted.get(root);
  const document = root.ownerDocument, window = document.defaultView;
  let timer = null, generation = 0, stopped = false;
  const canonical = () => articleUrl({},document.querySelector('link[rel="canonical"]')?.href || window.location.href);
  const feedback = (message, epoch = generation) => { if (epoch === generation && !stopped) root.querySelectorAll('[data-mx-share-status]').forEach(node => { node.textContent = message; }); };
  const manualCopy = (url, epoch) => {
    if (epoch !== generation || stopped) return;
    const label = root.querySelector('[data-mx-copy-fallback]');
    if (label) { label.hidden = false; const input = label.querySelector('input'); input.value = url; input.focus({preventScroll:true}); input.select(); }
    feedback('Copy could not complete automatically. Select and copy the article link below.',epoch);
  };
  const copy = async () => {
    const epoch = generation, url = canonical();
    try {
      if (typeof window.navigator.clipboard?.writeText === 'function') { await window.navigator.clipboard.writeText(url); feedback('Article link copied.',epoch); return; }
    } catch {}
    if (epoch !== generation || stopped) return;
    const field = document.createElement('textarea'), previousFocus = document.activeElement;
    field.value = url; field.setAttribute('readonly',''); field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.append(field); field.select();
    let copied = false;
    try { copied = document.execCommand?.('copy') === true; } catch {}
    field.remove(); previousFocus?.focus?.({preventScroll:true});
    if (copied) feedback('Article link copied.',epoch); else manualCopy(url,epoch);
  };
  const click = async event => {
    const button = event.target.closest?.('[data-mx-copy],[data-mx-share]');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-mx-copy')) { await copy(); return; }
    const epoch = generation;
    try {
      await window.navigator.share({title:root.querySelector('h1')?.textContent || document.title,url:canonical()});
      feedback('Article shared.',epoch);
    } catch (error) {
      if (error?.name === 'AbortError') feedback('Sharing cancelled.',epoch);
      else { feedback('Sharing is unavailable. Use Copy article link or Share to X.',epoch); }
    }
  };
  const tick = () => {
    const panel = root.querySelector('[data-mx-countdown]');
    if (!panel) return;
    const clock = raceCountdown({date:panel.dataset.mxDate,time:panel.dataset.mxTime},window.Date.now());
    panel.dataset.mxCountdownState = clock.state;
    const units = panel.querySelector('[data-mx-countdown-units]'), status = panel.querySelector('[data-mx-countdown-status]');
    units.hidden = clock.state !== 'countdown';
    if (clock.state === 'countdown') {
      for (const key of ['days','hours','minutes','seconds']) panel.querySelector(`[data-mx-unit="${key}"]`).textContent = String(clock[key]).padStart(2,'0');
      status.textContent = 'Until the scheduled start.';
    } else { status.textContent = clock.state === 'reached' ? 'Scheduled start time reached.' : 'Scheduled start time is not available.'; window.clearInterval(timer); timer = null; }
  };
  const armClock = () => { window.clearInterval(timer); timer = null; tick(); if (!stopped && document.visibilityState !== 'hidden' && root.querySelector('[data-mx-countdown]')?.dataset.mxCountdownState === 'countdown') timer = window.setInterval(tick,1000); };
  const refresh = () => {
    generation++;
    root.querySelectorAll('[data-mx-copy]').forEach(button => { button.disabled = false; });
    root.querySelectorAll('[data-mx-share]').forEach(button => { button.hidden = typeof window.navigator.share !== 'function'; });
    root.querySelectorAll('[data-mx-x]').forEach(link => { link.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(root.querySelector('h1')?.textContent || document.title)}&url=${encodeURIComponent(canonical())}`; });
    armClock();
  };
  const stop = () => { stopped = true; generation++; window.clearInterval(timer); root.removeEventListener('click',click); document.removeEventListener('visibilitychange',armClock); window.removeEventListener('pageshow',armClock); window.removeEventListener('pagehide',pagehide); mounted.delete(root); };
  const pagehide = event => { if (!event.persisted) stop(); };
  root.addEventListener('click',click); document.addEventListener('visibilitychange',armClock); window.addEventListener('pageshow',armClock); window.addEventListener('pagehide',pagehide);
  const controller = {refresh,stop}; mounted.set(root,controller); refresh(); return controller;
}

export function updateMexicoCityStory(root, story) {
  const feature = root.matches?.('[data-mx-feature]') ? root : root.querySelector('[data-mx-feature]');
  if (!feature) return;
  const document = feature.ownerDocument, canonical = articleUrl(story,document.querySelector('link[rel="canonical"]')?.href);
  const disclosures = new Map([...feature.querySelectorAll('details')].map(node => [node.hasAttribute('data-mx-toc') ? 'toc' : 'scenario',node.open]));
  const template = document.createElement('template'); template.innerHTML = renderMexicoCityFeature(story,{canonicalUrl:canonical});
  feature.replaceChildren(...template.content.querySelector('[data-mx-feature]').childNodes);
  feature.querySelectorAll('details').forEach(node => { const key = node.hasAttribute('data-mx-toc') ? 'toc' : 'scenario'; if (disclosures.has(key)) node.open = disclosures.get(key); });
  const data = root.querySelector('[data-mx-structured-data]') || document.querySelector('[data-mx-structured-data]');
  if (data) data.textContent = JSON.stringify(articleStructuredData(story,canonical)).replace(/</g,'\\u003c');
  const existing = mounted.get(feature); if (existing) existing.refresh(); else mountMexicoCityFeature(feature);
}
