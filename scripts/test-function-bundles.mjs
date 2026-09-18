import { zipFunctions } from '@netlify/zip-it-and-ship-it';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=fileURLToPath(new URL('../../admin-function-bundles/',import.meta.url));
const main=await zipFunctions(fileURLToPath(new URL('../netlify/functions/',import.meta.url)),destination,{basePath:root,config:{'*':{nodeBundler:'esbuild',nodeVersion:'22',includedFiles:['data/paint-seed.json','src/data/*.json'],includedFilesBasePath:root}}});
if(main.length!==4)throw new Error(`Expected exactly 4 main functions, found ${main.length}`);
for(const fn of main){if(fn.runtimeAPIVersion!==2)throw new Error(`${fn.name} is not a modern function`);console.log(`Bundled ${fn.name} (modern API)`);}
const booth=await zipFunctions(fileURLToPath(new URL('../../aetherwing_paint_public/netlify/functions/',import.meta.url)),fileURLToPath(new URL('../../booth-function-bundles/',import.meta.url)),{config:{'*':{nodeBundler:'esbuild',nodeVersion:'22'}}});
if(booth.length!==2)throw new Error('Expected exactly two read-only Booth functions.');
console.log('PASS: packaged all 4 main-site functions and 2 read-only Paint Booth functions.');
