import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {resolveArticleBlocks,readingTime,raceCountdown,articleStructuredData,renderMexicoCityFeature} from '../src/lib/mexico-city-feature-client.mjs';

const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const news=JSON.parse(fs.readFileSync(new URL('src/data/news.json',root),'utf8'));
const slug='bell-eyes-championship-mexico-city',canonical=`https://aetherwing.net/news/${slug}/`,story=news.find(story=>story.slug===slug);
const title='Bell Eyes Regular-Season Championship as Kmart Series Heads to Mexico City';
const headings=['A Difficult Road Ahead','A Points Lead With a Story Behind It','Iowa Provides a Change of Pace','More Than Just a Championship','The Championship Opportunity'];
// Independent baseline from the owner-uploaded article's editorial section,
// not from news.json: strip Markdown bold/blockquote delimiters and the outer
// standalone quotation marks only. No full development handoff is duplicated.
const sourceCopySha256='d5c7f2f0446609e2f45ae804ad99d78e1f73716b7f52bd472be8c00a41f79e67';
const sourceQuotes=[
 {section:0,paragraph:4,quoteStyle:'featured',attribution:'Hailey Bell, No. 15 StarClutch Racing',text:'It would certainly put to rest my doubts on my performance lately and my worth as a competitor.'},
 {section:1,paragraph:3,quoteStyle:'inline',attribution:'',text:"Just try my best, I know I am not going to go out there and put on a spectacular performance, but if I worry about my own race and not worry about the regular season championship, I'll be fine."},
 {section:1,paragraph:5,quoteStyle:'standard',attribution:'Hailey Bell',text:"If I don't get it this week, there's next week."},
 {section:2,paragraph:7,quoteStyle:'featured',attribution:'Hailey Bell',text:'Did I stay home and lean on this insurance? No. I still come out and run my races and add to this. I was right behind Will anyways, I was going to pass him regardless.'},
 {section:3,paragraph:5,quoteStyle:'standard',attribution:'Hailey Bell',text:'Well, as race director and league owner, it did hurt that I had some issues I had to deal with. As a competitor, everything went fantastic for me, I hope that same rhythm and momentum comes with me to Mexico City.'},
 {section:3,paragraph:11,quoteStyle:'standard',attribution:'Hailey Bell, on taking risks to win',text:"I certainly will, however I won't do any dirty work for a win."},
 {section:4,paragraph:4,quoteStyle:'featured',attribution:'Hailey Bell',text:'It being a road course, all I really want is to be with everyone and have battles on the track and not be a spectator that transitions in to a nobody.'},
 {section:5,paragraph:6,quoteStyle:'standard',attribution:'Hailey Bell',text:'I appreciate everyone for all of their support, the best is still yet to come!'},
];
assert.ok(story,'The owner-supplied Mexico City story is in the existing newsroom collection');
assert.equal(story.featureLayout,'mexico-city-prerace');assert.equal(story.title,title);assert.equal(story.dateIso,'2026-11-07');assert.equal(story.date,'November 7, 2026');assert.equal(story.category,'KMART AUTO PARTS SERIES');assert.equal(story.context,'Pre-Race Feature / Driver Interview');
assert.equal(story.featured,false,'The owner keeps the NRRS season recap as the lead');assert.deepEqual(news.filter(story=>story.featured).map(story=>story.slug),['hailey-bell-nrrs-season-3-review']);assert.equal(story.byline,undefined,'No fictional reporter byline is introduced');
const related=news.find(story=>story.slug==='from-fourth-to-first-hailey-bell-kmart-chase');assert.ok(related,'The supplied existing Kmart Chase feature is available in the newsroom');assert.deepEqual(story.relatedStories,[{slug:related.slug,title:related.title,date:related.date}],'The related card uses the real existing story title/date instead of invented metadata');
assert.equal(story.sections.length,6);assert.deepEqual(story.sections.slice(1).map(section=>section.heading),headings);assert.deepEqual(story.sections.map(section=>section.paragraphs.length),[7,7,11,12,8,10]);
const copy=story.sections.map((section,index)=>({heading:index===0?'':section.heading,paragraphs:section.paragraphs}));
assert.equal(createHash('sha256').update(JSON.stringify(copy)).digest('hex'),sourceCopySha256,'Preserve every source paragraph, quotation, heading and break in its original section/order');
const quoteByRef=new Map(sourceQuotes.map(quote=>[`${quote.section}:${quote.paragraph}`,quote]));
const expectedRefs=story.sections.flatMap((section,index)=>[...(index?[{type:'heading',section:index}]:[]),...section.paragraphs.map((_text,paragraph)=>({type:quoteByRef.has(`${index}:${paragraph}`)?'quote':'paragraph',section:index,paragraph}))]);
const editorial=story.articleBlocks.filter(block=>['paragraph','heading','quote'].includes(block.type));
assert.deepEqual(editorial.map(({type,section,paragraph})=>({type,section,...(type==='heading'?{}:{paragraph})})),expectedRefs,'The display follows all source paragraphs exactly once, with quotes at their designated positions');
assert.ok(story.articleBlocks.every(block=>!Object.hasOwn(block,'text')),'Editable copy has one source in sections; the display references it');
const quotes=editorial.filter(block=>block.type==='quote');assert.equal(quotes.length,8,'Seven designated pull quotes plus one ordinary standalone quote');
for(const [index,quote] of quotes.entries()){const expected=sourceQuotes[index];assert.equal(quote.quoteStyle,expected.quoteStyle);assert.equal(quote.attribution||'',expected.attribution);assert.equal(story.sections[quote.section].paragraphs[quote.paragraph],expected.text);}
assert.equal(quotes.filter(quote=>quote.quoteStyle==='featured').length,3);assert.equal(quotes.filter(quote=>quote.quoteStyle==='standard').length,4);assert.equal(quotes.filter(quote=>quote.quoteStyle==='inline').length,1);
assert.ok(story.sections[2].paragraphs.includes('"I worry about my race and do what I need to do," Bell said. "If I worry about other stuff then that\'s when I mess myself up."'),'Preserve the ordinary inline interview paragraph without promoting or duplicating it as a pull quote');
const previousIndex=story.articleBlocks.findIndex(block=>block.type==='previous-race');assert.equal(story.articleBlocks.filter(block=>block.type==='previous-race').length,1);assert.deepEqual(story.articleBlocks[previousIndex-1],quotes.find(quote=>quote.section===3&&quote.paragraph===11));assert.equal(story.articleBlocks[previousIndex+1].type,'heading');assert.equal(story.articleBlocks[previousIndex+1].section,4,'The previous-race context follows the Iowa section');

