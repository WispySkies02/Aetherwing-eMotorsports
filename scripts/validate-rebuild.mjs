import { existsSync,readFileSync } from 'node:fs';
const needed=['src/pages/index.astro','src/pages/schedule/index.astro','src/pages/drivers/index.astro','src/pages/championships/index.astro','src/pages/paint-booth/index.astro','src/pages/partners/index.astro','src/pages/news/index.astro','src/pages/history/index.astro','src/pages/event/[slug].astro','src/pages/programs/index.astro','public/images/textures/aetherwing-editorial.webp','public/admin/index.html'];
for(const file of needed)if(!existsSync(file))throw Error(`Missing site asset: ${file}`);
for(const name of ['schedule-events','drivers','charters','results','standings','driver-portfolios','partners','paints','news']){const content=JSON.parse(readFileSync(`src/data/${name}.json`,'utf8'));if(!Array.isArray(content)||!content.length)throw Error(`Empty or invalid ${name} dataset`);}
const standings=JSON.parse(readFileSync('src/data/standings.json','utf8'));
const kmart=standings.find((board)=>board.id==='kmart');
if(!kmart||!Array.isArray(kmart.rows)||kmart.rows.length<17)throw Error('Kmart standings must include the full 17-driver grid.');
if(kmart.cutoffAfter!==6)throw Error('Kmart Chase cutoff must remain after P6.');
if(!Array.isArray(kmart.ptEntry?.drivers)||kmart.ptEntry.drivers.length<3)throw Error('Kmart standings must include all three part-time ineligible drivers.');

const drivers=JSON.parse(readFileSync('src/data/drivers.json','utf8'));
const kmart29=drivers.filter((driver)=>driver.competitionId==='kmart'&&String(driver.number)==='29');
if(kmart29.length!==3||!['Clutch','Eazy','Matty'].every((name)=>kmart29.some((driver)=>driver.displayName===name)))throw Error('Kmart #29 must remain three driver-specific part-time assignments.');
const charters=JSON.parse(readFileSync('src/data/charters.json','utf8'));
if(charters.some((board)=>(board.fullTime||[]).some((slot)=>!Object.hasOwn(slot,'numberImage'))||(board.openCharters||[]).some((charter)=>(charter.uses||[]).some((use)=>!Object.hasOwn(use,'numberImage')))))throw Error('Charter number identities must keep editable numberImage fields.');
const profileSource=readFileSync('src/pages/drivers/[slug].astro','utf8');
if(!profileSource.includes("d['driver-portfolios']")||!profileSource.includes('data-profile-partners'))throw Error('Driver profiles must stay synchronized with live Driver Portfolios.');
const lineupSource=readFileSync('src/components/DriverLineup.astro','utf8');
if(!lineupSource.includes("alliance=e.affiliation==='alliance'")||!lineupSource.includes('STARCLUTCH RACING'))throw Error('Driver Lineup must retain partner-team roster support.');

const seasonal=readFileSync('public/seasonal-theme.js','utf8');
for(const id of ['summer-end','halloween-teaser','halloween','halloween-week','fall','christmas-teaser','christmas','christmas-week','calm-winter','new-year','clean-winter','valentine-teaser','valentine','late-winter','spring','st-patrick','easter','memorial','summer','independence'])if(!seasonal.includes(`'${id}'`))throw Error(`Missing seasonal theme: ${id}`);
const baseLayout=readFileSync('src/layouts/Base.astro','utf8');
if(!baseLayout.includes('aw-season-glass')||!baseLayout.includes('/seasonal-theme.js'))throw Error('Public layout must retain the seasonal front-glass system.');
const adminHtml=readFileSync('public/admin/index.html','utf8');
if(!adminHtml.includes('data-theme-lab')||!adminHtml.includes('data-admin-tab="themes"')||!existsSync('public/admin/theme-lab.js'))throw Error('Admin Theme Lab must remain available.');

if(existsSync('src/pages/schedule/share'))throw Error('Legacy share-only pages remain.');
console.log('Fresh routes, existing data, background, and admin source verified.');
