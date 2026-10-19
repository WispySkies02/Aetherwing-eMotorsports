import assert from 'node:assert/strict';
import { zipFunctions } from '@netlify/zip-it-and-ship-it';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findPaintProject } from './paint-project.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=mkdtempSync(join(tmpdir(),'aetherwing-functions-'));
function verify(functions,expected) {
  assert.deepEqual(functions.map((fn)=>fn.name).sort(),Object.keys(expected).sort(),'Package exactly the deployed function names');
  for(const fn of functions) {
    assert.equal(fn.runtimeAPIVersion,expected[fn.name],`${fn.name} must retain its deployed function API`);
    assert.ok(statSync(fn.path).size>0,`${fn.name} bundle must exist and contain data`);
    console.log(`Bundled ${fn.name} (API v${fn.runtimeAPIVersion})`);
  }
}
try {
  const main=await zipFunctions(join(root,'netlify/functions'),join(destination,'main'),{
    basePath:root,
    config:{'*':{nodeBundler:'esbuild',nodeVersion:'24',includedFiles:['data/paint-seed.json','src/data/*.json'],includedFilesBasePath:root}}
  });
  verify(main,{'driver-art':2,'paint-3d-texture':2,'paint-3d-upload':1,'paint-admin':2,'paint-data':2,'site-admin':2,'site-data':2,'track-weather':2});
  const boothRoot=findPaintProject();
  if(boothRoot) {
    const booth=await zipFunctions(join(boothRoot,'netlify/functions'),join(destination,'booth'),{config:{'*':{nodeBundler:'esbuild',nodeVersion:'22'}}});
    verify(booth,{'paint-data':1});
    console.log('PASS: packaged all 8 main-site functions and the read-only Paint Booth proxy.');
  } else console.log('PASS: packaged all 8 main-site functions. SKIP: separate Paint Booth checkout absent; set AETHERWING_PAINT_PROJECT to include it.');
} finally {
  rmSync(destination,{recursive:true,force:true});
}
