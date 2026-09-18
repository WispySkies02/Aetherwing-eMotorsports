import fs from 'node:fs';
import { createRequire } from 'node:module';
const { seeds } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
fs.mkdirSync(new URL('../public/data/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../public/data/site-admin-seed.json',import.meta.url),JSON.stringify(seeds(),null,2)+'\n');
console.log('Admin editor seeds prepared.');