const race=story.raceDetails;
assert.deepEqual(race,{event:'Corona Mexico 250',date:'2026-11-09',dateLabel:'Monday, November 9, 2026',time:'8:30 PM ET',track:'Autódromo Hermanos Rodríguez',location:'Mexico City, Mexico',series:'Kmart Auto Parts Series — Season 2',round:'Round 12',driver:'Hailey Bell',number:'15',manufacturer:'Dodge',team:'StarClutch Racing (SCR)',configuration:'2025 NASCAR layout',clinchRelativePoints:8,previousRace:{event:'MasterPro Iowa 200',track:'Iowa Speedway',finish:'P4'}},'Race/identity/clinch details match the supplied pre-race report without extra invented statistics');
assert.equal(new Date('2026-11-07T17:00:00Z').toLocaleDateString('en-US',{weekday:'long',timeZone:'America/New_York'}),'Saturday','November 7, 2026 must not acquire an incorrect Sunday metadata label');
const start=Date.parse('2026-11-10T01:30:00.000Z'),before=raceCountdown(race,start-93784000);
assert.equal(new Date(before.start).toISOString(),'2026-11-10T01:30:00.000Z','Monday 8:30 PM ET follows Eastern Standard Time after the DST transition');assert.equal(before.state,'countdown');assert.deepEqual([before.days,before.hours,before.minutes,before.seconds],[1,2,3,4]);
for(const now of [start,start+1000,start+86400000])assert.equal(raceCountdown(race,now).state,'reached','Passing the planned start yields a neutral reached state, not inferred live/running/completed status');
assert.equal(raceCountdown({...race,date:''},start).state,'unavailable','An invalid event date cannot produce an invented countdown');
const resolved=resolveArticleBlocks(story),resolvedEditorial=resolved.filter(block=>['paragraph','heading','quote'].includes(block.type));assert.equal(resolvedEditorial.length,60);
assert.deepEqual(resolvedEditorial.map(block=>block.text),editorial.map(block=>block.type==='heading'?story.sections[block.section].heading:story.sections[block.section].paragraphs[block.paragraph]),'The shared SSR/live resolver uses every canonical section string in source order');
const minutes=readingTime(story);assert.ok(Number.isInteger(minutes)&&minutes>0,'Reading time is a positive computed estimate');
const longer=structuredClone(story);longer.sections[0].paragraphs[0]+=' '+Array(1800).fill('word').join(' ');assert.ok(readingTime(longer)>minutes,'The estimate responds to editorial edits instead of remaining hard-coded');
const data=articleStructuredData(story,canonical);assert.equal(data['@type'],'NewsArticle');assert.equal(data.headline,title);assert.match(data.datePublished,/^2026-11-07/);assert.equal(data.publisher.name,'Aetherwing eMotorsports');assert.equal(data.author,undefined,'Publisher identity is not repurposed as an invented journalist');assert.equal(typeof data.mainEntityOfPage==='string'?data.mainEntityOfPage:data.mainEntityOfPage?.['@id'],canonical);

