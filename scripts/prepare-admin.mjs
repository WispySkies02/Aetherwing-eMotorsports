import fs from 'node:fs';
import { createRequire } from 'node:module';
const { seeds } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
fs.mkdirSync(new URL('../public/data/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../public/data/site-admin-seed.json',import.meta.url),JSON.stringify(seeds(),null,2)+'\n');
fs.copyFileSync(new URL('../src/data/confirmed-racing-updates.json',import.meta.url),new URL('../public/data/confirmed-racing-updates.json',import.meta.url));
console.log('Admin editor seeds and reviewed racing updates prepared.');
