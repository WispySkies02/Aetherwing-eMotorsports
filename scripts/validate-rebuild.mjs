import { existsSync,readFileSync } from 'node:fs';
const needed=['src/pages/index.astro','src/pages/schedule/index.astro','src/pages/drivers/index.astro','src/pages/championships/index.astro','src/pages/paint-booth/index.astro','src/pages/partners/index.astro','src/pages/news/index.astro','src/pages/history/index.astro','src/pages/event/[slug].astro','src/pages/programs/index.astro','public/images/textures/aetherwing-editorial.webp','public/admin/index.html'];
for(const file of needed)if(!existsSync(file))throw Error(`Missing site asset: ${file}`);
for(const name of ['schedule-events','drivers','charters','results','standings','driver-portfolios','partners','paints','news']){const content=JSON.parse(readFileSync(`src/data/${name}.json`,'utf8'));if(!Array.isArray(content)||!content.length)throw Error(`Empty or invalid ${name} dataset`);}
const standings=JSON.parse(readFileSync('src/data/standings.json','utf8'));
const kmart=standings.find((board)=>board.id==='kmart');
if(!kmart||!Array.isArray(kmart.rows)||kmart.rows.length<17)throw Error('Kmart standings must include the full 17-driver grid.');
if(kmart.cutoffAfter!==6)throw Error('Kmart Chase cutoff must remain after P6.');
if(!Array.isArray(kmart.ptEntry?.drivers)||kmart.ptEntry.drivers.length<3)throw Error('Kmart standings must include all three part-time ineligible drivers.');
if(existsSync('src/pages/schedule/share'))throw Error('Legacy share-only pages remain.');
console.log('Fresh routes, existing data, background, and admin source verified.');