const html=renderMexicoCityFeature(story,{canonicalUrl:canonical}),dom=new JSDOM(html);try{
 const doc=dom.window.document;assert.equal(doc.querySelectorAll('blockquote').length,8,'No quotation is duplicated purely for decoration');
 assert.ok(![...doc.querySelectorAll('h2,h3,h4')].some(heading=>heading.textContent.trim()==='Introduction'),'The internal CMS opening-section label is not shown as an article heading');
 const text=doc.body.textContent;for(const quote of sourceQuotes){const occurrences=text.split(quote.text).length-1;assert.equal(occurrences,1,'Each source quote appears exactly once in the article body');}
 assert.match(text,/outscore[\s\S]*Will[\s\S]*(?:eight|8) points/i);assert.match(text,/not[\s\S]*(?:existing|current)[\s\S]*(?:championship )?lead/i,'The +8 clinch target is distinguished from an existing points lead');assert.ok(!/\b(?:606|281|326)\b/.test(text),'October standings numbers are not reused as post-Iowa standings');
 const relatedPanel=doc.querySelector('[data-mx-related]');assert.ok(relatedPanel,'The existing Kmart Chase feature is actually rendered, rather than merely passing an empty link loop');const relatedLinks=relatedPanel.querySelectorAll('a');assert.equal(relatedLinks.length,1);const relatedAnchor=relatedLinks[0];assert.equal(relatedAnchor.getAttribute('href'),`/news/${related.slug}/`);assert.equal(relatedAnchor.querySelector('span')?.textContent,related.title,'The card displays the existing story title');assert.equal(relatedAnchor.querySelector('small')?.textContent,related.date,'The card displays the actual source publication date');const footerLinks=doc.querySelector('.mx-next__links');assert.ok(footerLinks);assert.ok(footerLinks.compareDocumentPosition(relatedPanel)&dom.window.Node.DOCUMENT_POSITION_FOLLOWING,'The related story follows the footer Next Event and Back/Share links');
 for(const anchor of doc.querySelectorAll('a[href^="/news/"]')){const target=anchor.getAttribute('href').split('/').filter(Boolean);if(target.length===2)assert.ok(news.some(story=>story.slug===target[1]),'Related-story and article links reference existing newsroom entries');}
}finally{dom.window.close();}
assert.equal(story.image,'/images/social/default-social.png');assert.equal(story.socialImage,story.image);assert.ok(fs.existsSync(new URL(`public${story.image}`,root)),'The approved generic brand image exists; no fictional car/circuit photograph is introduced');
const seed=require('../netlify/lib/_content.cjs').seeds(),old=structuredClone(seed);old.news=old.news.filter(story=>story.slug!==slug);const standingsBefore=JSON.stringify(old.standings),resultsBefore=old.results.map(result=>[result.scheduleId,result.entries]);
const merged=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(old);assert.equal(merged.news.filter(story=>story.slug===slug).length,1,'An older published news collection gains the approved new story once');assert.equal(merged.news.find(story=>story.slug===slug).featured,false);assert.deepEqual(merged.news.filter(story=>story.featured).map(story=>story.slug),['hailey-bell-nrrs-season-3-review']);assert.equal(JSON.stringify(merged.standings),standingsBefore,'An interview does not advance or replace live standings');assert.deepEqual(merged.results.map(result=>[result.scheduleId,result.entries]),resultsBefore,'The supplied Iowa P4 context does not invent a full result or points record');
const edited=structuredClone(merged);edited.news.find(story=>story.slug===slug).sections[0].paragraphs[0]='Later approved CMS editorial edit.';assert.equal(require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(edited).news.find(story=>story.slug===slug).sections[0].paragraphs[0],'Later approved CMS editorial edit.','A subsequent same-revision CMS edit remains authoritative');
console.log('PASS: independently hashed complete source copy, 55 paragraph/quote references, seven pull quotes + ordinary quote, five sections, exact SCR #15 Dodge/pre-race/+8 identity, Eastern/DST start and neutral expiration, computed reading time/structured metadata, approved fallback media, actual related-story title/date/link, archived/canonical publication and unchanged standings/results.');
